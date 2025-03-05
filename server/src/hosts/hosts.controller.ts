import {
  Controller,
  Get,
} from "@nestjs/common";
import {Userlevel} from "../decorators";
import {HostsService} from "./hosts.service";

@Controller("hosts")
export class HostsController {
  constructor(private hostsService: HostsService) {
  }

  @Userlevel(0)
  @Get('/')
  async getHosts(): Promise<Array<any>> {
    return await this.hostsService.findAll();
  }
}