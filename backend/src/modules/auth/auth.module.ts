import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from '@auth/auth.service';
import { AuthController } from '@auth/auth.controller';
import { AuthRepository } from '@auth/auth.repository';
import { SupabaseModule } from '@common/supabase/supabase.module';
import { UsersModule } from '@users/users.module';

@Module({
  imports: [SupabaseModule, forwardRef(() => UsersModule)],
  providers: [AuthService, AuthRepository],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
