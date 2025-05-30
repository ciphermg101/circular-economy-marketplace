import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  appConfig,
  authConfig,
  corsConfig,
  loggingConfig,
  rateLimitConfig,
  supabaseConfig,
  mpesaConfig,
  emailConfig,
  redisConfig,
  monitoringConfig,
} from './configuration';
import impactConfig from './impact.config';

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
        impactConfig,
        mpesaConfig,
        emailConfig,
        redisConfig,
        monitoringConfig,
      ],
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),
  ],
})
export class AppConfigModule {} 