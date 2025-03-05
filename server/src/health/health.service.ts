import { Injectable } from '@nestjs/common';
import { DataSource } from "typeorm";

@Injectable()
export class HealthService {
  constructor(private dataSource: DataSource) {
  }
  async getHealth(): Promise<any | undefined> {
    const list = await this.dataSource.manager.query( `select * from users`);
    return list.length>0;
  }
}
