import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { LoginService } from '../../services/login.service';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  loginError = false;

  constructor(
    private router: Router,
    private loginService: LoginService
  ) {}

  login() {
      console.log('Login fonksiyonu tetiklendi');
      console.log('Email:', this.email);
      console.log('Password:', this.password);
    this.loginService.login(this.email, this.password).subscribe({
      next: (user) => {
        if (user && user.role === 'admin') {
          this.router.navigate(['/admin-dashboard']);
        } else if (user && user.role === 'user') {
          this.router.navigate(['/user-dashboard']);
        } else {
          this.loginError = true;
        }
      },
      error: (err) => {
        console.error('Login error:', err);
        this.loginError = true;
      }
    });
  }
}