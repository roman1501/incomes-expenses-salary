import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-authentication',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './authentication.html',
  styleUrl: './authentication.scss'
})
export class AuthenticationComponent {
  protected showPassword = false;
  protected showNotice = false;
    private readonly router = inject(Router);

  protected get isRegister(): boolean {
    return this.router.url.startsWith('/register');
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  submit(): void {
    this.showNotice = true;
  }
}
