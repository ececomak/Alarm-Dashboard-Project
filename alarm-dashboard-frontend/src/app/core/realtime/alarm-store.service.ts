import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AlarmEvent } from './alarm-event';

@Injectable({ providedIn: 'root' })
export class AlarmStoreService {
  private windowMs = 10 * 60 * 1000;

  private totalActiveSub = new BehaviorSubject<number>(0);
  totalActive$ = this.totalActiveSub.asObservable();

  private recentSub = new BehaviorSubject<AlarmEvent[]>([]);
  recent$ = this.recentSub.asObservable();

  push(event: AlarmEvent) {
    const now = Date.now();
    const list = [event, ...this.recentSub.value]
      .filter(e => {
        const t = new Date(e.timestamp).getTime();
        return !isNaN(t) && (now - t) <= this.windowMs;
      })
      .slice(0, 100);

    this.recentSub.next(list);
    this.totalActiveSub.next(list.length);
  }
}