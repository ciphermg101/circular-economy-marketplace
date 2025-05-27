import { IsString, IsOptional, IsEnum, IsBoolean, IsObject } from 'class-validator';
import { Point, UserType } from '../types/common.types';

export class CreateProfileDto {
  @IsString()
  username: string;

  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @IsEnum(['individual', 'repair_shop', 'organization'])
  userType: UserType;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsObject()
  @IsOptional()
  location?: Point;
}

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsObject()
  @IsOptional()
  location?: Point;
}

export class VerifyProfileDto {
  @IsBoolean()
  verificationStatus: boolean;
} 