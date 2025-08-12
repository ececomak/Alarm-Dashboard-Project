import { Component } from '@angular/core';

@Component({
  selector: 'app-layout-demo',
  standalone: false,
  templateUrl: './layout-demo.html',
  styleUrls: ['./layout-demo.css'],
})
export class LayoutDemoComponent {
  kpis = [
    { icon: 'activity-outline', title: 'Active',  value: 42,  status: 'primary'  },
    { icon: 'clock-outline',    title: 'Last 60m', value: 9,   status: 'info'     },
    { icon: 'flash-outline',    title: 'Critical', value: 5,   status: 'danger'   },
    { icon: 'alert-circle-outline', title: 'Warning', value: 21, status: 'warning' },
  ];
}