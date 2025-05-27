import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import {
  appConfig,
  authConfig,
  corsConfig,
  loggingConfig,
  rateLimitConfig,
  supabaseConfig,
} from './configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        supabaseConfig,
        authConfig,
        corsConfig,
        rateLimitConfig,
        loggingConfig,
      ],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().default(3000),
        API_PREFIX: Joi.string().default('api'),
        
        // Supabase
        SUPABASE_URL: Joi.string().required(),
        SUPABASE_ANON_KEY: Joi.string().required(),
        SUPABASE_SERVICE_ROLE_KEY: Joi.string().required(),
        
        // Auth
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRES_IN: Joi.string().default('7d'),
        REFRESH_TOKEN_EXPIRES_IN: Joi.string().default('30d'),
        
        // CORS
        CORS_ORIGIN: Joi.string().default('http://localhost:3000'),
        
        // Rate Limiting
        RATE_LIMIT_TTL: Joi.number().default(60),
        RATE_LIMIT_MAX: Joi.number().default(100),
        
        // Logging
        LOG_LEVEL: Joi.string()
          .valid('error', 'warn', 'info', 'debug')
          .default('info'),
        LOG_DIR: Joi.string().default('logs'),
        LOG_MAX_FILES: Joi.string().default('30d'),
        LOG_MAX_SIZE: Joi.string().default('10m'),
      }),
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),
  ],
})
export class AppConfigModule {} 