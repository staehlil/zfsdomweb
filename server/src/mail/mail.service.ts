import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import {SettingsService} from "../settings/settings.service";
import * as nodemailer from "nodemailer";
import * as uuid from "uuid";

@Injectable()
export class MailService {
  constructor(private dataSource: DataSource, private settingsService: SettingsService) {
  }
  async sendMail(args) {
    const decrypted = await this.settingsService.findAll(true);
    const transporter = nodemailer.createTransport({
      host: decrypted["mail-host"],
      port: decrypted["mail-port"],
      secure: decrypted["mail-ssl"]==='true', // true for 465, false for other ports
      auth: {
        user: decrypted["mail-user"],
        pass: decrypted["mail-pass"]
      },
    });
    args = {
      from:decrypted["mail-user"],
      fromName:decrypted["mail-name"],
      ...args
    }

    const id = uuid.v4();
    try {
      const info = await transporter.sendMail({
        from:{
          address:args.from||"",
          ...args.fromName ? {name:args.fromName} : {}
        },
        to:(args.to||[]).join(","),
        subject:args.subject||"",
        html:args.html||"",
        text:(args.text||args.html||"").replace(/[^\s\n\r\w]+/g,""),
        dsn: {
          id,
          return: 'headers',
          notify: ['success','failure'],
          recipient: args.to.length ? args.to[0] : ""
        },
        attachments:args.attachments
      });
      console.log("Message sent: %s", info.messageId);
      return {success:"Message sent: "+info.messageId};
    } catch (error) {
      return {error};
    }
  }
  async sendTestMail(to="") {
    const result = await this.sendMail({
      to:[to||"mail@codefury.ch"],
      subject:"Test",
      html:"Guten Tag<br><br>Eine <b>Test-E-Mail!<br><br>Freundliche Grüsse<br>--"
    })
    if (result.error) {
      throw new HttpException({
        status:HttpStatus.INTERNAL_SERVER_ERROR,
        error:result.error.response
      },HttpStatus.INTERNAL_SERVER_ERROR);
    }
    else
      return result;
  }
}
