import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from './../../environments/envinronment';

let _client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!_client) {
    // src/app/core/supabase.client.ts
    _client = createClient(environment.supabaseUrl, environment.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true, // <<< обов'язково
      },
    });
  }
  return _client;
}
