import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignInDto, TokenDto } from './dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signin')
  @ApiOperation({ summary: 'Sign in or create user from OAuth provider' })
  async signIn(@Body() signInDto: SignInDto) {
    try {
      const user = await this.authService.signInWithProvider(signInDto);
      return { userId: user.id };
    } catch (error) {
      throw new UnauthorizedException('Authentication failed');
    }
  }

  @Post('token')
  @ApiOperation({ summary: 'Generate backend JWT token' })
  async generateToken(@Body() tokenDto: TokenDto) {
    try {
      const token = await this.authService.generateToken(tokenDto);
      return { accessToken: token };
    } catch (error) {
      throw new UnauthorizedException('Token generation failed');
    }
  }
} 