import { Module } from '@nestjs/common';
import { AuthService } from '@auth/auth.service';
import { AuthController } from '@auth/auth.controller';
import { AuthRepository } from '@auth/auth.repository';
import { SupabaseModule } from '@common/supabase/supabase.module';
import { UsersModule } from '@users/users.module';

@Module({
  imports: [SupabaseModule, UsersModule],
  providers: [AuthService, AuthRepository],
  controllers: [AuthController]
})
export class AuthModule {}
