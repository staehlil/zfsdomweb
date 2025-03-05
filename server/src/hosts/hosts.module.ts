import { Module } from '@nestjs/common';
import { HostsService } from './hosts.service';
import {ConfigService} from "../config/config.service";

@Module({
  providers: [HostsService, ConfigService],
  exports: [HostsService],
})
export class HostsModule {}
