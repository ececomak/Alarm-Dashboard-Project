import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth-demo',
  standalone: false,
  templateUrl: './auth-demo.html',
  styleUrls: ['./auth-demo.css'],
})
export class AuthDemoComponent {
  constructor(private router: Router) {}

  get email() { return localStorage.getItem('email') || ''; }
  get role()  {
    return (localStorage.getItem('role') || '').toUpperCase().replace('İ','I');
  }
  get isLoggedIn() { return !!localStorage.getItem('token'); }

  goAdmin() { this.router.navigateByUrl('/admin-dashboard'); }
  goUser()  { this.router.navigateByUrl('/user-dashboard'); }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    localStorage.removeItem('role');
    this.router.navigateByUrl('/login');
  }
}