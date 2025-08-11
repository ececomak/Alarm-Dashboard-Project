import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone:false,
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  email = '';
  password = '';
  errorMessage = '';

  constructor(private http: HttpClient, private router: Router) {}

  private decodeJwt(token: string): any {
    try {
      const payload = token.split('.')[1];
      const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  onLogin() {
    const body = { email: this.email, password: this.password };

    this.http.post<any>('http://localhost:8080/api/auth/login', body)
      .subscribe({
        next: (res) => {
          localStorage.removeItem('token');
          localStorage.removeItem('email');
          localStorage.removeItem('role');

          const token = String(res?.token || '');
          const claims = this.decodeJwt(token);
          const roleFromJwt = String(claims?.role || res?.role || '').toUpperCase();

          localStorage.setItem('token', token);
          localStorage.setItem('email', String(res?.email || claims?.sub || ''));
          localStorage.setItem('role', roleFromJwt);

          console.log('LOGIN RESPONSE:', res);
          console.log('JWT CLAIMS:', claims);
          console.log('ROLE USED:', roleFromJwt);

          if (roleFromJwt === 'ADMIN') {
            this.router.navigate(['/admin-dashboard']);
          } else if (roleFromJwt === 'USER') {
            this.router.navigate(['/user-dashboard']);
          } else {
            this.router.navigate(['/user-dashboard']);
          }
        },
        error: (_) => {
          this.errorMessage = 'Giriş başarısız! Email veya şifre yanlış.';
        }
      });
  }
}