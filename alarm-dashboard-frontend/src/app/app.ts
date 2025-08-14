import { Component } from '@angular/core';
import { Router, NavigationEnd, Event as RouterEvent } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NbThemeService, NbSidebarService } from '@nebular/theme';

import { AlarmSocketService } from './core/realtime/alarm-socket.service';
import { AlarmSnapshotService } from './core/realtime/alarm-snapshot.service';
import { AlarmStoreService } from './core/realtime/alarm-store.service';

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
  currentTheme = localStorage.getItem('theme') || 'default';
  menuItems: any[] = [];

  private realtimeStarted = false;

  constructor(
    private router: Router,
    private theme: NbThemeService,
    private sidebar: NbSidebarService,

    private socket: AlarmSocketService,
    private snapshot: AlarmSnapshotService,
    private store: AlarmStoreService,
  ) {
    this.theme.changeTheme(this.currentTheme);

    this.router.events
      .pipe(filter((e: RouterEvent): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        const url = e.urlAfterRedirects || e.url;
        this.showShell = !url.startsWith('/login');

        this.email = localStorage.getItem('email') || '';
        this.role = (localStorage.getItem('role') || '').toUpperCase().replace('İ', 'I');

        this.menuItems = this.buildMenu(this.role);

        if (this.showShell && !this.realtimeStarted) {
          this.realtimeStarted = true;

          const token = localStorage.getItem('token') || undefined;
          this.socket.connect(token); 

          this.snapshot
            .loadRecentAndHydrate(evts => this.store.hydrate(evts), 10)
            .catch(err => console.warn('[SNAPSHOT recent] failed', err));

          this.snapshot
            .loadMonthSinceFirstDay(evts => this.store.hydrate(evts))
            .catch(err => console.warn('[SNAPSHOT month] failed', err));
        }
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

  private buildMenu(role: string): any[] {
    const isAdmin = role === 'ADMIN';

    const base: any[] = [
      { title: 'Admin Dashboard', icon: 'grid-outline', link: '/admin-dashboard', hidden: !isAdmin },
      { title: 'User Dashboard',  icon: 'person-outline', link: '/user-dashboard',  hidden: isAdmin  },
    ];

    const showcase: any[] = [
      { title: 'E-commerce', icon: 'shopping-cart-outline', expanded: false,
        children: [{ title: 'Dashboard', link: '/ecommerce' }] },

      { title: 'IoT Dashboard', icon: 'home-outline', expanded: false,
        children: [{ title: 'Dashboard', link: '/iot' }] },

      { title: 'FEATURES', group: true },

      { title: 'Layout', icon: 'layout-outline',
        children: [{ title: 'Columns & Cards', link: '/layout' }] },

      { title: 'Forms', icon: 'edit-2-outline',
        children: [{ title: 'Alarm Filter', link: '/forms' }] },

      { title: 'UI Features', icon: 'grid-outline',
        children: [{ title: 'Components', link: '/ui' }] },

      { title: 'Modal & Overlays', icon: 'options-2-outline',
        children: [{ title: 'Dialogs & Toastr', link: '/overlays' }] },

      // Admin-only
      { title: 'Extra Components', icon: 'layers-outline', adminOnly: true,
        children: [{ title: 'Maintenance Wizard', link: '/wizard' }] },

      { title: 'Maps', icon: 'map-outline',
        children: [{ title: 'Devices Map', link: '/maps' }] },

      { title: 'Charts', icon: 'pie-chart-outline',
        children: [{ title: 'Analytics', link: '/charts' }] },

      // Admin-only
      { title: 'Editors', icon: 'edit-2-outline', adminOnly: true,
        children: [{ title: 'Maintenance Notes', link: '/editors' }] },

      { title: 'Tables & Data', icon: 'grid-outline',
        children: [{ title: 'Simple Table', link: '/tables' }] },

      { title: 'Miscellaneous', icon: 'pantone-outline',
        children: [{ title: 'Misc Pages', link: '/misc' }] },

      { title: 'Auth', icon: 'lock-outline',
        children: [{ title: 'Login & Register', link: '/auth' }] },
    ];

    const prune = (items: any[]): any[] =>
      items
        .filter(i => !i.hidden)
        .filter(i => !(i.adminOnly && !isAdmin))
        .map(i => {
          if (i.children && Array.isArray(i.children)) {
            const kids = prune(i.children);
            if (!kids.length) return null as any;
            return { ...i, children: kids };
          }
          return i;
        })
        .filter(Boolean);

    return prune([...base, ...showcase]);
  }
}