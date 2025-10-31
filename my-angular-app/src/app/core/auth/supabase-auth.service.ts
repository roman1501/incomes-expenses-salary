import { Injectable } from '@angular/core';
import { getSupabaseClient } from '../supabase.client';

interface SignUpParams {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface UserProfile {
  firstName: string | null;
  lastName: string | null;
}

@Injectable({ providedIn: 'root' })
export class SupabaseAuthService {
  private sb = getSupabaseClient();

async signUp({ email, password, firstName, lastName }: SignUpParams) {
  const redirectTo = `${window.location.origin}/auth/callback`; // працює і локально, і на проді

  const { data, error } = await this.sb.auth.signUp({
    email,
    password,
    options: {
      data: { first_name: firstName ?? null, last_name: lastName ?? null },
      emailRedirectTo: redirectTo
    }
  });
  if (error) throw error;

  if (data.session?.user) {
    await this.upsertProfile({
      id: data.session.user.id,
      firstName: firstName ?? null,
      lastName: lastName ?? null
    });
  }
  return data;
}

  async signIn(email: string, password: string) {
    const { data, error } = await this.sb.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const user = data.user;
    if (user) {
      const metadata = user.user_metadata || {};
      const firstName = (metadata['first_name'] as string) ?? null;
      const lastName = (metadata['last_name'] as string) ?? null;
      await this.upsertProfile({ id: user.id, firstName, lastName });
    }
    return data;
  }

  async signOut() {
    const { error } = await this.sb.auth.signOut();
    if (error) throw error;
  }

  async resendConfirmation(email: string) {
    const { data, error } = await this.sb.auth.resend({ type: 'signup', email });
    if (error) throw error;
    return data;
  }

  async resetPassword(email: string) {
    const { data, error } = await this.sb.auth.resetPasswordForEmail(email, {
      // emailRedirectTo: 'http://localhost:4200/auth/callback'
    });
    if (error) throw error;
    return data;
  }

  async updatePassword(newPassword: string) {
    const { data, error } = await this.sb.auth.updateUser({ password: newPassword });
    if (error) throw error;
    return data;
  }

  async upsertProfile(params: { id: string; firstName: string | null; lastName: string | null }) {
    const { id, firstName, lastName } = params;
    const { error } = await this.sb
      .from('profiles')
      .upsert({ id, first_name: firstName, last_name: lastName }, { onConflict: 'id' });
    if (error) throw error;
  }
    async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await this.sb
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return null;
    }

    return {
      firstName: (data['first_name'] as string | null) ?? null,
      lastName: (data['last_name'] as string | null) ?? null
    };
  }

}
