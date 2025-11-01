// supabase.client.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

declare global {
  interface Window {
    __sbClient?: SupabaseClient;
  }
}

let _sb: SupabaseClient | undefined;

export function getSupabaseClient(): SupabaseClient {
  if (typeof window !== 'undefined') {
    if (!window.__sbClient) {
      window.__sbClient = createClient(
        'https://puqqvysjddbzcauesplr.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1cXF2eXNqZGRiemNhdWVzcGxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4OTY0MzIsImV4cCI6MjA3NzQ3MjQzMn0.g1I5pxdbWLBgGZeUJH1E1tlv2nVBxFgJOnw8wADhzVA',
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
          },
        }
      );
    }
    return window.__sbClient;
  }

  // На всяк випадок (SSR/тести)
  if (!_sb) {
    _sb = createClient(
      'https://puqqvysjddbzcauesplr.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1cXF2eXNqZGRiemNhdWVzcGxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4OTY0MzIsImV4cCI6MjA3NzQ3MjQzMn0.g1I5pxdbWLBgGZeUJH1E1tlv2nVBxFgJOnw8wADhzVA',
      {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      }
    );
  }
  return _sb;
}
