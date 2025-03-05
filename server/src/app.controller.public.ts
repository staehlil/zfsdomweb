import {Body, Controller, Get, HttpException, Post, Res} from "@nestjs/common";
import {Public} from "./decorators";
import {UsersService} from "./users/users.service";
import {AuthService} from "./auth/auth.service";
import * as crypto from "crypto";
import * as process from "process";
import {exec} from "node:child_process";

@Controller("public")
export class PublicAppController {
  constructor(private usersService:UsersService, private authService:AuthService) {
  }
  @Public()
  @Post('/auth/guest')
  async createGuest(@Body() body): Promise<any> {
    if (parseInt(process.env.ALLOW_GUESTS||"0")===1) {
      let username = `guest_${crypto.randomBytes(8).toString("hex")}`;
      let password = body.password || crypto.randomUUID();
      let {insertId} = await this.usersService.create({username,confirmation:true});
      if (insertId) {
        await this.authService.changePassword(insertId,password);
        return await this.authService.login({username,id:insertId,subdomains:""},body.fingerprint);
      }
    }
    else
      throw new HttpException('Guests not allowed.',403);
  }
  @Public()
  @Get('/health')
  async getHealth(@Res() res): Promise<any> {
      let health = true;
      res.status(health ? 200 : 503).send({
        network_share:health ? 1 : 0,
        time:new Date().toISOString()
      });
  }

  @Public()
  @Get("/whoami")
  async getWhoami() {
    return await new Promise((resolve)=>{
      exec("whoami",(error, stdout, stderr)=>resolve(stdout));
    });
  }
}