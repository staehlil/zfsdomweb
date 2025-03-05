import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { USERLEVEL_KEY } from "./decorators";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredUserlevel = this.reflector.get<number>(USERLEVEL_KEY, context.getHandler()) || -1;
    if (requiredUserlevel<0)
      return true;
    const { user } = context.switchToHttp().getRequest();
    return requiredUserlevel <= (user.level||-1);
  }
}