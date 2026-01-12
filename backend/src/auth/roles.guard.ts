import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "./roles.decorator";
import { Role } from "./role.enum";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Nếu route không set role → cho qua
    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user; // từ JwtStrategy

    if (!user?.role) return false;

    return requiredRoles.includes(user.role);
  }
}
