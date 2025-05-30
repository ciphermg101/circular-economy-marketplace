import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerModuleOptions } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import {
  appConfig,
  authConfig,
  corsConfig,
  rateLimitConfig,
  supabaseConfig,
  loggingConfig,
  emailConfig,
  mpesaConfig,
  redisConfig,
  impactConfig,
} from './config/configuration';

import { ProductsModule } from './modules/products/products.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { RepairShopsModule } from './modules/repair-shops/repair-shops.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { TutorialsModule } from './modules/tutorials/tutorials.module';
import { StorageModule } from './modules/storage/storage.module';
import { MpesaModule } from './modules/mpesa/mpesa.module';
import { MonitoringModule } from './modules/monitoring/monitoring.module';
import { CacheModule } from './modules/cache/cache.module';
import { WebsocketModule } from './modules/websocket/websocket.module';
import { EnvironmentalImpactModule } from './modules/environmental-impact/environmental-impact.module';
import { InterceptorsModule } from './utils/interceptors/interceptors.module';

import { AuthGuard } from './guards/auth.guard';
import { RateLimitGuard } from './guards/rate-limit.guard';
import { LoggingInterceptor } from './utils/interceptors/logging.interceptor';
import { HttpExceptionFilter } from './utils/exceptions/http-exception.filter';
import { PinoLogger } from './utils/logger';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        authConfig,
        corsConfig,
        rateLimitConfig,
        supabaseConfig,
        loggingConfig,
        emailConfig,
        mpesaConfig,
        redisConfig,
        impactConfig,
      ],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): ThrottlerModuleOptions => ({
        throttlers: [
          {
            ttl: config.get<number>('rateLimitConfig.ttl') ?? 60,
            limit: config.get<number>('rateLimitConfig.max') ?? 100,
          },
        ],
      }),
    }),
    MonitoringModule,
    CacheModule,
    WebsocketModule,
    ProductsModule,
    ProfilesModule,
    RepairShopsModule,
    TransactionsModule,
    TutorialsModule,
    StorageModule,
    MpesaModule,
    EnvironmentalImpactModule,
    InterceptorsModule,
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
      useFactory: (interceptor: LoggingInterceptor) => interceptor,
      inject: [LoggingInterceptor],
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    PinoLogger,
    {
      provide: 'LoggerService',
      useFactory: (configService: ConfigService) => {
        return new PinoLogger(configService);
      },
      inject: [ConfigService],
    },
  ],
  exports: ['LoggerService', PinoLogger],
})
export class AppModule {}
