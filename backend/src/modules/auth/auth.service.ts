import { Injectable } from "@nestjs/common";
import { AuthRepository } from "@auth/auth.repository";
import { UsersService } from "@users/users.service";
import { CreateProfileDto } from "@users/dto/user.dto";
import { BaseException } from "@/common/exceptions/base-exception.filter";

@Injectable()
export class AuthService {
  constructor(
    private authRepository: AuthRepository,
    private usersService: UsersService
  ) {}

  public async signup(email: string, password: string): Promise<any> {
    const response = await this.authRepository.signup(email, password);
    const { user } = response;
    let profile = null;
    if (user) {
      const dto: CreateProfileDto = { username: email.split('@')[0] };
      try {
        const created = await this.usersService.createUser(user.id, dto);
        profile = created?.data || null;
      } catch (e) {
        throw new BaseException(e, e.status, e.message);
      }
    }
    return { ...response, profile };
  }

  public async login(email: string, password: string): Promise<any> {
    const response = await this.authRepository.login(email, password);
    const { user } = response;
    let profile = null;
    if (user) {
      try {
        const found = await this.usersService.getUser(user.id);
        profile = found?.data || null;
      } catch (e) {
        throw new BaseException(e, e.status, e.message);
      }
    }
    return { ...response, profile };
  }
}
