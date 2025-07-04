import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { TOKEN_KEY } from '../../constants/data-constants';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  constructor(private router: Router) {}

  // Save token to localStorage
  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  // Retrieve token from localStorage
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  // Check if user is logged in
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  // Logout: clear token and navigate to login
  logout() {
    localStorage.removeItem(TOKEN_KEY);
    this.router.navigate(['/login']);
  }
}
