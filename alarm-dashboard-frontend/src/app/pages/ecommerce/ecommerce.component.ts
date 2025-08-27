import { Component } from '@angular/core';
import { combineLatest, interval, map, startWith } from 'rxjs';
import { AlarmStoreService } from '../../core/realtime/alarm-store.service';
import { AlarmEvent } from '../../core/realtime/alarm-event';

type ScheduledMute = { devicePattern: string; startAt: string; endAt: string; ticketId: string };

@Component({
  selector: 'app-ecommerce',
  standalone: false,
  templateUrl: './ecommerce.html',
  styleUrls: ['./ecommerce.css'],
})
export class EcommerceComponent {   // Artık 'Operations Info Board'
  constructor(private store: AlarmStoreService) {}

  /** Üstte kayan ticker metni */
  ticker$ = combineLatest([
    this.store.bySeverity10m$,
    this.store.uptime24h$,
    this.store.ack24h$,
    this.store.resolved24h$,
    this.store.buffer$,
  ]).pipe(
    map(([sev, uptime, ack, resolved, buf]) => {
      const c = sev?.CRITICAL ?? 0;
      const w = sev?.WARN ?? 0;
      const i = sev?.INFO ?? 0;
      const q = this.quietMinutesSinceLastCritical(buf);
      const up = typeof uptime === 'number' ? uptime.toFixed(1) : '—';
      return `CRIT ${c}  •  WARN ${w}  •  INFO ${i}  •  Uptime 24h ${up}%  •  Ack 24h ${ack}  •  Resolved 24h ${resolved}  •  Quiet ${q}m`;
    })
  );

  /** Aktif bakım penceresi */
  activeMute$ = interval(30_000).pipe(
    startWith(0),
    map(() => this.readActiveMute())
  );

  /** Fun facts kartları */
  facts$ = combineLatest([
    this.store.byCategory1h$,
    this.store.hourly12$,
    this.store.weekly7$,
    this.store.buffer$,
  ]).pipe(
    map(([cat1h, hourly, weekly, buf]) => {
      const topCat = (cat1h ?? []).slice().sort((a, b) => b.value - a.value)[0]?.name ?? '—';
      const avgPerHour = (hourly?.counts?.length ?? 0)
        ? Math.round(hourly.counts.reduce((a, b) => a + b, 0) / hourly.counts.length)
        : 0;
      const quietMin = this.quietMinutesSinceLastCritical(buf);
      const quietDev = this.quietestDevice24h(buf); // {name, value}

      return [
        { title: 'Top category (1h)', value: topCat },
        { title: 'Quiet streak', value: `${quietMin} min since last CRIT` },
        { title: 'Avg alarms / hour (12h)', value: `${avgPerHour}` },
        { title: 'Quietest device (24h)', value: `${quietDev.name} (${quietDev.value})` },
      ];
    })
  );

  /** 7 günlük mini aktivite barları */
  last7$ = this.store.weekly7$.pipe(
    map(w => {
      const max = Math.max(...w.totals, 1);
      return w.labels.map((label, i) => ({
        label,
        total: w.totals[i],
        pct: Math.round((w.totals[i] / max) * 100),
      }));
    })
  );

  // ---------- helpers ----------
  private tsOf(e: AlarmEvent): number {
    return new Date(e.arrivedAt ?? e.createdAt ?? e.timestamp).getTime();
  }

  private quietMinutesSinceLastCritical(buf: AlarmEvent[]): number {
    const lastCrit = buf.find(e => (e.level ?? '').toUpperCase() === 'CRITICAL');
    if (!lastCrit) return 0;
    const t = this.tsOf(lastCrit);
    return Math.max(0, Math.floor((Date.now() - t) / 60000));
    }

  private quietestDevice24h(buf: AlarmEvent[]): { name: string; value: number } {
    const since = Date.now() - 24 * 60 * 60 * 1000;
    const m = new Map<string, number>();
    for (const e of buf) {
      const t = this.tsOf(e);
      if (isNaN(t) || t < since) continue;
      const name = e.device ?? e.point ?? e.system ?? 'Unknown';
      m.set(name, (m.get(name) ?? 0) + 1);
    }
    const list = Array.from(m.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => a.value - b.value);
    return list[0] ?? { name: '—', value: 0 };
  }

  private readActiveMute(): { ticketId: string; until: string } | null {
    try {
      const raw = localStorage.getItem('overlay-scheduled-mutes');
      if (!raw) return null;
      const arr = JSON.parse(raw) as ScheduledMute[];
      const now = Date.now();
      const cur = arr.find(x => now >= new Date(x.startAt).getTime() && now <= new Date(x.endAt).getTime());
      return cur ? { ticketId: cur.ticketId, until: new Date(cur.endAt).toLocaleTimeString() } : null;
    } catch { return null; }
  }
}