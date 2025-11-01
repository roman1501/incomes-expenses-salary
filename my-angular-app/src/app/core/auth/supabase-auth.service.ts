// supabase-auth.service.ts
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

const DEBUG = true;
const slog = (label: string, data?: any) => {
  if (!DEBUG) return;
  const stamp = new Date().toISOString().slice(11, 23);
  console.log(
    `%c[SB ${stamp}] ${label}`,
    'color:#111;background:#a7f3d0;border-radius:6px;padding:2px 6px',
    data ?? ''
  );
};

@Injectable({ providedIn: 'root' })
export class SupabaseAuthService {
  private sb = getSupabaseClient();

  async signUp({ email, password, firstName, lastName }: SignUpParams) {
    const redirectTo = `${window.location.origin}/auth/callback`;
    slog('signUp() — start', { email, redirectTo, firstName, lastName });
    debugger;

    const { data, error } = await this.sb.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName ?? null, last_name: lastName ?? null },
        emailRedirectTo: redirectTo,
      },
    });
    if (error) throw error;
    slog('signUp() — auth.signUp data', data);

    if (data.session?.user) {
      slog('signUp() — upsertProfile with session user', data.session.user);
      await this.upsertProfile({
        id: data.session.user.id,
        firstName: firstName ?? null,
        lastName: lastName ?? null,
      });
    }
    return data;
  }

  async signIn(email: string, password: string) {
    slog('signIn() — start', { email });
    debugger;

    const { data, error } = await this.sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    slog('signIn() — data', data);

    const user = data.user;
    if (user) {
      const metadata = user.user_metadata || {};
      const firstName = (metadata['first_name'] as string) ?? null;
      const lastName = (metadata['last_name'] as string) ?? null;
      slog('signIn() — metadata', { firstName, lastName, metadata });
      await this.upsertProfile({ id: user.id, firstName, lastName });
    }
    return data;
  }

  async signOut() {
    slog('signOut()');
    const { error } = await this.sb.auth.signOut();
    if (error) throw error;
  }

  async resendConfirmation(email: string) {
    slog('resendConfirmation()', { email });
    const { data, error } = await this.sb.auth.resend({ type: 'signup', email });
    if (error) throw error;
    return data;
  }

  async resetPassword(email: string) {
    slog('resetPassword()', { email });
    const { data, error } = await this.sb.auth.resetPasswordForEmail(email, {});
    if (error) throw error;
    return data;
  }

  async updatePassword(newPassword: string) {
    slog('updatePassword()');
    const { data, error } = await this.sb.auth.updateUser({ password: newPassword });
    if (error) throw error;
    return data;
  }

  async upsertProfile(params: { id: string; firstName: string | null; lastName: string | null }) {
    const { id, firstName, lastName } = params;
    slog('upsertProfile() — input', { id, firstName, lastName });
    debugger;

    const { error } = await this.sb
      .from('profiles')
      .upsert({ id, first_name: firstName, last_name: lastName }, { onConflict: 'id' });

    if (error) {
      console.error('upsertProfile() — error', error);
      debugger;
      throw error;
    }
    slog('upsertProfile() — success');
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    slog('getProfile() — start', { userId });
    debugger;

    const { data, error } = await this.sb
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('getProfile() — profiles error', error);
      debugger;
      throw error;
    }

    slog('getProfile() — profiles row', data);

    let firstName = this.normalizeProfileValue(data?.['first_name']);
    let lastName = this.normalizeProfileValue(data?.['last_name']);
    slog('getProfile() — normalized from table', { firstName, lastName });

    // Якщо таблиця порожня або поля пусті — пробуємо user_metadata
    if (!firstName || !lastName) {
      const { data: userData, error: userError } = await this.sb.auth.getUser();
      slog('getProfile() — auth.getUser()', { userData, userError });
      if (!userError) {
        const metadata = userData.user?.user_metadata ?? {};
        if (!firstName) {
          firstName = this.normalizeProfileValue(metadata['first_name']);
        }
        if (!lastName) {
          lastName = this.normalizeProfileValue(metadata['last_name']);
        }
        slog('getProfile() — filled from metadata', { firstName, lastName, metadata });
      } else {
        console.warn('getProfile() — auth.getUser error', userError);
      }
    }

    if (!firstName && !lastName) {
      slog('getProfile() — no names anywhere, returning null');
      if (DEBUG) debugger; // 💥 тут часто корінь проблеми
      return null;
    }

    const result = { firstName, lastName };
    slog('getProfile() — final', result);
    return result;
  }

  private normalizeProfileValue(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }
}
