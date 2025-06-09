import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  appConfig,
  corsConfig,
  supabaseConfig,
  emailConfig,
  redisConfig,
  sentryConfig,
} from '@common/configs/configuration';
import { SentryModule } from '@common/sentry/sentry.module';
import { SentryExceptionFilter } from '@common/sentry/sentry.filter';
import { UsersModule } from '@users/users.module';
import { ProductsModule } from '@products/products.module';
import { RepairShopsModule } from '@repair-shops/repair-shops.module';
import { MessagingModule } from '@messaging/messaging.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getTypeOrmConfig } from '../typeorm.config';
import { APP_FILTER } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        corsConfig,
        supabaseConfig,
        emailConfig,
        redisConfig,
        sentryConfig,
      ],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getTypeOrmConfig,
    }),
    SentryModule,
    UsersModule,
    ProductsModule,
    RepairShopsModule,
    MessagingModule,
    TransactionsModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryExceptionFilter,
    },
  ],
})
export class AppModule {}
