import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfig, corsConfig, supabaseConfig, emailConfig, redisConfig, sentryConfig } from './common/configs/configuration';
import { SentryModule } from '@common/sentry/sentry.module';
import { SentryExceptionFilter } from '@common/sentry/sentry.filter';
import { UsersModule } from '@users/users.module';
import { ProductsModule } from '@products/products.module';
import { RepairShopsModule } from '@repair-shops/repair-shops.module';
import { MessagingModule } from '@messaging/messaging.module';
import { TransactionsModule } from './modules/transactions/transactions.module';

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
    SentryModule,
    UsersModule,
    ProductsModule,
    RepairShopsModule,
    MessagingModule,
    TransactionsModule,
  ],
  providers: [
    {
      provide: 'SENTRY_EXCEPTION_FILTER',
      useClass: SentryExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SentryExceptionFilter)
      .forRoutes('*'); 
  }
}
