import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseAuthService } from '../../core/auth/supabase-auth.service';
import { Router } from '@angular/router';

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

  async logout() {
    await this.auth.signOut();
    this.router.navigateByUrl('/');
  }
}
