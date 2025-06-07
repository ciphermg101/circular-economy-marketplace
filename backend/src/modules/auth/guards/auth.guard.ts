import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthService } from '@auth/auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user; 

    return !!user;
  }
}