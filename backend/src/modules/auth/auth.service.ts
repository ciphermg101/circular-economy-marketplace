import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SignInDto, TokenDto } from './dto/auth.dto';
import { SupabaseService } from '../supabase/supabase.service';
import { RedisService } from '../cache/redis.service';
import { JWTPayload, TokenResponse, RefreshToken } from '../../types/auth.types';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class AuthService {
  private readonly ACCESS_TOKEN_EXPIRY = 15 * 60; // 15 minutes
  private readonly REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days
  private readonly MAX_REFRESH_TOKENS_PER_USER = 5;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly supabaseService: SupabaseService,
    private readonly redisService: RedisService,
  ) {}

  async signInWithProvider(signInDto: SignInDto) {
    const { data: existingUser } = await this.supabaseService.getClient
      .from('users')
      .select('*')
      .eq('email', signInDto.email)
      .single();

    if (existingUser) {
      // Update provider info if needed
      await this.supabaseService.getClient
        .from('user_providers')
        .upsert({
          user_id: existingUser.id,
          provider: signInDto.provider,
          provider_id: signInDto.providerAccountId,
        });

      return existingUser;
    }

    // Create new user
    const { data: newUser, error } = await this.supabaseService.getClient
      .from('users')
      .insert({
        email: signInDto.email,
        full_name: signInDto.name,
      })
      .select()
      .single();

    if (error) {
      throw new UnauthorizedException('Failed to create user');
    }

    // Add provider info
    await this.supabaseService.getClient
      .from('user_providers')
      .insert({
        user_id: newUser.id,
        provider: signInDto.provider,
        provider_id: signInDto.providerAccountId,
      });

    return newUser;
  }

  async generateToken(tokenDto: TokenDto) {
    const { data: user } = await this.supabaseService.getClient
      .from('users')
      .select('*')
      .eq('id', tokenDto.userId)
      .single();

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { data: provider } = await this.supabaseService.getClient
      .from('user_providers')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', tokenDto.provider)
      .single();

    if (!provider) {
      throw new UnauthorizedException('Invalid provider');
    }

    return this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        provider: tokenDto.provider,
      },
      {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: '30d',
      },
    );
  }

  async validateUser(email: string, password: string): Promise<any> {
    const { data: user, error } = await this.supabaseService.getClient
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async login(user: any): Promise<TokenResponse> {
    try {
      const tokens = await this.generateTokens(user);
      await this.saveRefreshToken(user.id, tokens.refreshToken);
      return tokens;
    } catch (error) {
      throw new BadRequestException('Failed to generate tokens');
    }
  }

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    try {
      // Verify refresh token exists and is not revoked
      const { data: token, error } = await this.supabaseService.getClient
        .from('refresh_tokens')
        .select('*')
        .eq('token', refreshToken)
        .is('revoked_at', null)
        .single();

      if (error || !token) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Check if token is expired
      if (new Date(token.expires_at) < new Date()) {
        await this.revokeRefreshToken(token.id);
        throw new UnauthorizedException('Refresh token expired');
      }

      // Get user
      const { data: user, error: userError } = await this.supabaseService.getClient
        .from('users')
        .select('*')
        .eq('id', token.user_id)
        .single();

      if (userError || !user) {
        throw new UnauthorizedException('User not found');
      }

      // Generate new tokens with rotation
      const tokens = await this.generateTokens(user);

      // Revoke old refresh token and save new one
      await this.revokeRefreshToken(token.id);
      await this.saveRefreshToken(user.id, tokens.refreshToken);

      return tokens;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new BadRequestException('Failed to refresh token');
    }
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    try {
      // Revoke refresh token
      const { error } = await this.supabaseService.getClient
        .from('refresh_tokens')
        .update({ revoked_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('token', refreshToken);

      if (error) {
        throw new BadRequestException('Failed to logout');
      }

      // Invalidate access token by adding it to blacklist
      const decodedToken = this.jwtService.decode(refreshToken) as JWTPayload;
      const timeToExpiry = decodedToken.exp - Math.floor(Date.now() / 1000);
      if (timeToExpiry > 0) {
        await this.redisService.setWithExpiry(
          `blacklist:${refreshToken}`,
          'true',
          timeToExpiry
        );
      }
    } catch (error) {
      throw new BadRequestException('Failed to logout');
    }
  }

  private async generateTokens(user: any): Promise<TokenResponse> {
    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: this.ACCESS_TOKEN_EXPIRY,
      }),
      this.generateRefreshToken(),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
      tokenType: 'Bearer',
    };
  }

  private async generateRefreshToken(): Promise<string> {
    return uuidv4();
  }

  private async saveRefreshToken(userId: string, token: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + this.REFRESH_TOKEN_EXPIRY);

    // Get current active refresh tokens count
    const { count } = await this.supabaseService.getClient
      .from('refresh_tokens')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .is('revoked_at', null);

    if (count !== null && count >= this.MAX_REFRESH_TOKENS_PER_USER) {
      // Delete oldest refresh token
      await this.supabaseService.getClient
        .from('refresh_tokens')
        .delete()
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(1);
    }

    // Save new refresh token
    const { error } = await this.supabaseService.getClient
      .from('refresh_tokens')
      .insert({
        user_id: userId,
        token,
        expires_at: expiresAt.toISOString(),
        family_id: uuidv4(), // Add token family tracking
      });

    if (error) {
      throw new BadRequestException('Failed to save refresh token');
    }
  }

  private async revokeRefreshToken(tokenId: string): Promise<void> {
    const { error } = await this.supabaseService.getClient
      .from('refresh_tokens')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', tokenId);

    if (error) {
      throw new BadRequestException('Failed to revoke refresh token');
    }
  }

  private async revokeRefreshTokenFamily(familyId: string): Promise<void> {
    const { error } = await this.supabaseService.getClient
      .from('refresh_tokens')
      .update({ revoked_at: new Date().toISOString() })
      .eq('family_id', familyId)
      .is('revoked_at', null);

    if (error) {
      throw new BadRequestException('Failed to revoke refresh token family');
    }
  }

  async validateToken(token: string): Promise<JWTPayload> {
    try {
      // Check if token is blacklisted
      const isBlacklisted = await this.redisService.get(`blacklist:${token}`);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token is blacklisted');
      }

      const payload = await this.jwtService.verifyAsync<JWTPayload>(token);
      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupExpiredTokens() {
    try {
      // Delete expired and revoked tokens older than 30 days
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);

      const { error } = await this.supabaseService.getClient
        .from('refresh_tokens')
        .delete()
        .or(`expires_at.lt.${new Date().toISOString()},revoked_at.lt.${cutoff.toISOString()}`);

      if (error) {
        throw new Error(`Failed to cleanup expired tokens: ${error.message}`);
      }
    } catch (error) {
      console.error('Error cleaning up expired tokens:', error);
    }
  }
} 