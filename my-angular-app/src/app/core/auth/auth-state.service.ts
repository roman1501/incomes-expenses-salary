import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { getSupabaseClient } from '../supabase.client';

export interface AuthState {
  loading: boolean;
  isAuthenticated: boolean;
  userId: string | null;
  email: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private sb = getSupabaseClient();
  private _state$ = new BehaviorSubject<AuthState>({
    loading: true,
    isAuthenticated: false,
    userId: null,
    email: null
  });

  state$ = this._state$.asObservable();

  constructor() {
    this.bootstrap();
    this.sb.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      this._state$.next({
        loading: false,
        isAuthenticated: !!user,
        userId: user?.id ?? null,
        email: user?.email ?? null
      });
    });
  }

  private async bootstrap() {
    const { data: { session } } = await this.sb.auth.getSession();
    const user = session?.user ?? null;
    this._state$.next({
      loading: false,
      isAuthenticated: !!user,
      userId: user?.id ?? null,
      email: user?.email ?? null
    });
  }
}
