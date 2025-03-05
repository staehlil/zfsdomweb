import { Injectable } from '@nestjs/common';
import {DataSource} from "typeorm";
import {BaseClient, Issuer} from "openid-client";
import * as process from "node:process";

@Injectable()
export class AppService {
  oidcClient:BaseClient=null;
  constructor(private dataSource:DataSource) {
  }
  async getOidc() {
    return {
      client:this.oidcClient || (this.oidcClient = await new Promise<BaseClient>(async resolve=>{
      try {
        const issuer = await Issuer.discover(process.env.OIDC_ISSUER);
        resolve(new issuer.Client({
          client_id: process.env.OIDC_CLIENT_ID,
          client_secret: process.env.OIDC_CLIENT_SECRET,
          redirect_uris: [process.env.OID_REDIRECT_URI],
          response_types: ['code'],
        }));
      } catch (err) {}
      }))
    }
  }
}
