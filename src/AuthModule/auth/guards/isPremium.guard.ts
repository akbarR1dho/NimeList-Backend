import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from 'src/UserModule/user/user.service';

@Injectable()
export class PremiumGuard implements CanActivate {
  constructor(private readonly userService: UserService) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.userId) {
      throw new UnauthorizedException('User not authenticated.');
    }

    // Check status premium dari userId
    return await this.userService.checkPremium(user.userId);
  }
}
