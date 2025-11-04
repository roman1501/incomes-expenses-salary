import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard'; 
import { authCallbackGuard } from './core/auth/auth-callback.guard';

// 👇 Функції для лінивого імпорту компонентів
const loadAuthentication = () =>
  import('./components/authentication/authentication').then((m) => m.AuthenticationComponent);

const loadDashboard = () =>
  import('./components/dashboard/dashboard').then((m) => m.DashboardComponent);
const loadAuthCallback = () =>
  import('./components/auth-callback/auth-callback').then((m) => m.AuthCallbackComponent);

// 👇 якщо колись робитимеш reset password або підтвердження email — можна буде додати
// const loadAuthCallback = () =>
//   import('./components/auth-callback/auth-callback')
//     .then(m => m.AuthCallbackComponent);

export const routes: Routes = [
  {
    path: '',
    loadComponent: loadAuthentication, // сторінка логіну
  },
  {
    path: 'register',
    loadComponent: loadAuthentication, // сторінка реєстрації
  },
  {
    path: 'dashboard',
    loadComponent: loadDashboard,
    canActivate: [authGuard], // ✅ сторінка захищена guard’ом
  },
   {
    path: 'auth/callback',
    loadComponent: loadAuthCallback,
    canActivate: [authCallbackGuard],
  }, // <<< новий
  // якщо колись буде reset-password:
  // {
  //   path: 'auth/callback',
  //   loadComponent: loadAuthCallback,
  // },
  {
    path: '**',
    redirectTo: '', // все інше веде на логін
  },
];
