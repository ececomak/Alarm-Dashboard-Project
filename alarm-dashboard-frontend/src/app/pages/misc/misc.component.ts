import { Component, OnDestroy } from '@angular/core';
import { AlarmStoreService } from '../../core/realtime/alarm-store.service';
import { AlarmEvent } from '../../core/realtime/alarm-event';
import { NbToastrService, NbGlobalPhysicalPosition } from '@nebular/theme';
import { BehaviorSubject, combineLatest, interval, map, startWith, Subscription } from 'rxjs';

type SevCounts = { CRITICAL: number; WARN: number; INFO: number };

const SNOOZE_KEY = 'overlay-snooze-until';
const MUTES_KEY = 'overlay-muted-patterns';
const SCHED_MUTES_KEY = 'overlay-scheduled-mutes';
const LIVE_KEY = 'misc-live';
const NOTIFY_KEY = 'misc-notify';

@Component({
  selector: 'app-misc',
  standalone: false,
  templateUrl: './misc.html',
  styleUrls: ['./misc.css'],
})
export class MiscComponent implements OnDestroy {
  // UI state
  loading = false;
  percent = 30;

  // toggles (persisted)
  live = this.readBool(LIVE_KEY, true);
  notify = this.readBool(NOTIFY_KEY, true);

  // live data
  sev$ = this.store.bySeverity10m$;                          // SevCounts
  recent$ = this.store.recent$;                              // AlarmEvent[]
  clock$ = interval(1000).pipe(startWith(0));                // progress/alerts refresh

  // aktif bakım penceresi
  activeMaint$ = this.clock$.pipe(
    map(() => this.getActiveMaintWindow())
  );

  // alerts
  alerts$ = combineLatest([this.sev$, this.activeMaint$]).pipe(
    map(([sev, maint]) => {
      const out: Array<{ status:'info'|'warning'|'danger', text:string }> = [];
      if (maint) {
        out.push({
          status: 'info',
          text: `Maintenance window active (ticket ${maint.ticketId}) — ends ${new Date(maint.endAt).toLocaleTimeString()}`,
        });
      }
      if (sev.CRITICAL > 0) out.push({ status:'danger', text:`${sev.CRITICAL} critical alarm(s) in last 10m.` });
      if (sev.WARN > 0)     out.push({ status:'warning', text:`${sev.WARN} warning(s) in last 10m.` });
      if (!out.length)      out.push({ status:'info', text:'All clear in the last 10 minutes.' });
      return out;
    })
  );

  // badges (canlı sayılar)
  badges$ = this.sev$.pipe(
    map((s: SevCounts) => ([
      { name:'Critical', cls:'critical', val:s.CRITICAL, tip:'Requires immediate action' },
      { name:'Warning',  cls:'warning',  val:s.WARN,     tip:'Needs attention' },
      { name:'Info',     cls:'info',     val:s.INFO,     tip:'Informational' },
      { name:'OK',       cls:'ok',       val: Math.max(0, 0), tip:'All good' },
    ]))
  );

  // progress:
  maintProgress$ = combineLatest([this.activeMaint$, this.clock$]).pipe(
    map(([m]) => {
      if (!m) return null as number | null;
      const now = Date.now();
      const total = new Date(m.endAt).getTime() - new Date(m.startAt).getTime();
      const done = Math.min(Math.max(now - new Date(m.startAt).getTime(), 0), total);
      return total > 0 ? Math.round((done / total) * 100) : 100;
    })
  );

  private lastNotifyMs = Date.now();
  private sub?: Subscription;

  constructor(private store: AlarmStoreService, private toastr: NbToastrService) {
    this.attachNotifications();
  }

  // --- UI actions ---
  simulate() {
    if (this.loading) return;
    this.loading = true;
    const t = setInterval(() => {
      this.percent += 10;
      if (this.percent >= 100) {
        this.percent = 100;
        this.loading = false;
        clearInterval(t);
      }
    }, 500);
  }

  toggleLive(v: boolean) {
    this.live = v; this.writeBool(LIVE_KEY, v);
    this.attachNotifications();
  }

  toggleNotify(v: boolean) {
    this.notify = v; this.writeBool(NOTIFY_KEY, v);
    this.attachNotifications();
  }

  // --- Helpers ---
  private attachNotifications() {
    this.sub?.unsubscribe();
    if (!this.live || !this.notify) return;

    this.sub = combineLatest([this.recent$, this.clock$]).subscribe(([list]) => {
      const snoozeUntil = Number(localStorage.getItem(SNOOZE_KEY) || '0');
      if (Date.now() < snoozeUntil) return;

      const sched = this.read<any[]>(SCHED_MUTES_KEY, []);
      const mutes: string[] = this.read<string[]>(MUTES_KEY, []);

      const newest = list
        .filter(e => (e.level ?? '').toUpperCase() === 'CRITICAL')
        .filter(e => {
          const t = new Date(e.arrivedAt ?? e.createdAt ?? e.timestamp).getTime();
          return t > this.lastNotifyMs;
        })
        .filter(e => !this.isMutedByPattern(e, mutes))
        .filter(e => !this.isMutedByTicket(e, sched));

      if (newest.length) {
        const first = newest[0];
        this.lastNotifyMs = Date.now();
        this.toastr.danger(
          first.message || 'New critical alarm',
          'Critical',
          { position: NbGlobalPhysicalPosition.TOP_RIGHT, duration: 3500 }
        );
      }
    });
  }

  private isMutedByPattern(e: AlarmEvent, mutes: string[]): boolean {
    if (!mutes?.length) return false;
    const blob = [
      e.system ?? '', e.device ?? '', e.point ?? '', e.location ?? '', e.message ?? ''
    ].join(' ').toLowerCase();
    return mutes.some(q => blob.includes(q.toLowerCase()));
  }

  private isMutedByTicket(e: AlarmEvent, sched: any[]): boolean {
    if (!sched?.length) return false;
    const now = Date.now();
    const blob = [
      e.system ?? '', e.device ?? '', e.point ?? '', e.location ?? '', e.message ?? ''
    ].join(' ').toLowerCase();

    return sched.some(x => {
      const s = new Date(x.startAt).getTime();
      const ed = new Date(x.endAt).getTime();
      const hitWin = now >= s && now <= ed;
      const hitDev = String(x.devicePattern || '').toLowerCase();
      return hitWin && (!!hitDev ? blob.includes(hitDev) : true);
    });
  }

  private getActiveMaintWindow(): { ticketId: string; startAt: string; endAt: string } | null {
    try {
      const sched = this.read<any[]>(SCHED_MUTES_KEY, []);
      const now = Date.now();
      const hit = sched.find(x => now >= new Date(x.startAt).getTime() && now <= new Date(x.endAt).getTime());
      return hit ? { ticketId: hit.ticketId, startAt: hit.startAt, endAt: hit.endAt } : null;
    } catch { return null; }
  }

  private read<T>(k: string, fb: T): T {
    try { const raw = localStorage.getItem(k); return raw ? JSON.parse(raw) as T : fb; } catch { return fb; }
  }
  private readBool(k: string, fb: boolean) { try { const raw = localStorage.getItem(k); return raw ? raw === 'true' : fb; } catch { return fb; } }
  private writeBool(k: string, v: boolean) { try { localStorage.setItem(k, String(v)); } catch {} }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }
}