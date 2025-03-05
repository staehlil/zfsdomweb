import {Module, ParseEnumPipe} from '@nestjs/common';
import {AppController} from './app.controller';
import {AppService} from './app.service';
import {ServeStaticModule} from '@nestjs/serve-static';
import {join} from 'path';
import {TypeOrmModule} from "@nestjs/typeorm";
import {DataSource} from "typeorm";
import {AuthModule} from './auth/auth.module';
import {UsersModule} from './users/users.module';
import {APP_GUARD} from "@nestjs/core";
import {JwtGuard} from "./auth/jwt.guard";
import {RolesGuard} from "./userlevel.guard";
import {SettingsService} from "./settings/settings.service";
import {MailService} from "./mail/mail.service";
import {PublicAppController} from "./app.controller.public";
import {JwtService} from "@nestjs/jwt";
import {HealthService} from "./health/health.service";
import {HealthController} from "./health/health.controller";
import {HealthModule} from "./health/health.module";
import {EnumsService} from "./enums/enums.service";
import {HostsModule} from "./hosts/hosts.module";
import {HostsController} from "./hosts/hosts.controller";
import {HostsService} from "./hosts/hosts.service";
import {ConfigModule} from "./config/config.module";
import {ConfigService} from "./config/config.service";
import {ZfsdomService} from "./zfsdom/zfsdom.service";
import {ZfsdomModule} from "./zfsdom/zfsdom.module";
import {ZfsdomController} from "./zfsdom/zfsdom.controller";
import {SocketGateway} from "./socket/socket.gateway";
import {SocketModule} from "./socket/socket.module";

@Module({
    imports: [
        ServeStaticModule.forRoot({
            rootPath: join(__dirname, '..', '..', 'client', 'dist')
        }),
        TypeOrmModule.forRoot({
            type: 'mariadb',
            host: process.env.DB_HOST.replace(/\{([^}]+)\}/g,(_match,p1)=>process.env[p1]||p1),
            port: 3306,
            username: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
            entities: [],
            synchronize: false
        }),
        AuthModule,
        UsersModule,
        HealthModule,
        HostsModule,
        ConfigModule,
        ZfsdomModule,
        SocketModule
    ],
    controllers: [AppController, PublicAppController, HealthController, HostsController, ZfsdomController ],
    providers: [
        AppService, {
            provide: APP_GUARD,
            useClass: JwtGuard
        }, {
            provide: APP_GUARD,
            useClass: RolesGuard
        },
        SettingsService,
        MailService,
        SocketGateway,
        JwtService,
        HealthService,
        EnumsService,
        HostsService,
        ConfigService,
        ZfsdomService
    ],
})
export class AppModule {
    constructor(private dataSource: DataSource) {
    }
}
