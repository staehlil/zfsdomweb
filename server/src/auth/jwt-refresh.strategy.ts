import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { jwtConstants } from './constants';
import { Request } from 'express';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy,'jwt-refresh') {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: jwtConstants.refreshSecret,
            passReqToCallback: true
        });
    }
    validate(req: Request, { username, sub }) { // expects refreshToken as bearer token in authorization header
        const refreshToken = req.get('Authorization').replace('Bearer', '').trim();
        return { username, id:sub, refreshToken };
    }
}