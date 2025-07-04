import { Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { filter } from 'rxjs';

@Component({
  standalone: false,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'Event Ticket Booking App';
  showSidebar = false;
  constructor(private auth: AuthService, private router: Router) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateSidebarVisibility();
      });
  }
  updateSidebarVisibility() {
    const publicRoutes = ['/login', '/register'];
    const currentUrl = this.router.url;

    this.showSidebar =
      !publicRoutes.includes(currentUrl) && this.auth.isLoggedIn();
  }
  
  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
