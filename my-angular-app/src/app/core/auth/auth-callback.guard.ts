import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStateService } from './auth-state.service';
import { filter, map, take } from 'rxjs/operators';

const hasAuthTokensInUrl = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  const hash = window.location.hash ?? '';
  const search = window.location.search ?? '';

  return /access_token=/.test(hash) || /refresh_token=/.test(hash) || /code=/.test(search);
};

export const authCallbackGuard: CanActivateFn = () => {
  if (hasAuthTokensInUrl()) {
    return true;
  }

  const router = inject(Router);
  const state = inject(AuthStateService);

  return state.state$.pipe(
    filter((s) => !s.loading),
    take(1),
    map((s) => (s.isAuthenticated ? router.createUrlTree(['/dashboard']) : router.createUrlTree(['/'])))
  );
};