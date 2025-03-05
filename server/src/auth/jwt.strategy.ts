import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { jwtConstants } from './constants';
import { UsersService } from "../users/users.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy,'jwt') {
    constructor(private usersService:UsersService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: jwtConstants.tokenSecret,
        });
    }

    async validate({username,sub}) {
        /** todo optional: token revocation **/
        const { email, refreshToken, level, jsonData, expired, confirmation, node, usedNodes, subdomains, subscriptions } = (await this.usersService.findOneById(sub))||{};
        return { username, id: sub, email, refreshToken, level, jsonData, expired, confirmation, node, usedNodes, subdomains, subscriptions };
    }
}