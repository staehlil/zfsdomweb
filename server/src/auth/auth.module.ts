import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from "../users/users.module";
import {PassportModule} from "@nestjs/passport";
import {LocalStrategy} from "./local.strategy";
import {JwtModule} from "@nestjs/jwt";
import {JwtStrategy} from "./jwt.strategy";
import {JwtRefreshStrategy} from "./jwt-refresh.strategy";
import { MailService } from "../mail/mail.service";
import { SettingsService } from "../settings/settings.service";

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
    })
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy, JwtRefreshStrategy, MailService, SettingsService],
  exports:[AuthService]
})
export class AuthModule {}
