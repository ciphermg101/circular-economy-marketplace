import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { WinstonModule } from 'nest-winston';
import { getWinstonConfig } from './config/logger.config';
import { validate } from './config/env.validation';
import {
  appConfig,
  authConfig,
  corsConfig,
  rateLimitConfig,
  supabaseConfig,
  loggingConfig,
  emailConfig,
  awsConfig,
  stripeConfig,
  redisConfig,
} from './config/configuration';
import { ProductsModule } from './modules/products/products.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { RepairShopsModule } from './modules/repair-shops/repair-shops.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { TutorialsModule } from './modules/tutorials/tutorials.module';
import { AuthGuard } from './guards/auth.guard';
import { RateLimitGuard } from './guards/rate-limit.guard';
import { LoggingInterceptor } from './utils/interceptors/logging.interceptor';
import { HttpExceptionFilter } from './utils/exceptions/http-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
      load: [
        appConfig,
        authConfig,
        corsConfig,
        rateLimitConfig,
        supabaseConfig,
        loggingConfig,
        emailConfig,
        awsConfig,
        stripeConfig,
        redisConfig,
      ],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const ttl = config.get<number>('rateLimitConfig.ttl') ?? 60;
        const limit = config.get<number>('rateLimitConfig.max') ?? 100;
        return { ttl, limit };
      },
    }),
    WinstonModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => getWinstonConfig(config),
    }),
    ProductsModule,
    ProfilesModule,
    RepairShopsModule,
    TransactionsModule,
    TutorialsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
