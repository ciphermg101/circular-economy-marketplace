import { Module } from '@nestjs/common';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';
import { SupabaseConfig } from '../../config/supabase.config';
import { LoggerModule } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from '../../utils/logger';

@Module({
  imports: [LoggerModule],
  controllers: [ProfilesController],
  providers: [
    ProfilesService,
    SupabaseConfig,
    {
      provide: PinoLogger,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => new PinoLogger(configService),
    },
  ],
  exports: [ProfilesService],
})
export class ProfilesModule {} 