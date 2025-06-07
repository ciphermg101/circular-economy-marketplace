import {
  Controller,
  Post,
  Body,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from '@auth/auth.service';
import { AuthCredentialsDto } from '@auth/dto/auth.dto';
import { TransformResponseInterceptor } from '@common/interceptors/transform-response.interceptor';

@ApiTags('auth')
@UseInterceptors(TransformResponseInterceptor)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Sign up with email and password' })
  @ApiResponse({ status: 201, description: 'User registered', type: Object })
  async signUp(
    @Body() authCredentialsDto: AuthCredentialsDto
  ): Promise<any> {
    const { email, password } = authCredentialsDto;
    return this.authService.signup(email, password);
  }

  @Post('login')
  @ApiOperation({ summary: 'Log in with email and password' })
  @ApiResponse({ status: 200, description: 'User logged in', type: Object })
  async login(
    @Body() authCredentialsDto: AuthCredentialsDto
  ): Promise<any> {
    const { email, password } = authCredentialsDto;
    return this.authService.login(email, password);
  }
}