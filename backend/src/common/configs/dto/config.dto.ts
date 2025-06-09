import {
  IsString,
  IsNumberString,
  IsArray,
  IsBooleanString,
  IsIn,
  ArrayNotEmpty
} from 'class-validator';

export class AppConfigDto {
  @IsString()
  env!: string;

  @IsNumberString()
  port!: string;

  @IsString()
  apiPrefix!: string;

  @IsString()
  version!: string;

  @IsString()
  hostname!: string;
}

export class CorsConfigDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayNotEmpty()
  origins!: string[];

  @IsArray()
  @IsString({ each: true })
  @ArrayNotEmpty()
  methods!: string[];

  @IsBooleanString()
  credentials!: string;
}

export class SupabaseConfigDto {
  @IsString()
  url!: string;

  @IsString()
  anonKey!: string;
}

export class EmailConfigDto {
  @IsString()
  host!: string;

  @IsNumberString()
  port!: string;

  @IsString()
  user!: string;

  @IsString()
  pass!: string;

  @IsString()
  from!: string;
}

export class MpesaConfigDto {
  @IsString()
  consumerKey!: string;

  @IsString()
  consumerSecret!: string;

  @IsString()
  passkey!: string;

  @IsString()
  shortcode!: string;

  @IsString()
  callbackUrl!: string;

  @IsIn(['sandbox', 'production'])
  environment!: string;
}

export class RedisConfigDto {
  @IsString()
  url!: string;
}

export class SentryConfigDto {
  @IsString()
  sentryDsn!: string;
}

export class DatabaseConfigDto {
  @IsString()
  url!: string;
}