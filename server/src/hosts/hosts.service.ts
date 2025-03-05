import {Injectable} from '@nestjs/common';
import {ConfigService} from "../config/config.service";

@Injectable()
export class HostsService {
  constructor(protected configService:ConfigService) {
  }
  async findAll(): Promise<any | undefined> {
    return this.configService.getHosts();
  }
}
