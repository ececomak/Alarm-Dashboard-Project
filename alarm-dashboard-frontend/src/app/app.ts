import { Component } from '@angular/core';
import { Router, NavigationEnd, Event as RouterEvent } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App {
  showShell = false;
  email = '';
  role = '';
  menuItems: any[] = [];

  constructor(private router: Router) {
    this.router.events
      .pipe(
        filter((e: RouterEvent): e is NavigationEnd => e instanceof NavigationEnd)
      )
      .subscribe((e) => {
        const url = e.urlAfterRedirects || e.url;
        this.showShell = !url.startsWith('/login');

        this.email = localStorage.getItem('email') || '';
        this.role = (localStorage.getItem('role') || '')
          .toUpperCase()
          .replace('İ', 'I');

        this.menuItems =
          this.role === 'ADMIN'
            ? [
                { title: 'Admin Dashboard', icon: 'grid-outline', link: '/admin-dashboard' },
                { title: 'User Dashboard', icon: 'person-outline', link: '/user-dashboard' },
              ]
            : [{ title: 'User Dashboard', icon: 'person-outline', link: '/user-dashboard' }];
      });
  }
}