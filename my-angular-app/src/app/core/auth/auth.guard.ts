import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStateService } from './auth-state.service';
import { map } from 'rxjs/operators';

export const authGuard: CanActivateFn = () => {
  const state = inject(AuthStateService);
  const router = inject(Router);

  return state.state$.pipe(
    map(s => {
      if (s.loading) return false;
      if (s.isAuthenticated) return true;
      router.navigateByUrl('/');
      return false;
    })
  );
};
