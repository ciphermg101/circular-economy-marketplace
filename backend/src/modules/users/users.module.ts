import { Module, forwardRef } from '@nestjs/common';
import { UsersController } from '@users/users.controller';
import { UsersService } from '@users/users.service';
import { UsersRepository } from '@users/users.repository';
import { SupabaseModule } from '@common/supabase/supabase.module';
import { AuthModule } from '@auth/auth.module';

@Module({
  imports: [SupabaseModule, forwardRef(() => AuthModule)],
  controllers: [UsersController],
  providers: [
    UsersService,
    UsersRepository,
  ],
  exports: [UsersService],
})
export class UsersModule {}