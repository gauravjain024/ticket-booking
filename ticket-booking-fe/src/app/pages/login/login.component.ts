import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  standalone: false,
  selector: 'app-login',
  templateUrl: './login.component.html',
})
export class LoginComponent {
  email = '';
  password = '';

  constructor(
    private api: ApiService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  login() {
    this.api.login(this.email, this.password).subscribe({
      next: (res: any) => {
        localStorage.setItem('token', res.token);
        this.router.navigate(['/events']);
        this.toastr.success('Login Successful!');
      },
      error: () => this.toastr.error('Login Failed'),
    });
  }
}
