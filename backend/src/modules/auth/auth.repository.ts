import { BaseException } from "@common/exceptions/base-exception.filter";
import { SupabaseService } from "@common/supabase/supabase.service";
import { Injectable } from "@nestjs/common";
import { SupabaseClient } from "@supabase/supabase-js";
import { IAuthResponse } from "@auth/interface/auth-user.interface";


@Injectable()
export class AuthRepository {
  private readonly supabaseClient: SupabaseClient;

  constructor(private readonly supabaseService: SupabaseService) {
    this.supabaseClient = this.supabaseService.createCLient();
  }

  public async signup(email: string, password: string): Promise<IAuthResponse> {
    const { data, error } = await this.supabaseClient.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw new BaseException(error, error.status, error.message);
    }

    return data;
  }

  public async login(email: string, password: string): Promise<IAuthResponse> {
    const { data, error } = await this.supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new BaseException(error, error.status, error.message);
    }

    return data;
  }
}
