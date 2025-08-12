import { Component } from '@angular/core';
import { Router, NavigationEnd, Event as RouterEvent } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NbThemeService, NbSidebarService } from '@nebular/theme'; // ← NbSidebarService eklendi

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
  currentTheme = localStorage.getItem('theme') || 'default';

  constructor(private router: Router, private theme: NbThemeService, private sidebar: NbSidebarService) { // ← eklendi
    this.theme.changeTheme(this.currentTheme);

    this.router.events
      .pipe(filter((e: RouterEvent): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        const url = e.urlAfterRedirects || e.url;
        this.showShell = !url.startsWith('/login');

        this.email = localStorage.getItem('email') || '';
        this.role = (localStorage.getItem('role') || '').toUpperCase().replace('İ', 'I');

        this.menuItems =
          this.role === 'ADMIN'
            ? [
                { title: 'Admin Dashboard', icon: 'grid-outline', link: '/admin-dashboard' },
                { title: 'User Dashboard', icon: 'person-outline', link: '/user-dashboard' },
              ]
            : [{ title: 'User Dashboard', icon: 'person-outline', link: '/user-dashboard' }];
      });
  }

  changeTheme(name: string) {
    this.currentTheme = name;
    localStorage.setItem('theme', name);
    this.theme.changeTheme(name);
  }

  toggleSidebar() {
    this.sidebar.toggle(true, 'menu-sidebar');
  }
}