import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { AlarmStoreService } from '../../core/realtime/alarm-store.service';
import { AlarmEvent } from '../../core/realtime/alarm-event';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

type Severity = 'Critical' | 'Warning' | 'Info';

type FilterState = {
  device: string;
  severity: '' | Severity;
  from: string;   // 'yyyy-mm-dd' | ''
  to: string;     // 'yyyy-mm-dd' | ''
  live: boolean;
  ackOnly: boolean;
};

@Component({
  selector: 'app-forms-feature',
  standalone: false,
  templateUrl: './forms-feature.html',
  styleUrls: ['./forms-feature.css'],
})
export class FormsFeatureComponent {
  constructor(private fb: FormBuilder, private store: AlarmStoreService) {}

  severities: Severity[] = ['Critical', 'Warning', 'Info'];

  form = this.fb.group({
    device: ['', [Validators.maxLength(40)]],
    severity: ['' as '' | Severity],
    from: [''],
    to: [''],
    live: [true],
    ackOnly: [false],
  });
  get f() { return this.form.controls; }

  // filtre durumu
  private filterSub = new BehaviorSubject<FilterState>({
    device: '', severity: '', from: '', to: '', live: true, ackOnly: false,
  });
  filter$ = this.filterSub.asObservable();

  // kaynak: live=recent$ (10m) / değilse 35g buffer$
  private source$: Observable<AlarmEvent[]> = combineLatest([
    this.filter$,
    this.store.recent$,
    this.store.buffer$,
  ]).pipe(
    map(([flt, recent, buffer]) => flt.live ? recent : buffer)
  );

  // sonuçlar
  results$: Observable<AlarmEvent[]> = combineLatest([this.source$, this.filter$]).pipe(
    map(([list, flt]) => this.applyFilter(list, flt))
  );

  // sayaç + kapsama bilgisi
  count$: Observable<number> = this.results$.pipe(map(a => a.length));
  coverageNote$: Observable<string | null> = combineLatest([
    this.filter$, this.store.buffer$
  ]).pipe(
    map(([flt, buf]) => {
      if (flt.live || !flt.from || buf.length === 0) return null;
      const oldest = Math.min(...buf.map(e => this.getMs(e)));
      const fromMs = this.dayStartMs(flt.from);
      return fromMs < oldest ? `Partial results — oldest available: ${new Date(oldest).toLocaleDateString()}` : null;
    })
  );

  lastSubmitted: any = null;

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.filterSub.next({
      device: (v.device || '').trim(),
      severity: v.severity ?? '',
      from: v.from || '',
      to: v.to || '',
      live: !!v.live,
      ackOnly: !!v.ackOnly,
    });

    this.lastSubmitted = {
      device: v.device || 'Any',
      severity: v.severity || 'Any',
      from: v.live ? '—' : (v.from || '—'),
      to:   v.live ? '—' : (v.to   || '—'),
      live: !!v.live,
      ackOnly: !!v.ackOnly,
    };
  }

  // ---------- filtering helpers ----------
  private getMs(e: AlarmEvent): number {
    return new Date(e.arrivedAt ?? e.createdAt ?? e.timestamp).getTime();
  }

  private dayStartMs(s: string): number {
    const d = new Date(s);
    d.setHours(0,0,0,0);
    return d.getTime();
  }
  private dayEndMs(s: string): number {
    const d = new Date(s);
    d.setHours(23,59,59,999);
    return d.getTime();
  }

  private isAck(e: AlarmEvent): boolean {
    const status = (e as any).status?.toString().toUpperCase() ?? '';
    const type   = (e.type ?? '').toString().toUpperCase();
    const msg    = (e.message ?? '').toString();
    return status === 'ACK'
        || type.includes('ACK')
        || /\b(ack|acknowledge(?:d|s)?)\b/i.test(msg);
  }

  private matchesDevice(e: AlarmEvent, q: string): boolean {
    if (!q) return true;
    const blob = [
      e.system ?? '', e.device ?? '', e.point ?? '', e.location ?? ''
    ].join(' ').toLowerCase();
    return blob.includes(q.toLowerCase());
  }

  private applyFilter(list: AlarmEvent[], flt: FilterState): AlarmEvent[] {
    let data = list;

    // date range (only when live=false)
    if (!flt.live) {
      const fromOk = !!flt.from;
      const toOk   = !!flt.to;
      if (fromOk || toOk) {
        const lo = fromOk ? this.dayStartMs(flt.from) : -Infinity;
        const hi = toOk   ? this.dayEndMs(flt.to)     :  Infinity;
        data = data.filter(e => {
          const t = this.getMs(e);
          return t >= lo && t <= hi;
        });
      }
    }

    // device match
    if (flt.device) data = data.filter(e => this.matchesDevice(e, flt.device));

    // severity
    if (flt.severity) {
      const want = flt.severity.toUpperCase().replace('WARNING','WARN').replace('CRITICAL','CRITICAL').replace('INFO','INFO');
      data = data.filter(e => (e.level ?? '').toUpperCase() === (want === 'WARNING' ? 'WARN' : want));
    }

    // ack only
    if (flt.ackOnly) data = data.filter(e => this.isAck(e));

    // sort desc by time
    return [...data].sort((a,b) => this.getMs(b) - this.getMs(a)).slice(0, 200);
  }
}