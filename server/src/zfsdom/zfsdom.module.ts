import { Module } from '@nestjs/common';
import { ZfsdomService } from './zfsdom.service';
import {SocketModule} from "../socket/socket.module";

@Module({
  imports: [SocketModule],
  providers: [ZfsdomService],
  exports: [ZfsdomService],
})
export class ZfsdomModule {}
