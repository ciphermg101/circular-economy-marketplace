import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { SupabaseModule } from '@common/supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    UsersRepository,
  ],
  exports: [UsersService],
})
export class UsersModule {} 