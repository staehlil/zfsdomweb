import {ForbiddenException, HttpException, HttpStatus, Injectable} from "@nestjs/common";
import { UsersService } from '../users/users.service';
import * as crypto from "crypto";
import {JwtService} from "@nestjs/jwt";
import { BinaryLike, randomUUID } from "crypto";
import { jwtConstants } from "./constants";
import { DataSource } from "typeorm";
import { MailService } from "../mail/mail.service";
import * as jwt from 'jsonwebtoken';
import * as process from "process";

@Injectable()
export class AuthService {
  static RESET_REQUEST_MAX_LIFETIME_SECONDS=1800;
  static CONFIRMATION_REQUEST_MAX_LIFETIME_SECONDS=3600;
  static CONFIRMATION_POSTPONE_SECONDS=900;
  constructor(private usersService: UsersService, private jwtService:JwtService, private dataSource: DataSource, private mailService:MailService) {}

  onModuleInit() {
    this.createDefaultAdminUser();
  }

  private async createDefaultAdminUser() {
    const { insertId:userId } = await this.usersService.create({
      username:process.env.APP_USER || "admin",
      confirmation:true,
      level:2
    },false,false);
    if (userId)
      await this.changePassword(userId,process.env.ADMIN_PWD||"ULTIMATE_SECURE_PASSWORD_STRING");
  }

  private hash(str:string,salt:BinaryLike=null) {
    const hash = crypto.createHash("sha512").update(str);
    return (salt!==null ? hash.update(salt) : hash).digest("hex");
  }

  private randomSalt() {
    return crypto.randomBytes(64).toString("hex");
  }

  private encrypt(p) {
    const salt = this.randomSalt();
    const password = this.hash(this.hash(p), salt);
    return {password, salt};
  }

  async validateUser(username: string, password: string): Promise<any> {
    const extvalidationBaseUrl = process.env.LDAP_VALIDATION_BASEURL ? process.env.LDAP_VALIDATION_BASEURL.replace(/\/$/g,"") : false;
    let localValidationSuccess = false;
    let user = await this.usersService.findOne(username,true);
    if (user) {
      const passwordHash = this.hash(password);
      const saltedHash = this.hash(passwordHash, user.salt);
      localValidationSuccess = saltedHash===user.password
    }
    if (!(user && localValidationSuccess) && extvalidationBaseUrl!==false) {
      try {
        const response = await fetch(`${extvalidationBaseUrl}/api/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            shortname:username,
            password
          })
        });
        let data:any = await response.json();
        if (data.cn!==username)
          return false;

        if (!user)
          user = await this.registerExternal({username,email:data.mail,confirmation:false,level:0});
        if (!user.id || user.error)
          return false;
      } catch (error) {
        console.error('Error:', error);
        return false;
      }
    }
    else if (!localValidationSuccess)
      user=null;
    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const {password:p,salt,...unclassified} = user;
      return unclassified;
    }
    return false;
  }

  async login({username,id,subdomains},fingerprint) {
    const payload = {username,sub:id,subdomains}
    const accessToken = this.jwtService.sign(payload,{
      secret:jwtConstants.tokenSecret,
      expiresIn:'1min'
    });
    const refreshToken = this.jwtService.sign(payload,{
      secret:jwtConstants.refreshSecret,
      expiresIn:'1d'
    });
    await this.usersService.updateRefreshToken(id,this.hash(refreshToken),fingerprint);
    return {accessToken,refreshToken};
  }

  async register({email,password},confirm=false,postponeConfirmationPrompt=false) {
    let inserted = await this.usersService.createFromEmail(email,confirm,postponeConfirmationPrompt ? AuthService.CONFIRMATION_POSTPONE_SECONDS : false);
    if (!inserted.error) {
      await this.changePassword(inserted.insertId,password);
      return await this.usersService.findOneById(inserted.insertId);
    }
    return inserted;
  }

  async registerExternal(data,postponeConfirmation=false,autoUnique=false) {
    let inserted = await this.usersService.create(data,postponeConfirmation, autoUnique);
    if (!inserted.error) {
      await this.changePassword(inserted.insertId,randomUUID());
      return await this.usersService.findOneById(inserted.insertId);
    }
    return inserted;
  }

  async logout({id},fingerprint) {
    await this.usersService.updateRefreshToken(id,"", fingerprint);
  }

  async refreshTokens(userId,refreshToken,fingerprint) {
    /* check if refreshToken matches the saved one and if so, return new access and refresh tokens  */
    const user = await this.usersService.findOneById(userId);
    if (user && user.refreshToken && this.usersService.isValidRefreshToken(user.id,this.hash(refreshToken)))
      return this.login(user,fingerprint);
    throw new ForbiddenException('Access Denied');
  }

  async changePassword(userId,pass) {
    return await this.usersService.updatePassword(userId,await this.encrypt(pass))
  }

  async requestReset({ email,url }) {
    const user = await this.usersService.findOneByEmail(email)
    if (user!==null) {
      const uuid = randomUUID();
      await this.dataSource.manager.query("insert into resetrequests(idUser,uuid) values (?,?)",[user.id,uuid]);
      return this.mailService.sendMail({
        to:[user.email],
        subject:"Passwort zurücksetzen",
        html:`Sie können das Passwort für '${user.email}' unter folgendem Link zurücksetzen:<br><a href="${url}/${uuid}" target="_blank">${url}/${uuid}</a>"`
      })
    }
    else
      throw new HttpException({
        status: HttpStatus.NOT_FOUND,
        error: 'Unbekannter Benutzer',
      }, HttpStatus.NOT_FOUND);
  }

  async uuidIsValid(uuid) {
    return {valid:(await this.dataSource.manager.query(`select uuid from resetrequests where (uuid=? and timestampdiff(second,created,now())<${AuthService.RESET_REQUEST_MAX_LIFETIME_SECONDS} and not used)`,[uuid])).length>0};
  }

  async getUuid(uuid) {
    const data = await this.dataSource.manager.query(`select * from resetrequests where (uuid=? and timestampdiff(second,created,now())<${AuthService.RESET_REQUEST_MAX_LIFETIME_SECONDS} and not used)`,[uuid]);
    return data.length ? data[0] : null;
  }

  async resetPassword({uuid, pass},fingerprint) {
    const data = await this.getUuid(uuid);
    if (data) {
      await this.changePassword(data.idUser,pass)
      await this.dataSource.manager.query("update resetrequests set used=true where uuid=?",[uuid]);
      const user = await this.usersService.findOneById(data.idUser);
      if (user!==null)
        return await this.login(user,fingerprint);
      else
        throw new HttpException({
          status: HttpStatus.NOT_FOUND,
          error: 'Unbekannter Benutzer',
        }, HttpStatus.NOT_FOUND);
    }
    else
      throw new HttpException({
        status: HttpStatus.NOT_FOUND,
        error: 'Unbekannter Benutzer',
      }, HttpStatus.NOT_FOUND);
  }

  async requestConfirmation({ email,url }) {
    const user = await this.usersService.findOneByEmail(email)
    if (user!==null) {
      const uuid = randomUUID();
      await this.dataSource.manager.query("insert into confirmationrequests(idUser,uuid) values (?,?)",[user.id,uuid]);
      return this.mailService.sendMail({
        to:[user.email],
        subject:"Konto bestätigen",
        html:`Bitte bestätigen Sie Ihre E-Mail Adresse '${user.email}', indem Sie auf den nachfolgenden Link klicken:<br><a href="${url}/${uuid}" target="_blank">${url}/${uuid}</a>"`
      })
    }
    else
      throw new HttpException({
        status: HttpStatus.NOT_FOUND,
        error: 'Unbekannter Benutzer',
      }, HttpStatus.NOT_FOUND);
  }

  async confirmIfValid({user,uuid}) {
    const valid = (await this.dataSource.manager.query(`select uuid from confirmationrequests where (idUser=? and uuid=? and timestampdiff(second,created,now())<${AuthService.CONFIRMATION_REQUEST_MAX_LIFETIME_SECONDS} and not used)`,[user.id,uuid])).length>0;
    if (valid) {
      await this.usersService.update(user.id,{confirmation:true});
      await this.dataSource.manager.query("update confirmationrequests set used=true where uuid=?",[uuid]);
    }
    return {valid};
  }

  async extLogin(extAccessToken,fingerprint) {
    try {
      const decoded:any = jwt.verify(extAccessToken, process.env.EXTAUTH_TOKEN_SECRET);
      const localUser = await this.usersService.findOne(decoded.username)
      return this.login({...localUser},fingerprint);
    } catch (err) {
      console.error('Invalid token:', err.message);
      return null;
    }
  }

  async oidcLogin(validatedClaims,fingerprint="none"): Promise<boolean|{accessToken,refreshToken}> {
    try {
      const email = validatedClaims.email;
      if (!email)
        return false;
      let user = await this.usersService.findOne(email,true)
      if (!user) {
        if (parseInt(process.env.ALLOW_REGISTRATION||"0")===1) {
          let username = email.replace(/@.+$/g,"").toLowerCase().replace(/[-.]/g,"");
          user = await this.registerExternal({
            username,email,confirmation:true,level:0,jsonData:JSON.stringify({
              matriculationNumber:validatedClaims.matrikelnummer,
              uniqueID:validatedClaims.uniqueID,
            }),
            groups:"aai"
          },false,true);
        }
        else
          user = {error:"Registration disallowed"};
      }
      if (!user?.id || user.error)
        return user || false;
      return this.login({...user},fingerprint);
    } catch (err) {
      console.error('Invalid token:', err.message);
      return null;
    }
  }
}