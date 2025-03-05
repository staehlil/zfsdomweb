import { Injectable } from '@nestjs/common';
import { DataSource } from "typeorm";
import * as CryptoJS from "crypto-js";
import {settingsConstants} from "../auth/constants";

@Injectable()
export class SettingsService {
  private static EncryptedKeys = ["mail-pass"];
  constructor(private dataSource: DataSource) {
  }
  private encrypt(val) {
    return CryptoJS.AES.encrypt(val,settingsConstants.secret).toString();
  }
  private decrypt(val) {
    return CryptoJS.AES.decrypt(val,settingsConstants.secret).toString(CryptoJS.enc.Utf8)
  }
  async findAll(_decrypt=false): Promise<any | undefined> {
    const list = await this.dataSource.manager.query("select * from settings");
    const map = {};
    list.forEach(({_key,val})=>{
      map[_key] = _decrypt && SettingsService.EncryptedKeys.indexOf(_key)>-1 ? this.decrypt(val) : val;
    });
    return map;
  }
  async get(key,_decrypt=false): Promise<any | undefined> {
    const decrypt = _decrypt && SettingsService.EncryptedKeys.indexOf(key)>-1;
    const item = await this.dataSource.manager.query("select * from settings where _key=?",[key]);
    const _val = item.length ? item[0].val : null;
    return decrypt && _val!==null ? this.decrypt(_val) : _val;
  }
  async update(key,_val) {
    const encrypt = SettingsService.EncryptedKeys.indexOf(key)>-1;
    const val = encrypt ? this.encrypt(_val) : _val;
    await this.dataSource.manager.query("insert into settings(_key,val) values (?,?) on duplicate key update _key=values(_key),val=values(val)",[key,val]);
  }
}
