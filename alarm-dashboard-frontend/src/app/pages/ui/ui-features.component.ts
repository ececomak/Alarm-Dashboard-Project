import { Component, OnDestroy, OnInit } from '@angular/core';
import { NbToastrService } from '@nebular/theme';
import { BehaviorSubject, Observable, Subscription, combineLatest, map, tap } from 'rxjs';
import { AlarmStoreService } from '../../core/realtime/alarm-store.service';
import { AlarmEvent } from '../../core/realtime/alarm-event';

type SevTriplet = { CRITICAL: number; WARN: number; INFO: number };

@Component({
  selector: 'app-ui-features',
  standalone: false,
  templateUrl: './ui-features.html',
  styleUrls: ['./ui-features.css'],
})
export class UiFeaturesComponent implements OnInit, OnDestroy {
  // ---- Live sources
  latest$!: Observable<AlarmEvent[]>;
  totalActive$!: Observable<number>;
  last60m$!: Observable<number>;
  uptime$!: Observable<number>;

  // Alerts (pauseable)
  private paused$ = new BehaviorSubject<boolean>(false);
  pausedLive = false;        
  private latestCache: AlarmEvent[] = [];
  alerts$!: Observable<AlarmEvent[]>;

  // Streaming/Rate
  isStreaming$!: Observable<boolean>;
  ratePerMin$!: Observable<number>; 
  // Severity counts (10m → 1h fallback)
  sevLabel$!: Observable<'10m' | '1h' | '—'>;
  sevCounts$!: Observable<SevTriplet>;

  // Category (1h)
  cats1h$!: Observable<Array<{ name: string; value: number; pct: number }>>;

  // Settings
  toastCritical = false;
  compactRows = false;

  private subs: Subscription[] = [];

  constructor(
    private store: AlarmStoreService,
    private toastr: NbToastrService,
  ) {}

  ngOnInit(): void {
    // load settings
    this.pausedLive   = this.readBool('ui.pauseLive', false);
    this.toastCritical= this.readBool('ui.toastCritical', false);
    this.compactRows  = this.readBool('ui.compactRows', false);
    this.paused$.next(this.pausedLive);

    // bind store
    this.latest$      = this.store.latest$;
    this.totalActive$ = this.store.totalActive$;
    this.last60m$     = this.store.last60m$;
    this.uptime$      = this.store.uptime24h$;

    // cache latest list for pause feature + critical toast
    this.subs.push(
      this.latest$.subscribe(list => {
        if (list && list.length) {
          const prevTop = this.latestCache?.[0];
          const top = list[0];
          // toast on fresh CRITICAL (not paused, enabled)
          if (!this.pausedLive && this.toastCritical && top.level === 'CRITICAL') {
            if (!prevTop || this.key(top) !== this.key(prevTop)) {
              this.toastr.danger(top.message || 'Critical alarm', 'CRITICAL', { duration: 3500, icon: 'alert-triangle-outline' });
            }
          }
        }
        this.latestCache = list ?? [];
      })
    );

    // alerts$ honors pause
    this.alerts$ = combineLatest([this.latest$, this.paused$]).pipe(
      map(([list, paused]) => paused ? this.latestCache : (list ?? []))
    );

    // streaming: last event age <= 10s
    this.isStreaming$ = this.latest$.pipe(
      map(list => {
        const ts = list?.[0]?.arrivedAt || list?.[0]?.createdAt || list?.[0]?.timestamp;
        if (!ts) return false;
        return (Date.now() - new Date(ts).getTime()) <= 10_000;
      })
    );

    // rate/min from hourly12 last bucket
    this.ratePerMin$ = this.store.hourly12$.pipe(
      map(({ counts }) => {
        const last = counts[counts.length - 1] ?? 0;
        return Math.round((last / 60) * 10) / 10; 
      })
    );

    // severity counts fallback 10m→1h
    const sev10$ = this.store.bySeverity10m$;
    const sev1h$ = this.store.bySeverity1h$;
    const sevUse$ = combineLatest([sev10$, sev1h$]).pipe(
      map(([a, b]) => {
        const sumA = a.CRITICAL + a.WARN + a.INFO;
        const sumB = b.CRITICAL + b.WARN + b.INFO;
        return { use: sumA > 0 ? a : b, label: (sumA > 0 ? '10m' : (sumB > 0 ? '1h' : '—')) as '10m'|'1h'|'—' };
      })
    );
    this.sevCounts$ = sevUse$.pipe(map(x => x.use));
    this.sevLabel$  = sevUse$.pipe(map(x => x.label));

    // categories 1h with %
    this.cats1h$ = this.store.byCategory1h$.pipe(
      map(arr => {
        const total = Math.max(1, arr.reduce((s, x) => s + x.value, 0));
        return [...arr].sort((a,b)=>b.value-a.value).slice(0,8)
          .map(x => ({ name: x.name, value: x.value, pct: Math.round((x.value/total)*100) }));
      })
    );
  }

  // ---- UI handlers
  togglePause(): void {
    this.pausedLive = !this.pausedLive;
    this.paused$.next(this.pausedLive);
    this.writeBool('ui.pauseLive', this.pausedLive);
  }
  toggleToast(): void {
    this.toastCritical = !this.toastCritical;
    this.writeBool('ui.toastCritical', this.toastCritical);
  }
  toggleCompact(): void {
    this.compactRows = !this.compactRows;
    this.writeBool('ui.compactRows', this.compactRows);
  }

  copyRow(e: AlarmEvent) {
    try {
      const json = JSON.stringify(e, null, 2);
      if (navigator?.clipboard) navigator.clipboard.writeText(json);
      this.toastr.show('Copied to clipboard.', 'Event', { status: 'primary', duration: 1200 });
    } catch {}
  }

  // progress color from uptime
  uptimeStatus(u: number | null | undefined): 'primary' | 'warning' | 'success' {
    const x = (u ?? 0);
    if (x >= 100) return 'success';
    if (x >= 85)  return 'primary';
    return 'warning';
  }

  private key(e: AlarmEvent) {
    return e.id ?? `${e.system}|${e.point ?? e.device}|${e.location}|${e.message}|${e.timestamp}`;
  }

  private readBool(k: string, d: boolean) {
    const v = localStorage.getItem(k);
    return v === null ? d : v === '1';
    }
  private writeBool(k: string, v: boolean) {
    localStorage.setItem(k, v ? '1' : '0');
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }
}