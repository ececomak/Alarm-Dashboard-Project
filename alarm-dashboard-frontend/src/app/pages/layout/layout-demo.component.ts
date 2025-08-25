import { Component, OnDestroy, OnInit } from '@angular/core';
import { AlarmStoreService } from '../../core/realtime/alarm-store.service';
import { AlarmEvent } from '../../core/realtime/alarm-event';
import { Observable, Subject, combineLatest } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';

type KpiItem = {
  icon: string;
  title: string;
  status: 'primary' | 'info' | 'danger' | 'warning';
  value$: Observable<number>;
};

@Component({
  selector: 'app-layout-demo',
  standalone: false,
  templateUrl: './layout-demo.html',
  styleUrls: ['./layout-demo.css'],
})
export class LayoutDemoComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // live feeds
  recent$!: Observable<AlarmEvent[]>;
  latest$!: Observable<AlarmEvent[]>;

  // KPIs
  kpis: KpiItem[] = [];

  // kategori (10m→1h fallback)
  categoryLabel$!: Observable<'10m' | '1h' | '—'>;
  categories$!: Observable<Array<{ name: string; value: number; pct: number }>>;

  // 12 saatlik mini-barlar
  hourlyMini$!: Observable<Array<{ label: string; count: number; pct: number }>>;

  // Top systems (10m, canlı)
  topSystems$!: Observable<Array<{ name: string; value: number; pct: number }>>;

  constructor(private store: AlarmStoreService) {}

  ngOnInit(): void {
    // canlı listeler
    this.recent$ = this.store.recent$;
    this.latest$ = this.store.latest$;

    // KPIs
    const active$  = this.store.totalActive$;
    const last60m$ = this.store.last60m$;

    const sevUse$ = combineLatest([this.store.bySeverity10m$, this.store.bySeverity1h$]).pipe(
      map(([a, b]) => {
        const s10 = a.CRITICAL + a.WARN + a.INFO;
        const s1h = b.CRITICAL + b.WARN + b.INFO;
        return { use: s10 > 0 ? a : b, label: (s10 > 0 ? '10m' : (s1h > 0 ? '1h' : '—')) as '10m' | '1h' | '—' };
      })
    );
    const critical$ = sevUse$.pipe(map(x => x.use.CRITICAL));
    const warning$  = sevUse$.pipe(map(x => x.use.WARN));

    this.kpis = [
      { icon: 'activity-outline',         title: 'Active',   status: 'primary', value$: active$  },
      { icon: 'clock-outline',            title: 'Last 60m', status: 'info',    value$: last60m$ },
      { icon: 'flash-outline',            title: 'Critical', status: 'danger',  value$: critical$ },
      { icon: 'alert-circle-outline',     title: 'Warning',  status: 'warning', value$: warning$  },
    ];

    // Kategori (10m→1h)
    const catUse$ = combineLatest([this.store.byCategory10m$, this.store.byCategory1h$]).pipe(
      map(([a, b]) => {
        const sumA = a.reduce((s, x) => s + x.value, 0);
        const sumB = b.reduce((s, x) => s + x.value, 0);
        return { use: sumA > 0 ? a : b, label: (sumA > 0 ? '10m' : (sumB > 0 ? '1h' : '—')) as '10m' | '1h' | '—' };
      })
    );
    this.categoryLabel$ = catUse$.pipe(map(x => x.label));
    this.categories$ = catUse$.pipe(
      map(({ use }) => {
        const total = Math.max(1, use.reduce((s, x) => s + x.value, 0));
        return use
          .sort((a, b) => b.value - a.value)
          .slice(0, 6)
          .map(x => ({ name: x.name, value: x.value, pct: Math.round((x.value / total) * 100) }));
      })
    );

    // 12 saatlik mini-barlar
    this.hourlyMini$ = this.store.hourly12$.pipe(
      map(({ labels, counts }) => {
        const max = Math.max(1, ...counts);
        return labels.map((lb, i) => ({ label: lb, count: counts[i], pct: Math.round((counts[i] / max) * 100) }));
      })
    );

    // Top Systems (10m, recent$ üzerinden):
    this.topSystems$ = this.recent$.pipe(
      map(list => {
        const mapCount = new Map<string, number>();
        for (const e of list) {
          const key = e.system || e.device || '—';
          mapCount.set(key, (mapCount.get(key) ?? 0) + 1);
        }
        const arr = Array.from(mapCount.entries()).map(([name, value]) => ({ name, value }));
        const total = Math.max(1, arr.reduce((s, x) => s + x.value, 0));
        return arr.sort((a, b) => b.value - a.value).slice(0, 5)
                  .map(x => ({ ...x, pct: Math.round((x.value / total) * 100) }));
      })
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}