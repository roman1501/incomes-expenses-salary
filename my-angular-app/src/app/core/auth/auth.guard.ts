import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStateService } from './auth-state.service';
import { filter, map, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = () => {
  const state = inject(AuthStateService);
  const router = inject(Router);

  return state.state$.pipe(
    filter((s) => !s.loading),
    take(1),
    map((s) => (s.isAuthenticated ? true : router.createUrlTree(['/'])))
  );
};
