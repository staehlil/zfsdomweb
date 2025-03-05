import {
  Body,
  Controller,
  Get, Param, Post, Req,
} from "@nestjs/common";
import {Userlevel} from "../decorators";
import {ZfsdomService} from "./zfsdom.service";
import * as uuid from "uuid";

@Controller("zfsdom")
export class ZfsdomController {
  constructor(private zfsdomService: ZfsdomService) {
  }

  @Userlevel(0)
  @Get('/domains/:host')
  async getDomains(@Param() params): Promise<Array<any>> {
    return await this.zfsdomService.getDomains(params.host);
  }

  @Userlevel(0)
  @Post('/run')
  async runDomainChange(@Body() body, @Req() req): Promise<any> {
    let _uuid = uuid.v4();
    (async ()=>{
      await this.zfsdomService.run(req.user?.id||0,body,_uuid);
    })();
    return {uuid:_uuid};
  }

  @Userlevel(0)
  @Get('/get/:uuid')
  async getDomainChange(@Param() params, @Req() req): Promise<any> {
    return await this.zfsdomService.get(params.uuid, req.user.level>1 ? null : req.user?.id||0);
  }

  @Userlevel(0)
  @Get('/all')
  async getDomainChanges(@Param() params, @Req() req): Promise<any> {
    return await this.zfsdomService.all(req.user.level>1 ? null : req.user?.id||0);
  }

  @Userlevel(0)
  @Get('/abort/:uuid')
  async abortDomainChange(@Param() params, @Req() req): Promise<any> {
    return await this.zfsdomService.abort(params.uuid, req.user.level>1 ? null : req.user?.id||0);
  }
}