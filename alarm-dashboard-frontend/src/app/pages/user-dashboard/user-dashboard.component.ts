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

  // "My Active" canlı; diğerleri 24h heuristics
  summary = [
    { label: 'My Active',          value: 0, icon: 'alert-triangle-outline' },
    { label: 'Acknowledged (24h)', value: 0, icon: 'checkmark-circle-2-outline' },
    { label: 'Resolved (24h)',     value: 0, icon: 'checkmark-outline' }
  ];

  totalActive$!: Observable<number>;
  recent$!: Observable<AlarmEvent[]>;
  latest$!: Observable<AlarmEvent[]>;

  private subs: Subscription[] = [];

  constructor(private store: AlarmStoreService) {}

  ngOnInit(): void {
    this.totalActive$ = this.store.totalActive$;
    this.recent$ = this.store.recent$;
    this.latest$ = this.store.latest$;

    this.subs.push(
      this.totalActive$.subscribe(v => this.summary[0].value = v ?? 0),
      this.store.ack24h$.subscribe(v => this.summary[1].value = v ?? 0),
      this.store.resolved24h$.subscribe(v => this.summary[2].value = v ?? 0),
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }
}