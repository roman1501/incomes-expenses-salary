import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';

@Component({
  selector: 'app-authentication',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './authentication.html',
  styleUrl: './authentication.scss'
})
export class AuthenticationComponent {
  protected showPassword = false;
  protected showNotice = false;
  protected passwordMismatch = false;
  protected readonly namePattern =
  "^(?=(?:.*[A-Za-zА-Яа-яҐґЄєІіЇї]){3,})[A-Za-zА-Яа-яҐґЄєІіЇї\\s'-]+$";
  private readonly router = inject(Router);

  protected get isRegister(): boolean {
    return this.router.url.startsWith('/register');
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

submit(form: NgForm): void {
  this.showNotice = false;

  const pwd = form.controls['password']?.value ?? '';
  const confirm = form.controls['confirmPassword']?.value ?? '';
  this.passwordMismatch = this.isRegister && pwd !== confirm;

  if (this.passwordMismatch) {
    form.form.markAllAsTouched();
    return;
  }

  if (!form.valid) {
    form.form.markAllAsTouched();
    return;
  }

  this.showNotice = true;
}

}
