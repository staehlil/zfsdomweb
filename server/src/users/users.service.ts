import { Injectable } from '@nestjs/common';
import { DataSource } from "typeorm";

@Injectable()
export class UsersService {
  private static UserKeys = ["username","email","confirmation","level","expired","jsonData"];
  private static unprivilegedDataKeys = ["firstName","lastName"];
  private static GroupsKey = "groups";
  private static echoRefreshTokenLifetime = 1000;
  constructor(private dataSource: DataSource) {
  }
  private decorateUsers(list) {
    return list;
  }
  async findOne(username: string,allowEmailAsUsername=false): Promise<any | undefined> {
    const users = await this.dataSource.manager.query(`select users.* from users where (username=?${allowEmailAsUsername ? " or email=?" : ""}) group by users.id`,[username,...allowEmailAsUsername ? [username] : []]);
    return users.length ? this.decorateUsers(users)[0] : null;
  }
  async findOneById(id: number, includeTokens=true): Promise<any | undefined> {
    const users = await this.dataSource.manager.query("select u.id,username,email,if(confirmation or confirmation_postpone>now(),true,false) as confirmation,level,expired"+(includeTokens ? ",refreshToken,ifnull(json_value(jsonData,'$.echoRefreshToken'),'') as echoRefreshToken" : "")+", u.jsonData, ifnull(group_concat(distinct g.name),'') as groups from users as u left join users_groups as uxg on uxg.userId=u.id left join groups as g on g.id=uxg.groupId where u.id=? group by u.id",[id]);
    return users.length ? this.decorateUsers(users)[0] : null;
  }
  async findOneByEmail(email: string, includeTokens=true): Promise<any | undefined> {
    const users = await this.dataSource.manager.query("select u.id,username,email,if(confirmation or confirmation_postpone>now(),true,false) as confirmation,level,expired"+(includeTokens ? ",refreshToken" : "")+", u.jsonData from users as u where u.email=? group by u.id",[email]);
    return users.length ? this.decorateUsers(users)[0] : null;
  }
  async findAll(): Promise<any | undefined> {
    return await this.dataSource.manager.query("select u.*,x.numSort, ifnull(group_concat(g.name),'') as groups  from users as u left join usersXorder as x on x.idUser=u.id left join users_groups as uxg on uxg.userId=u.id left join groups as g on g.id=uxg.groupId group by u.id order by x.numSort,u.id");
  }
  async findRefreshTokensByUserId(userId: number) {
    let item = await this.dataSource.manager.query("select refreshToken from users where id=?",[userId]);
    if (item.length)
      item = item[0];
    let listTokens = [];
    try {
      listTokens = Object.values(JSON.parse(item[0].refreshToken)||{})
    } catch (err) {}
    return listTokens;
  }
  async isValidRefreshToken(userId: number,refreshToken: string) {
    return (await this.findRefreshTokensByUserId(userId)).find(token=>token===refreshToken);
  }
  async updateRefreshToken(userId,refreshToken,fingerprint) {
    /* retain old refreshToken... */
    await this.dataSource.manager.query(`update users as dest,
(select json_extract(refreshToken,'$.${fingerprint}') as currentToken from users where id=?) as src 
set dest.refreshToken=json_merge_patch(dest.refreshToken,json_object("${fingerprint}_echo",src.currentToken))
where dest.id=?`,[userId,userId])
    let out = await this.dataSource.manager.query(`update users set refreshToken=json_merge_patch(refreshToken,json_object("${fingerprint}","${refreshToken}")) where id=?`,[userId])

    setTimeout(()=>{
      /* ...and destroy it after the echo ends */
      this.dataSource.manager.query(`update users set refreshToken = json_remove(refreshToken,'$.${fingerprint}_echo') where id=?`,[userId]);
    },UsersService.echoRefreshTokenLifetime)
    return out;
  }
  async update(id,data,privileged=false) {
    const qMarks = [], values = [];

    // sanitize data.jsonData (restrict to unprivileged keys) if update is called by an unprivileged user
    if (!privileged && data && data["jsonData"]) {
      try {
        let jsonData = JSON.parse["jsonData"];
        for (let key in jsonData) {
          if (!UsersService.unprivilegedDataKeys.some(k=>k===key))
            delete jsonData[key];
        }
        data["jsonData"] = jsonData;
      } catch (err) {}
    }

    UsersService.UserKeys.forEach(key=>{
      if (typeof data[key]!=="undefined") {
        qMarks.push(key+"=?");
        values.push(data[key]);
      }
    });
    let updated = null;
    if (typeof data[UsersService.GroupsKey]!=="undefined") {
      let groups = data[UsersService.GroupsKey].split(",").filter(name=>name);
      updated = await this.updateGroupRelations(id,groups);
    }
    if (qMarks.length)
      updated = await this.dataSource.manager.query("update users set "+qMarks.join(",")+" where id=?",[...values,id]);
    return updated;
  }
  async updatePassword(id,{password,salt}) {
    return await this.dataSource.manager.query("update users set password=?,salt=?,expired=0 where id=?",[password,salt,id]);
  }
  async create(data,postponeConfirmation:boolean|number=false,autoUnique=true) {
    if (autoUnique) {
      let username = data.username||"default";
      let listExistingUsernames = (await this.findAll()).map(u=>u.username);
      let i=0;
      while (listExistingUsernames.indexOf(`${username}${i>0 ? `${i}` : ""}`)>-1)
        i++;
      username = `${username}${i>0 ? `${i}` : ""}`;
      data.username = username;
    }

    const qMarks = [], values = [], keys = [];
    UsersService.UserKeys.forEach(key=>{
      if (typeof data[key]!=="undefined") {
        qMarks.push("?");
        keys.push(key);
        values.push(data[key]);
      }
    });
    try {
      const {insertId} = await this.dataSource.manager.query(`insert into users (${keys.join(",")}${postponeConfirmation!==false ? ",confirmation_postpone":""}) values (${qMarks.join(",")}${postponeConfirmation!==false ? `,DATE_ADD(now(), INTERVAL ${postponeConfirmation} SECOND)`:""})`,[...values]);
      if (insertId && data[UsersService.GroupsKey]) {
        let groups = data[UsersService.GroupsKey].split(",").filter(name=>name);
        await this.updateGroupRelations(insertId,groups);
      }
      return {insertId};
    } catch (error) {
      return {insertId:0,error};
    }
  }
  async createFromEmail(email,confirmation=false,postponeConfirmation:boolean|number =false) {
    let listExistingUsernames = (await this.findAll()).map(u=>u.username);
    let username = email.replace(/@.+$/g,"").toLowerCase().replace(/[-\.]/g,"");
    let i=0;
    while (listExistingUsernames.indexOf(`${username}${i>0 ? `${i}` : ""}`)>-1)
      i++;
    return await this.create({
      username:`${username}${i>0 ? `${i}` : ""}`,
      email,
      confirmation,
      level:0,
    },postponeConfirmation);
  }
  async createMultiple({list}) {
    let inserted = [];
    let errors = [];
    for (let data of list) {
      try {
        const {insertId} = await this.create(data);
        if (insertId)
          inserted.push({id:insertId,password:data.password});
      } catch (err) {
        errors.push(err);
      }
    }
    return {inserted,errors};
  }
  async delete(listId) {
    let qMarks = listId.map(()=>"?");
    return await this.dataSource.manager.query(`delete from users where id in (${qMarks.join(',')})`,listId);
  }
  async sort({order}) {
    let numSort=0;
    let data = order.map(item=>{return [item,++numSort];})
    await this.dataSource.manager.query("insert into usersXorder(idUser,numSort) values ? on duplicate key update idUser=values(idUser),numSort=values(numSort)",[data]);
  }
  async ensureGroupId(name) {
    let select = await this.dataSource.manager.query("select id from groups where name=?",[name]);
    if (select.length)
      return select[0].id;
    else {
      let insert = await this.dataSource.manager.query("insert into groups (name) values (?) on duplicate key update name=values(name)",[name]);
      return insert.insertId||0;
    }
  }
  async updateGroupRelations(userId,groupNames) {
    let groupIds = await Promise.all(groupNames.map(async (name)=>{
      return await this.ensureGroupId(name);
    }));
    await this.dataSource.manager.query("delete from users_groups where userId=?",[userId]);
    return groupNames.length ?
        await this.dataSource.manager.query(`insert into users_groups (userId,groupId) values ${groupIds.map(()=>"(?,?)").join(",")}`,groupIds.map(groupId=>[userId,groupId]).flat())
        : {};
  }
}
