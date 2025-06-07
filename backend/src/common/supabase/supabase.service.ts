import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient } from "@supabase/supabase-js";

@Injectable()
export class SupabaseService {
  private readonly supabaseUrl: string;
  private readonly supabaseAnonKey: string;

  constructor(private configService: ConfigService) {
    this.supabaseUrl = this.configService.get<string>("supabase.url")!;
    this.supabaseAnonKey = this.configService.get<string>("supabase.anonKey")!;
  }

  public createCLient() {
    const supabaseClient = createClient(
      this.supabaseUrl,
      this.supabaseAnonKey,
      {
        auth: {
          persistSession: false,
        },
      }
    );
    return supabaseClient;
  }
}
