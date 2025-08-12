import { Component } from '@angular/core';
import { Router, NavigationEnd, Event as RouterEvent } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NbThemeService, NbSidebarService } from '@nebular/theme';

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

  constructor(
    private router: Router,
    private theme: NbThemeService,
    private sidebar: NbSidebarService
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
    const base: any[] = [
      { title: 'Admin Dashboard', icon: 'grid-outline', link: '/admin-dashboard', hidden: role !== 'ADMIN' },
      { title: 'User Dashboard',  icon: 'person-outline', link: '/user-dashboard',  hidden: role !== 'USER'  },
    ];

    const showcase: any[] = [
      { title: 'E-commerce',    icon: 'shopping-cart-outline', expanded: false,
        children: [{ title: 'Coming soon', disabled: true }] },
      { title: 'IoT Dashboard', icon: 'home-outline', expanded: false,
        children: [{ title: 'Coming soon', disabled: true }] },

      { title: 'FEATURES', group: true },

      { title: 'Layout', icon: 'layout-outline', 
        children: [{ title: 'Columns & Cards', link: '/layout' }] },
      { title: 'Forms', icon: 'edit-2-outline',
        children: [{ title: 'Alarm Filter', link: '/forms' }] },
      { title: 'UI Features', icon: 'grid-outline',
        children: [{ title: 'Components', link: '/ui' }] },
      { title: 'Modal & Overlays', icon: 'options-2-outline',
        children: [{ title: 'Dialogs & Toastr', link: '/overlays' }] },
      { title: 'Extra Components', icon: 'layers-outline',
        children: [{ title: 'Maintenance Wizard', link: '/wizard' }] },
      { title: 'Maps', icon: 'map-outline', 
        children: [{ title: 'Devices Map', link: '/maps' }] },
      { title: 'Charts', icon: 'pie-chart-outline',
        children: [{ title: 'Analytics', link: '/charts' }] },
      { title: 'Editors', icon: 'edit-2-outline', 
        children: [{ title: 'Maintenance Notes', link: '/editors' }] },
      { title: 'Tables & Data', icon: 'grid-outline',
        children: [{ title: 'Simple Table', link: '/tables' }] },
      { title: 'Miscellaneous',    icon: 'shuffle-2-outline',
        children: [{ title: 'Coming soon', disabled: true }] },
      { title: 'Auth',             icon: 'unlock-outline',
        children: [{ title: 'Coming soon', disabled: true }] },
    ];

    return [...base, ...showcase];
  }
}