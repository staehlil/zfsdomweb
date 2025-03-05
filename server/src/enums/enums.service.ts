import { Injectable } from '@nestjs/common';
import { DataSource } from "typeorm";

@Injectable()
export class EnumsService {
  static allowedKeys = ["sections", "categories_credits", "items"]
  constructor(protected dataSource: DataSource) {
  }
  async findAll(key,userSorted=false): Promise<any | undefined> {
    return EnumsService.allowedKeys.indexOf(key)>-1 ? await this.dataSource.manager.query(
`select ${key}.*${userSorted ? ',numSort' : ''} from ${key}${userSorted ? ` left join ${key}_order as _o on _o.id=${key}.id` : ''} order by ${userSorted ? 'numSort' : `${key}.id`}`
    ) : [];
  }
  async update(key,id,data) {
    const qMarks = [], values = [];
    if (EnumsService.allowedKeys.indexOf(key)>-1) {
      for (const k in data) {
          qMarks.push(k+"=?");
          values.push(data[k]);
      }
    }
    return await this.dataSource.manager.query(`update ${key} set ${qMarks.join(",")} where id=?`,[...values,id]);
  }
  async create(key,data) {
    const qMarks = [], values = [], keys = [];
    if (EnumsService.allowedKeys.indexOf(key)>-1) {
      for (let k in data) {
        qMarks.push("?");
        keys.push(k);
        values.push(data[k]);
      }
    }
    const {insertId} = await this.dataSource.manager.query(`insert into ${key} (${keys.join(",")}) values (${qMarks.join(",")})`,[...values]);
    return {insertId};
  }
  async delete(key,id) {
    if (EnumsService.allowedKeys.indexOf(key)>-1) {
      return await this.dataSource.manager.query(`delete from ${key} where id=?`,[id]);
    }
  }
  async sort(key,{order}:{order:Array<number>}) {
    let numSort=0;
    const data = order.map(item=>{return [item,++numSort];})
    await this.dataSource.manager.query(`insert into ${key}_order (id,numSort) values ? on duplicate key update id=values(id),numSort=values(numSort)`,[data]);
  }
}
