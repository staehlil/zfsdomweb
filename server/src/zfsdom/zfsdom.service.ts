import {HttpException, Injectable} from '@nestjs/common';
import {Zfsdom} from '../zfsdom';
import {SocketGateway} from "../socket/socket.gateway";
import * as pty from "node-pty";
import {DataSource} from "typeorm";
import { execSync } from 'child_process';

@Injectable()
export class ZfsdomService {
  static mapRunning = {};
  constructor(private socketGateway:SocketGateway, private dataSource: DataSource) {
  }
  async getDomains(host): Promise<any | undefined> {
    try {
      return await new Zfsdom().getDomains(host,true);
    } catch (error) {
      throw new HttpException(error.toString(),500,{  cause: new Error('Cause Error'), });
    }
  }
  async run(userId,config:{action:string, srcHost:string, domains:Array<string>, destHost:string, dryRun:boolean, force:boolean},uuid=null): Promise<any | undefined> {
    const {action, srcHost, domains, destHost, dryRun, force} = config;
    let domain = domains?.[0];
    await new Promise<void>(async (resolve) => {
      const cmd = "zfsdom";
      const cmdOptions = [action, `--domain ${srcHost}:${domain}`, ...destHost ? [destHost, ...!dryRun ? ["--do"] : [], ...!force ? ["--force"] : []] : []];
      const terminal = pty.spawn("bash", ["-c", `exec ${cmd} ${cmdOptions.join(" ")}`], {
        name: 'xterm-color',
        cols: 80,
        rows: 24,
        cwd: process.cwd(),
        env: process.env,
      });
      const targetKey = `${config.srcHost}_${config.domains.join("_")}`
      for (let uuid in ZfsdomService.mapRunning) {
        let task = ZfsdomService.mapRunning[uuid];
        if (`${task.config.srcHost}_${task.config.domains.join("_")}`===targetKey)
          delete ZfsdomService.mapRunning[uuid]
      }
      ZfsdomService.mapRunning[uuid] = {
        userId,
        config,
        terminal,
        done:false
      };
      const cmdlinePrefix = execSync("echo \"$(whoami)@$(hostname)\"").toString().trim();
      terminal.write(`${cmdlinePrefix}:~$ ${cmd} ${cmdOptions.join(" ")}\n`);
      terminal.onData(async (data) => {
        await this.socketGateway.emitUser(userId, "zfsdom-stdout", data);
        ZfsdomService.mapRunning[uuid].terminalData = ZfsdomService.mapRunning[uuid].terminalData || [];
        ZfsdomService.mapRunning[uuid].terminalData.push(data);
      });
      terminal.onExit(async ({exitCode:code, signal}) => {
        await this.dataSource.manager.query( `insert into tasks (uuid,done) values (?,?) on duplicate key update done=values(done)`,[uuid,1]);
        ZfsdomService.mapRunning[uuid].done = true;
        await this.socketGateway.emitUser(userId, "zfsdom-done", uuid);
        resolve();
      });
      await this.dataSource.manager.query( `insert into tasks (uuid,config,done) values (?,?,?) on duplicate key update config=values(config), done=values(done)`,[uuid,JSON.stringify(config),0]);
      await this.socketGateway.emitUser(userId, "zfsdom-started", {uuid,config});
    })
  }
  async get(uuid,userId=null) {
    const task = ZfsdomService.mapRunning[uuid];
    return {
      task: task && userId===null || task.userId===userId ? task : null
    }
  }
  async all(userId=null) {
    let map = {};
    Object.keys(ZfsdomService.mapRunning).map(uuid=>{
      const task = ZfsdomService.mapRunning[uuid];
      map[`${task.config.srcHost}_${task.config.domains.join("_")}`] = {terminalData:task.terminalData,config:task.config,userId:task.userId,uuid,done:task.done};
    })
    return map;
  }
  async abort(uuid,userId=null) {
    let task = ZfsdomService.mapRunning[uuid];
    if (task && userId===null || task.userId===userId) {
      task.terminal.write("\n=== Aborted ===\n")
      task.terminal.kill();
    }
  }
}
