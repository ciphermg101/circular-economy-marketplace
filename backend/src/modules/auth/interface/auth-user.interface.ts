import { User, Session } from "@supabase/supabase-js";

export interface IAuthResponse {
  user: User | null;
  session: Session | null;
}