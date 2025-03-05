import {
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  Put,
  Body, Delete, HttpException, Redirect, Res, Req, Query,
} from "@nestjs/common";
import { AppService } from './app.service';
import { DataSource } from "typeorm";
import { UsersService } from "./users/users.service";
import { AuthService } from "./auth/auth.service";
import {LocalAuthGuard} from "./auth/local-auth.guard";
import { Public, Userlevel } from "./decorators";
import {JwtRefreshGuard} from "./auth/jwt-refresh.guard";
import {SettingsService} from "./settings/settings.service";
import { MailService } from "./mail/mail.service";
import { EnumsService } from "./enums/enums.service";
import * as process from "process";
import {generators} from "openid-client";
import { Request, Response } from "express"
import {SocketGateway} from "./socket/socket.gateway";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private dataSource:DataSource, private usersService:UsersService, private authService:AuthService,
              private settingsService:SettingsService, private mailService:MailService, private enumsService:EnumsService,
              private socketGateway: SocketGateway) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('auth/login')
  async login(@Req() req, @Body() body) {
    return this.authService.login(req.user, body.fingerprint);
  }
  @Public()
  @Post('auth/extlogin')
  async extlogin(@Body() body){
    return this.authService.extLogin(body.token,body.fingerprint);
  }
  @Public()
  @Post('auth/register')
  async register(@Body() body) {
    if (parseInt(process.env.ALLOW_REGISTRATION||"0")===1) {
      const user = await this.authService.register(body,false,true);
      if (!user.error)
        return this.authService.login(user, body.fingerprint);
      else
        throw new HttpException(user.error,401);
    }
    else
      throw new HttpException('Registration not allowed.',403);
  }

  @Public()
  @Post('auth/reset')
  async reset(@Body() body) {
    return this.authService.requestReset({email:body.email,url:body.url});
  }
  @Public()
  @Get('auth/reset/:uuid')
  async testUuid(@Param() params) {
    return this.authService.uuidIsValid(params.uuid);
  }

  @Public()
  @Post('auth/reset/:uuid')
  async resetPassword(@Param() params,@Body() body) {
    return this.authService.resetPassword({uuid:params.uuid,pass:body.pass},body.fingerprint)
  }

  @Public()
  @Post('auth/confirm')
  async requestConfirm(@Body() body) {
    return this.authService.requestConfirmation({email:body.email,url:body.url});
  }

  @Userlevel(0)
  @Get('auth/confirm/:uuid')
  async confirm(@Param() params, @Body() body, @Req() req) {
    return this.authService.confirmIfValid({user:req.user,uuid:params.uuid});
  }

  @Post('auth/logout')
  async logout(@Req() req, @Body() body) {
    return this.authService.logout(req.user,body.fingerprint);
  }

  @Public()
  @UseGuards(JwtRefreshGuard) // => 'jwt-refresh' => JwtRefreshStrategy
  @Get('/auth/refresh/:fingerprint')
  async refreshToken(@Req() req,@Param() param) {
    const userId = req.user.id;
    const refreshToken = req.user.refreshToken;
    return this.authService.refreshTokens(userId, refreshToken,param.fingerprint);
  }

  @Get('/auth/profile')
  getProfile(@Req() req) {
    return req.user
  }

  @Public()
  @Get('/auth/oidc-redirect')
  @Redirect()
  async openidRedirect(@Res({passthrough:true}) res: Response, @Query("origin") originBase64:string, @Query("fingerprint") fingerprint:string) {
    const {client} = await this.appService.getOidc();
    const code_verifier = generators.codeVerifier();
    res.cookie('oidc_code_verifier', code_verifier, {
      sameSite: 'lax',
      httpOnly: true,
      secure: true,
    });
    try {
      const origin = atob(originBase64);
      res.cookie('oidc_origin', origin, {
        sameSite: 'lax',
        httpOnly: true,
        secure: true,
      });
    } catch (err) {}
    res.cookie('oidc_fingerprint', fingerprint, {
      sameSite: 'lax',
      httpOnly: true,
      secure: true,
    });
    const code_challenge = generators.codeChallenge(code_verifier);
    const url = client.authorizationUrl({
      scope: 'openid email profile',
      code_challenge,
      code_challenge_method: 'S256',
    });
    return {url, statusCode:302};
  }

  @Public()
  @Get('/auth/oidc-callback')
  @Redirect()
  async openidCallback(@Res({passthrough:true}) res: Response, @Req() req: Request) {
    const origin = req.cookies['oidc_origin']||"";
    const {client} = await this.appService.getOidc();
    const params = client.callbackParams(req);
    return {
      url:`${origin}${origin.match(/\?/) ? "&" : "?"}params=${btoa(JSON.stringify(params))}`
    }
  }

  @Public()
  @Post('/auth/oidclogin')
  async openidLogin(@Res({passthrough:true}) res: Response, @Req() req: Request) {
    const code_verifier = req.cookies['oidc_code_verifier'];
    const origin = req.cookies['oidc_origin']||"";
    const fingerprint = req.cookies['fingerprint'];
    const originBase = origin.match(/https?:\/\/[^/]+/);
    const {client} = await this.appService.getOidc();
    const params = client.callbackParams(req);
    const tokenSet = await client.callback(`${originBase}/api/auth/oidc-callback`, params, { code_verifier });
    const validatedClaims = tokenSet.claims();
    return await this.authService.oidcLogin(validatedClaims,fingerprint);
  }

  @Public()
  @Get('/auth/oidclogout')
  @Redirect()
  async openidLogout() {
    const {client} = await this.appService.getOidc();
    const url = client.endSessionUrl({
      client_id:process.env.OIDC_CLIENT_ID
    })
    return {
      url,
      statusCode:302
    }
  }

  @Get('/more')
  async getMore(): Promise<Array<any>> {
    return await this.dataSource.manager.query("select * from hvs");
  }

  @Userlevel(2)
  @Get('/users')
  async getUsers(): Promise<Array<any>> {
    return await this.usersService.findAll();
  }
  @Userlevel(0)
  @Get('/usernames')
  async getUsernames(): Promise<Array<any>> {
    return (await this.usersService.findAll()).map(user=>({id:user.id,name:user.username}));
  }
  @Userlevel(2)
  @Get('/users/:id')
  async getUser(@Param() params): Promise<Array<any>> {
    return await this.usersService.findOneById(params.id,false);
  }
  @Userlevel(2)
  @Delete('/users/:id')
  async deleteUser(@Param() params): Promise<any> {
    return await this.usersService.delete((params.id+"").split(","));
  }
  @Userlevel(0)
  @Put('/users/:id')
  async updateUser(@Param() params, @Body() body, @Req() req): Promise<any> {
    if (req.user.level>1 || params.id==req.user.id) {
      if (body.pass)
        return await this.authService.changePassword(params.id,body.pass);
      else
        return await this.usersService.update(params.id,body,req.user.level>1);
    }
  }
  @Userlevel(2)
  @Post('/users')
  async createUser(@Body() body): Promise<any> {
    if (body.list) {
      let {inserted,errors} = await this.usersService.createMultiple(body);
      for (let user of inserted) {
        if (user.password)
          await this.authService.changePassword(user.id,user.password);
      }
      if (errors && errors.length)
        return {errors:errors.map(err=>err.sqlMessage||err.code||err)};
    }
    else
      return await this.usersService.create(body);
  }
  @Userlevel(2)
  @Post('/users/sort')
  async sortUsers(@Body() body): Promise<any> {
    return await this.usersService.sort(body);
  }

  @Get('/users/:username/:password')
  async getUserByLogin(@Param() params): Promise<Array<any>> {
    return this.authService.validateUser(params.username,params.password);
  }

  @Userlevel(2)
  @Get('/settings')
  async getSettings(): Promise<Array<any>> {
    return await this.settingsService.findAll();
  }
  @Userlevel(2)
  @Get('/settings/:key')
  async getSetting(@Param() params): Promise<Array<any>> {
    return await this.settingsService.get(params.key);
  }
  @Userlevel(2)
  @Put('/settings/:key')
  async update(@Param() params, @Body() body): Promise<any> {
    return await this.settingsService.update(params.key,body.val)
  }

  @Userlevel(2)
  @Get('/mail/test/:to')
  async sendTestMail(@Param() params): Promise<any> {
    return await this.mailService.sendTestMail(params.to)
  }
  @Userlevel(2)
  @Post('/mail/send')
  async sendMail(@Body() body, @Req() req): Promise<any> {
    return await this.mailService.sendMail({to:[req.user.email],html:body.html,subject:body.subject});
    //return await this.mailService.sendMail(body)
  }

  @Userlevel(0)
  @Get('/enums/:key')
  async GetEnum(@Param() params): Promise<Array<any>> {
    return await this.enumsService.findAll(params.key);
  }
  @Get('/enums/ordered/:key')
  async GetEnumOrdered(@Param() params): Promise<Array<any>> {
    return await this.enumsService.findAll(params.key,true);
  }
  @Userlevel(2)
  @Put('/enums/:key/:id')
  async updateEnum(@Param() params, @Body() body, @Req() req): Promise<any> {
    return await this.enumsService.update(params.key,params.id,body);
  }
  @Userlevel(1)
  @Post('/enums/:key')
  async createEnum(@Param() params, @Body() body): Promise<any> {
    return await this.enumsService.create(params.key,body);
  }
  @Userlevel(2)
  @Delete('/enums/:key/:id')
  async deleteEnum(@Param() params): Promise<any> {
    return await this.enumsService.delete(params.key,params.id);
  }
  @Userlevel(2)
  @Post('/enums/:key/sort')
  async sortEnum(@Body() body, @Param() params): Promise<any> {
    return await this.enumsService.sort(params.key,body);
  }
}
