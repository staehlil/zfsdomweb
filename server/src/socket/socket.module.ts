import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SocketGateway } from './socket.gateway';
import { UsersModule } from '../users/users.module'; // Ensure UsersModule is imported
import { jwtConstants } from '../auth/constants';

@Module({
    imports: [
        JwtModule.register({
            secret: jwtConstants.tokenSecret,
            signOptions: { expiresIn: '60s' },
        }),
        UsersModule,
    ],
    providers: [SocketGateway],
    exports: [SocketGateway],
})
export class SocketModule {}
