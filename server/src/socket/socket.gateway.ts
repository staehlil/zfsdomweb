import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    WebSocketGateway,
    WebSocketServer
} from '@nestjs/websockets';
import {Server, Socket} from 'socket.io';
import {Injectable, OnModuleInit} from '@nestjs/common';
import {JwtService} from "@nestjs/jwt";
import {jwtConstants} from "../auth/constants";
import {UsersService} from "../users/users.service";

@WebSocketGateway({
    cors: true
})
@Injectable()
export class SocketGateway implements OnModuleInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;
    private clients: Map<string, { socket: Socket; user: any }> = new Map();

    constructor(private jwtService:JwtService, private usersService:UsersService) {
    }
    onModuleInit(): any {
    }
    async handleConnection(client: Socket, ...args: any[]): Promise<any> {
        let token = client.handshake.query.token;
        if (typeof token !== 'string')
            token=""
        try {
            let userData = this.jwtService.verify(token,{secret:jwtConstants.tokenSecret});
            let user = await this.usersService.findOneById(userData.sub);
            client.data = { user };
            this.clients.set(client.id, { socket: client, user });

        } catch (error) {
            client.disconnect(true);
        }
    }
    async handleDisconnect(client: Socket): Promise<any> {
        this.clients.delete(client.id);
    }
    async emitUser(userId,event,data){
        const userEntries = [...this.clients.entries()].filter(([id,info])=>info.user?.id===userId);
        if (userEntries.length) {
            let [, clientInfo ] = userEntries[0];
            let { socket:userSocket } = clientInfo;
            userSocket.emit(event,data);
        }
    }
}