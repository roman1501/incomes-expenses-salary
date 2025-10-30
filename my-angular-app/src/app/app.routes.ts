import { Routes } from '@angular/router';

const loadAuthentication = () =>
  import('./components/authentication/authentication')
    .then(m => m.AuthenticationComponent);

export const routes: Routes = [
  {
    path: '',
    loadComponent: loadAuthentication,
  },
  {
    path: 'register',
    loadComponent: loadAuthentication,
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./components/dashboard/dashboard')
        .then(m => m.DashboardComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
