// src/app/components/auth-callback/auth-callback.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { getSupabaseClient } from '../../core/supabase.client';

@Component({
  standalone: true,
  selector: 'app-auth-callback',
  imports: [CommonModule],
  templateUrl: './auth-callback.html',
  styleUrl: './auth-callback.scss',
})
export class AuthCallbackComponent implements OnInit {
  private router = inject(Router);
  private sb = getSupabaseClient();

  async ngOnInit() {
    // Достатньо лише створити клієнт: detectSessionInUrl "підхопить" токени з URL.
    // Додатково перевіримо, що сесія вже є, і після короткої паузи підемо на "/".
    try {
      const {
        data: { session },
      } = await this.sb.auth.getSession();
      // Невелика пауза, щоб користувач побачив повідомлення
      setTimeout(() => this.router.navigateByUrl('/'), 5000);
    } catch {
      // У рідкісних випадках, якщо щось пішло не так — все одно повертаємо на головну
      this.router.navigateByUrl('/');
    }
  }
}
