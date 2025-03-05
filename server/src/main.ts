import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from "cookie-parser";
import * as express from 'express';
import {CustomExpressAdapter} from "./custom.express-adapter";

async function bootstrap() {
  const server = express();
  const adapter = new CustomExpressAdapter(server)
  const app = await NestFactory.create(AppModule,adapter);
  app.setGlobalPrefix('api',{
    exclude:["/openid/sso", "/openid/auth"]
  });
  app.use(cookieParser());
  await app.listen(process.env.PORT_SERVER || 3000);
}
bootstrap();
