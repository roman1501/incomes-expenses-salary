import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { SupabaseAuthService } from '../../core/auth/supabase-auth.service';
import { AuthStateService } from '../../core/auth/auth-state.service';
import { filter, take } from 'rxjs/operators';

@Component({
  selector: 'app-authentication',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './authentication.html',
  styleUrl: './authentication.scss',
})
export class AuthenticationComponent implements OnInit {
  protected showPassword = false;
  protected passwordMismatch = false;
  protected serverError = '';
  protected serverSuccess = '';
  protected isBusy = false;
  protected canResend = false;
  protected lastTriedEmail = '';

  protected readonly namePattern =
    "^(?=(?:.*[A-Za-zА-Яа-яҐґЄєІіЇї]){3,})[A-ZА-ЯҐЄІЇ][A-Za-zА-Яа-яҐґЄєІіЇї\\s'-]*$";

  protected get isRegister(): boolean {
    return this.router.url.startsWith('/register');
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
  async resend(email: string) {
    this.serverError = '';
    this.serverSuccess = '';
    if (!email) return;
    try {
      await this.auth.resendConfirmation(email.toLowerCase().trim());
      this.serverSuccess = 'Confirmation email sent again. Please check your inbox.';
      this.canResend = false; // сховаємо кнопку після успішної відправки
    } catch (e: any) {
      this.serverError = e?.message ?? 'Failed to resend confirmation.';
      // кнопка може залишатися видимою для повторної спроби
    }
  }
clearMessages(): void {
  this.serverError = '';
  this.serverSuccess = '';
  // якщо юзер редагує email — ховаємо кнопку повторної відправки
  this.canResend = false;
}

  async submit(form: NgForm): Promise<void> {
    this.serverError = '';
    this.serverSuccess = '';

    const passwordControl = form.controls['password'];
    const confirmControl = form.controls['confirmPassword'];
    const pwd = passwordControl?.value ?? '';
    const confirm = confirmControl?.value ?? '';

    // 🔹 Перевірка на збіг паролів
    this.passwordMismatch =
      this.isRegister &&
      !!passwordControl &&
      !!confirmControl &&
      passwordControl.valid &&
      confirmControl.valid &&
      pwd !== confirm;

    if (this.passwordMismatch) {
      form.form.markAllAsTouched();
      return;
    }

    if (!form.valid) {
      form.form.markAllAsTouched();
      return;
    }

    const email = form.controls['email']?.value?.trim()?.toLowerCase();
    const password = form.controls['password']?.value;
    const firstName = this.isRegister ? form.controls['firstName']?.value?.trim() : undefined;
    const lastName = this.isRegister ? form.controls['lastName']?.value?.trim() : undefined;

    this.isBusy = true;

    try {
      if (this.isRegister) {
        const res = await this.auth.signUp({ email, password, firstName, lastName });

        // 🛡️ ВАРІАНТ 1: GoTrue-підписка вже існує -> identities порожні
        // Це надійний детектор "email уже зареєстрований", навіть якщо error не прийшов
        const alreadyExists =
          !!res.user &&
          Array.isArray((res.user as any).identities) &&
          (res.user as any).identities.length === 0;

        if (alreadyExists) {
          this.serverError = 'This email is already registered. Try logging in instead.';
          this.canResend = true;
          this.lastTriedEmail = email || '';
          return;
        }

        // 📨 Якщо акаунт створено, але сесії ще немає — очікуємо підтвердження email
        if (!res.session) {
          this.serverSuccess = 'Check your inbox to confirm your email.';
          this.canResend = true; // ← дати можливість надіслати ще раз
          this.lastTriedEmail = email || '';
        } else {
          // ✅ Якщо email підтверджено одразу (рідко, але можливо)
          this.serverSuccess = 'Account created. Redirecting...';
          await new Promise((r) => setTimeout(r, 600));
          this.router.navigateByUrl('/dashboard');
        }
      } else {
        // 🔹 Логін
        await this.auth.signIn(email, password);
        this.serverSuccess = 'Logged in. Redirecting...';
        await new Promise((r) => setTimeout(r, 400));
        this.router.navigateByUrl('/dashboard');
      }
    } catch (e: any) {
  const msg = (e?.message ?? 'Unexpected error').toString();

  if (/Email not confirmed/i.test(msg)) {
    this.serverError = 'Please confirm your email before logging in.';
    this.canResend = true;
    this.lastTriedEmail = form.controls['email']?.value?.trim()?.toLowerCase() || '';
  } else if (/Invalid login credentials/i.test(msg)) {
    this.serverError = 'Invalid email or password.';
    this.canResend = false;
  } else if (/already registered/i.test(msg) || /User already registered/i.test(msg)) {
    this.serverError = 'This email is already registered. Try logging in instead.';
    this.canResend = true;
    this.lastTriedEmail = form.controls['email']?.value?.trim()?.toLowerCase() || '';
  } else if (/rate limit/i.test(msg)) {
    this.serverError = 'Too many attempts. Please try again later.';
    this.canResend = false;
  } else if (/invalid email/i.test(msg)) {
    this.serverError = 'Please enter a valid email address.';
    this.canResend = false;
  } else {
    this.serverError = msg;
    this.canResend = false;
  }
}
 finally {
      this.isBusy = false;
    }
  }

  private readonly router = inject(Router);
  private readonly auth = inject(SupabaseAuthService);
  private authState = inject(AuthStateService);

  ngOnInit(): void {
    // Коли стан завантажився – якщо користувач уже залогінений, кидаємо на /dashboard
    this.authState.state$
      .pipe(
        filter((s) => !s.loading),
        take(1)
      )
      .subscribe((s) => {
        if (s.isAuthenticated) {
          this.router.navigateByUrl('/dashboard');
        }
      });
  }
}
