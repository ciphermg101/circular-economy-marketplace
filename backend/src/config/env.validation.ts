import 'reflect-metadata';
import { plainToClass, Transform, Type } from 'class-transformer';
import { IsEnum, IsNumber, IsString, IsUrl, IsOptional, IsBoolean, validateSync, IsArray } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @Type(() => Number)
  @IsNumber()
  PORT: number;

  @IsString()
  API_PREFIX: string;

  // Database (Supabase)
  @IsUrl()
  SUPABASE_URL: string;

  @IsString()
  SUPABASE_KEY: string;

  @IsString()
  SUPABASE_JWT_SECRET: string;

  // Security
  @IsString()
  JWT_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRATION: string;

  @IsString()
  CORS_ORIGINS: string;

  @Type(() => Number)
  @IsNumber()
  RATE_LIMIT_MAX: number;

  @Type(() => Number)
  @IsNumber()
  RATE_LIMIT_TTL: number;

  // Redis
  @IsString()
  REDIS_URL: string;

  // AWS S3
  @IsString()
  @IsOptional()
  AWS_ACCESS_KEY_ID: string;

  @IsString()
  @IsOptional()
  AWS_SECRET_ACCESS_KEY: string;

  @IsString()
  @IsOptional()
  AWS_REGION: string;

  @IsString()
  @IsOptional()
  AWS_BUCKET_NAME: string;

  // Stripe
  @IsString()
  @IsOptional()
  STRIPE_SECRET_KEY: string;

  @IsString()
  @IsOptional()
  STRIPE_WEBHOOK_SECRET: string;

  // Email
  @IsString()
  SMTP_HOST: string;

  @Type(() => Number)
  @IsNumber()
  SMTP_PORT: number;

  @IsString()
  SMTP_USER: string;

  @IsString()
  SMTP_PASS: string;

  @IsString()
  EMAIL_FROM: string;

  // Monitoring
  @IsString()
  @IsOptional()
  SENTRY_DSN: string;

  @IsString()
  @IsOptional()
  LOG_LEVEL: string;

  @IsString()
  @IsOptional()
  LOG_DIR: string;

  @IsString()
  @IsOptional()
  LOG_MAX_FILES: string;

  @IsString()
  @IsOptional()
  LOG_MAX_SIZE: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(
    EnvironmentVariables,
    config,
    { enableImplicitConversion: true },
  );
  
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}

// Export the Environment enum for use in other parts of the application
export { Environment }; 