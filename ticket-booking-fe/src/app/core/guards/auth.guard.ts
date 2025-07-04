import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { TOKEN_KEY } from '../../constants/data-constants';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}
  canActivate(): boolean {
    if (!localStorage.getItem(TOKEN_KEY)) {
      this.router.navigate(['/login']);
      return false;
    }
    return true;
  }
}
