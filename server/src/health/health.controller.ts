import {
  Controller,
  Get, Res,
} from "@nestjs/common";
import {Public} from "../decorators";
import {HealthService} from "./health.service";

@Controller("health")
export class HealthController {
  constructor(private healthService: HealthService) {}

  @Public()
  @Get('/')
  async GetHealth(@Res() res): Promise<void> {
    let health = true;
    try {
      health = await this.healthService.getHealth();
    }
    catch (err) {
      health = false;
    }
    if (health) {
      res.status(200).send("1");
    } else {
      res.status(503).send("0");
    }
  }
}
