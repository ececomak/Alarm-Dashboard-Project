import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  get token() { return localStorage.getItem('token') || ''; }
  get email() { return localStorage.getItem('email') || ''; }
  get roleRaw() { return localStorage.getItem('role') || ''; }
  get role() { return this.roleRaw.toUpperCase().replace('İ', 'I'); }

  get isLoggedIn() { return !!this.token; }
  get isAdmin()    { return this.role === 'ADMIN'; }
  get isUser()     { return this.role === 'USER'; }

  hasRole(r: 'ADMIN' | 'USER') { return r === 'ADMIN' ? this.isAdmin : this.isUser; }
}