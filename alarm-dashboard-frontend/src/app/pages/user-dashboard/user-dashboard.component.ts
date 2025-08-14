import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { AlarmStoreService } from '../../core/realtime/alarm-store.service';
import { AlarmEvent } from '../../core/realtime/alarm-event';

@Component({
  selector: 'app-user-dashboard',
  standalone: false,
  templateUrl: './user-dashboard.html',
  styleUrls: ['./user-dashboard.css']
})
export class UserDashboardComponent {
  email = localStorage.getItem('email') || '';

  // basit özet istatistikler
  summary = [
    { label: 'My Active', value: 7,  icon: 'alert-triangle-outline' },
    { label: 'Acknowledged', value: 3, icon: 'checkmark-circle-2-outline' },
    { label: 'Resolved (24h)', value: 12, icon: 'checkmark-outline' },
  ];

  // son işlemler – örnek veriler (ileride backend’den doldur)
  recent = [
    { time: '09:12', text: 'Tunnel-2: Warning acknowledged' },
    { time: '08:45', text: 'Tunnel-4: Info received' },
    { time: 'Yesterday', text: 'Tunnel-1: Critical resolved' },
  ];

  // Live
  totalActive$!: Observable<number>;
  recent$!: Observable<AlarmEvent[]>;

  constructor(private store: AlarmStoreService) {}

  ngOnInit(): void {
    this.totalActive$ = this.store.totalActive$;
    this.recent$ = this.store.recent$;
  }
}