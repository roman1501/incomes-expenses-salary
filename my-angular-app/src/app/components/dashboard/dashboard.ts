import { Component, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseAuthService } from '../../core/auth/supabase-auth.service';
import { Router } from '@angular/router';
import { AuthStateService } from '../../core/auth/auth-state.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, filter } from 'rxjs/operators'; // <-- додай цей імпорт

interface ProfileDisplay {
  firstName: string;
  lastName: string;
  initials: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent {
  private auth = inject(SupabaseAuthService);
  private router = inject(Router);
  private authState = inject(AuthStateService);
  private destroyRef = inject(DestroyRef);

  profile: ProfileDisplay = {
    firstName: '',
    lastName: '',
    initials: '??'
  };

  // ⬇️ Ось тут вставляєш новий constructor
  constructor() {
    this.authState.state$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter(s => !s.loading),
        filter(s => !s.isAuthenticated || (!!s.isAuthenticated && !!s.userId)),
        distinctUntilChanged(
          (a, b) =>
            a.isAuthenticated === b.isAuthenticated &&
            a.userId === b.userId &&
            a.email === b.email
        )
      )
      .subscribe((state) => {
        if (!state.isAuthenticated) {
          this.profile = this.createDisplayProfile(null, null, state.email ?? null);
          return;
        }
        this.loadProfile(state.userId!, state.email ?? null);
      });
  }

  async logout() {
    await this.auth.signOut();
    this.router.navigateByUrl('/');
  }

private async loadProfile(userId: string, emailFallback: string | null) {
  try {
    // може прийти: { firstName, lastName } або { first_name, last_name } або [ { ... } ]
    const raw = await this.auth.getProfile(userId);

    // 1) Витягуємо перший елемент, якщо це масив
    const data = Array.isArray(raw) ? raw[0] : raw;

    // 2) Знімаємо snake_case -> camelCase
    const first =
      (data?.firstName ?? data?.first_name ?? '').toString().trim() || null;
    const last =
      (data?.lastName ?? data?.last_name ?? '').toString().trim() || null;

    this.profile = this.createDisplayProfile(first, last, emailFallback);
  } catch (error) {
    console.error('Failed to load user profile', error);
    this.profile = this.createDisplayProfile(null, null, emailFallback);
  }
}

  private createDisplayProfile(
    firstName: string | null,
    lastName: string | null,
    emailFallback: string | null
  ): ProfileDisplay {
    const sanitizedFirst = firstName?.trim() ?? '';
    const sanitizedLast = lastName?.trim() ?? '';

    if (!sanitizedFirst && !sanitizedLast && emailFallback) {
      const emailName = emailFallback.split('@')[0] ?? '';
      const formattedEmailName = emailName.replace(/[^a-zA-Z0-9]+/g, ' ').trim();
      return {
        firstName: formattedEmailName || emailFallback,
        lastName: '',
        initials: this.buildInitials(formattedEmailName || emailFallback, '')
      };
    }

    return {
      firstName: sanitizedFirst,
      lastName: sanitizedLast,
      initials: this.buildInitials(sanitizedFirst, sanitizedLast)
    };
  }

  private buildInitials(firstName: string, lastName: string): string {
    const firstInitial = firstName?.trim()?.charAt(0) ?? '';
    const lastInitial = lastName?.trim()?.charAt(0) ?? '';
    const initials = `${firstInitial}${lastInitial}`.trim();
    return initials ? initials.toUpperCase() : '??';
  }
}