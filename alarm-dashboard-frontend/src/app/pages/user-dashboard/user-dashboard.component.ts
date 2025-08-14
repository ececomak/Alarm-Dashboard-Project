import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { AlarmStoreService } from '../../core/realtime/alarm-store.service';
import { AlarmEvent } from '../../core/realtime/alarm-event';

@Component({
  selector: 'app-user-dashboard',
  standalone: false,
  templateUrl: './user-dashboard.html',
  styleUrls: ['./user-dashboard.css']
})
export class UserDashboardComponent implements OnInit, OnDestroy {
  email = localStorage.getItem('email') || '';

  // Basit özet istatistikler (yalnızca "My Active" canlı; diğerleri şimdilik placeholder)
  summary = [
    { label: 'My Active',        value: 0,  icon: 'alert-triangle-outline' },
    { label: 'Acknowledged',     value: 3,  icon: 'checkmark-circle-2-outline' }, 
    { label: 'Resolved (24h)',   value: 12, icon: 'checkmark-outline' }           
  ];

    // Recent Activity (statik örnek listesi)
  recentActivity: { time: string; text: string }[] = [
    { time: '09:12',     text: 'Tunnel-2: Warning acknowledged' },
    { time: '08:45',     text: 'Tunnel-4: Info received' },
    { time: 'Yesterday', text: 'Tunnel-1: Critical resolved' },
  ];
  
  // Live
  totalActive$!: Observable<number>;
  recent$!: Observable<AlarmEvent[]>;

  private subs: Subscription[] = [];

  constructor(private store: AlarmStoreService) {}

  ngOnInit(): void {
    // canlı akışlar
    this.totalActive$ = this.store.totalActive$; 
    this.recent$ = this.store.recent$;           

    // KPI: "My Active" = totalActive$ (canlı)
    this.subs.push(
      this.totalActive$.subscribe(v => this.summary[0].value = v ?? 0)
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }
}