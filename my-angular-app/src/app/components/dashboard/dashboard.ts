// dashboard.ts
import {
  Component,
  DestroyRef,
  ElementRef,
  inject,
  AfterViewChecked,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseAuthService } from '../../core/auth/supabase-auth.service';
import { Router } from '@angular/router';
import { AuthStateService } from '../../core/auth/auth-state.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, filter } from 'rxjs/operators';

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
  styleUrl: './dashboard.scss',
})
export class DashboardComponent implements AfterViewChecked {
  private auth = inject(SupabaseAuthService);
  private router = inject(Router);
  private authState = inject(AuthStateService);
  private destroyRef = inject(DestroyRef);
  private host = inject(ElementRef<HTMLElement>);
  private cdr = inject(ChangeDetectorRef);

  // Поки профіль не готовий — не показуємо "??"
  private profileReady = false;
  private loadInflight?: Promise<void>;
  private readonly loadingInitials = ''; // або '• •' якщо хочеш легкий плейсхолдер

  profile: ProfileDisplay = {
    firstName: '',
    lastName: '',
    initials: this.loadingInitials,
  };

  private lastPaint = '';

  constructor() {
    this.profileReady = false;

    this.authState.state$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((s) => !s.loading),
        filter((s) => !s.isAuthenticated || (!!s.isAuthenticated && !!s.userId)),
        distinctUntilChanged(
          (a, b) =>
            a.isAuthenticated === b.isAuthenticated && a.userId === b.userId && a.email === b.email
        )
      )
      .subscribe((state) => {
        if (!state.isAuthenticated) {
          this.profileReady = true;
          this._setProfile(this.createDisplayProfile(null, null, state.email ?? null));
          return;
        }
        this.loadProfile(state.userId!, state.email ?? null);
      });
  }

  ngAfterViewChecked(): void {
    // Лише щоб уникнути зайвих перерисовок у деяких браузерах
    const avatar =
      this.host.nativeElement.querySelector('.dashboard__avatar')?.textContent?.trim() ?? '';
    const labels = this.host.nativeElement.querySelectorAll('.dashboard__profile-label');
    const first = labels[0]?.textContent?.trim() ?? '';
    const last = labels[1]?.textContent?.trim() ?? '';
    const now = `AV=${avatar}|FN=${first}|LN=${last}`;
    if (now !== this.lastPaint) this.lastPaint = now;
  }

  async logout() {
    await this.auth.signOut();
    this.router.navigateByUrl('/');
  }

  private async loadProfile(userId: string, emailFallback: string | null) {
    // single-flight: не запускаємо ще один, поки попередній не завершився
    if (this.loadInflight) return this.loadInflight;

    const run = async () => {
      try {
        const profile = await this.retryGetProfile(userId, 3, 200);

        const previous = this.profile;
        const first = profile?.firstName ?? (previous.firstName?.trim() || null);
        const last = profile?.lastName ?? (previous.lastName?.trim() || null);

        this.profileReady = true;
        const display = this.createDisplayProfile(first, last, emailFallback);
        this._setProfile(display);

        // Форс-чейндж (на випадок поза зоною)
        queueMicrotask(() => this.cdr.detectChanges());
        setTimeout(() => this.cdr.detectChanges(), 0);
        requestAnimationFrame(() => this.cdr.detectChanges());
      } catch {
        // Навіть якщо впало — покажемо fallback на email
        this.profileReady = true;
        this._setProfile(this.createDisplayProfile(null, null, emailFallback));
      } finally {
        this.loadInflight = undefined;
      }
    };

    this.loadInflight = run();
    return this.loadInflight;
  }

  private async retryGetProfile(userId: string, tries = 3, delayMs = 200) {
    let lastErr: any;
    for (let i = 0; i < tries; i++) {
      try {
        return await this.auth.getProfile(userId);
      } catch (e: any) {
        lastErr = e;
        const msg = String(e?.message || e);
        const lockLike =
          msg.includes('NavigatorLockAcquireTimeoutError') ||
          msg.includes('The provided callback is no longer runnable') ||
          msg.includes('lock:') ||
          msg.includes('Lock');
        if (!lockLike || i === tries - 1) throw e;
        await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
      }
    }
    throw lastErr;
  }

  private _setProfile(next: ProfileDisplay) {
    // створюємо новий об’єкт (важливо для OnPush)
    this.profile = { ...next };
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
      const formatted = emailName.replace(/[^a-zA-Zа-яА-ЯёЁІіЇїЄєҐґ0-9]+/g, ' ').trim();
      return {
        firstName: formatted || emailFallback,
        lastName: '',
        initials: this.buildInitials(formatted || emailFallback, ''),
      };
    }

    return {
      firstName: sanitizedFirst,
      lastName: sanitizedLast,
      initials: this.buildInitials(sanitizedFirst, sanitizedLast),
    };
  }

  private buildInitials(firstName: string, lastName: string): string {
    const out = `${firstName?.trim()?.charAt(0) ?? ''}${lastName?.trim()?.charAt(0) ?? ''}`
      .trim()
      .toUpperCase();
    // Поки профіль ще вантажиться — не показуємо "??"
    if (!this.profileReady) return this.loadingInitials;
    return out || '??';
  }
}
