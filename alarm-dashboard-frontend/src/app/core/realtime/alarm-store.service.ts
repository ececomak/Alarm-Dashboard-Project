import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription, timer } from 'rxjs';
import { AlarmEvent } from './alarm-event';

@Injectable({ providedIn: 'root' })
export class AlarmStoreService implements OnDestroy {
  private buffer: AlarmEvent[] = [];
  private bufferWindowMs = 35 * 24 * 60 * 60 * 1000; // 35 gün
  private persistKey = 'alarm-buffer-v1';
  private persistMax = 10000;
  private storage: Storage = localStorage;

  // periyodik yeniden hesaplama (10 dk penceresi için)
  private recalcEveryMs = 5000; // 5 sn
  private clockSub?: Subscription;

  // ID tekilleme için hafif set
  private seenIds: Set<string> = new Set();

  // --- live (10m) ---
  private recent10mSub = new BehaviorSubject<AlarmEvent[]>([]);
  recent$ = this.recent10mSub.asObservable();

  private totalActiveSub = new BehaviorSubject<number>(0);
  totalActive$ = this.totalActiveSub.asObservable();

  private bySeverity10mSub =
    new BehaviorSubject<{ CRITICAL: number; WARN: number; INFO: number }>({ CRITICAL: 0, WARN: 0, INFO: 0 });
  bySeverity10m$ = this.bySeverity10mSub.asObservable();

  private byCategory10mSub = new BehaviorSubject<Array<{ name: string; value: number }>>([]);
  byCategory10m$ = this.byCategory10mSub.asObservable();

  // --- 1 saatlik ---
  private bySeverity1hSub =
    new BehaviorSubject<{ CRITICAL: number; WARN: number; INFO: number }>({ CRITICAL: 0, WARN: 0, INFO: 0 });
  bySeverity1h$ = this.bySeverity1hSub.asObservable();

  private byCategory1hSub = new BehaviorSubject<Array<{ name: string; value: number }>>([]);
  byCategory1h$ = this.byCategory1hSub.asObservable();

  // --- 12 saatlik zaman serileri ---
  private hourly12Sub = new BehaviorSubject<{ labels: string[]; counts: number[] }>({ labels: [], counts: [] });
  hourly12$ = this.hourly12Sub.asObservable();

  /** Son 12 saat severity kırılımı (Traffic için) */
  private hourly12BySeveritySub = new BehaviorSubject<{
    labels: string[];
    critical: number[];
    warn: number[];
    info: number[];
  }>({ labels: [], critical: [], warn: [], info: [] });
  hourly12BySeverity$ = this.hourly12BySeveritySub.asObservable();

  // --- Aylık ısı haritası ---
  private calendarMonthSub = new BehaviorSubject<Array<[string, number]>>([]);
  calendarMonth$ = this.calendarMonthSub.asObservable();

  /** Last 60 min toplam (KPI) */
  private last60mSub = new BehaviorSubject<number>(0);
  last60m$ = this.last60mSub.asObservable();

  /** Weekly Alarms (son 7 gün, günlere göre toplam) */
  private weekly7Sub = new BehaviorSubject<{ labels: string[]; totals: number[] }>({ labels: [], totals: [] });
  weekly7$ = this.weekly7Sub.asObservable();

  private typeToCategory: Record<string, string> = {
    POWER_OUTAGE: 'Power',
    FAN_FAILURE: 'Device',
    FAN_RPM_LOW: 'Device',
    SENSOR_FAULT: 'Sensor',
    HEARTBEAT: 'System',
    INFO: 'System',
  };

  constructor() {
    try {
      const raw = this.storage.getItem(this.persistKey);
      if (raw) {
        const arr = JSON.parse(raw) as AlarmEvent[];
        this.buffer = this.pruneBuffer(this.sortDesc(arr));
        // seenIds'i geçmiş buffer'dan doldur
        for (const e of this.buffer) if (e.id) this.seenIds.add(e.id);
        this.recomputeDerived();
      }
    } catch {}

    // >>> YENİ: Son 10 dk penceresini zaman geçtikçe otomatik güncelle
    this.clockSub = timer(this.recalcEveryMs, this.recalcEveryMs)
      .subscribe(() => this.recomputeDerived());
  }

  ngOnDestroy(): void {
    this.clockSub?.unsubscribe();
  }

  // --------- PUBLIC API ---------

  hydrate(events: AlarmEvent[]) {
    const nowIso = new Date().toISOString();

    // arrivedAt fallback: arrivedAt -> createdAt -> timestamp -> now
    const normalized = events.map(e => {
      const arrived = e.arrivedAt ?? e.createdAt ?? e.timestamp ?? nowIso;
      return { ...e, arrivedAt: arrived } as AlarmEvent;
    });

    // ID'ye göre tekille (yeni gelenlerden daha önce görülenleri at)
    const incoming = normalized.filter(e => {
      if (!e.id) return true;
      if (this.seenIds.has(e.id)) return false;
      this.seenIds.add(e.id);
      return true;
    });

    // Yeni (unique) + mevcut buffer -> sırala, kırp, türevleri hesapla
    this.buffer = this.pruneBuffer(this.sortDesc([...incoming, ...this.buffer]));
    this.recomputeDerived();
    this.persist();
  }

  push(event: AlarmEvent) {
    // duplicate koruması
    if (event.id) {
      if (this.seenIds.has(event.id)) return;
      this.seenIds.add(event.id);
    }

    if (!event.arrivedAt) event.arrivedAt = new Date().toISOString();

    this.buffer.unshift(event);
    this.buffer = this.pruneBuffer(this.buffer);
    this.recomputeDerived();
    this.persist();
  }

  // ---------- yardımcılar ----------

  /** BÜTÜN hesaplamalarda bu zamanı kullan */
  private getArrivedMs(e: AlarmEvent): number {
    return new Date(e.arrivedAt ?? e.createdAt ?? e.timestamp).getTime();
  }

  private pruneBuffer(list: AlarmEvent[]): AlarmEvent[] {
    const now = Date.now();
    const pruned = list.filter(e => {
      const t = this.getArrivedMs(e);
      return !isNaN(t) && now - t <= this.bufferWindowMs;
    });
    return pruned.length > this.persistMax ? pruned.slice(0, this.persistMax) : pruned;
  }

  private recomputeDerived() {
    const now = Date.now();

    // --- pencereler (arrival time) ---
    const win10m = 10 * 60 * 1000;
    const win1h  = 60 * 60 * 1000;

    const recent10m = this.buffer.filter(e => now - this.getArrivedMs(e) <= win10m);
    const last1h    = this.buffer.filter(e => now - this.getArrivedMs(e) <= win1h);

    // live 10m
    this.recent10mSub.next(recent10m);
    this.totalActiveSub.next(recent10m.length);

    // severity 10m / 1h
    this.bySeverity10mSub.next(this.countSeverity(recent10m));
    this.bySeverity1hSub.next(this.countSeverity(last1h));

    // category 10m / 1h
    this.byCategory10mSub.next(this.countCategory(recent10m));
    this.byCategory1hSub.next(this.countCategory(last1h));

    // hourly 12h (arrival) + bySeverity
    const { labels, counts } = this.buildHourly12(this.buffer, now);
    this.hourly12Sub.next({ labels, counts });
    this.hourly12BySeveritySub.next(this.buildHourly12BySeverity(this.buffer, now));

    // calendar (ayın günleri) — arrival
    this.calendarMonthSub.next(this.buildCalendarMonth(this.buffer));

    // KPI & Weekly Alarms — arrival
    this.last60mSub.next(last1h.length);
    this.weekly7Sub.next(this.buildLast7Days(this.buffer, now));
  }

  private countSeverity(list: AlarmEvent[]) {
    const s = { CRITICAL: 0, WARN: 0, INFO: 0 } as { CRITICAL: number; WARN: number; INFO: number };
    for (const e of list) {
      if (e.level === 'CRITICAL') s.CRITICAL++;
      else if (e.level === 'WARN') s.WARN++;
      else s.INFO++;
    }
    return s;
  }

  private countCategory(list: AlarmEvent[]) {
    const m = new Map<string, number>();
    for (const e of list) {
      const cat = this.typeToCategory[e.type] ?? 'Other';
      m.set(cat, (m.get(cat) ?? 0) + 1);
    }
    return Array.from(m.entries()).map(([name, value]) => ({ name, value }));
  }

  private persist() {
    try {
      const toSave = this.buffer.slice(0, this.persistMax);
      this.storage.setItem(this.persistKey, JSON.stringify(toSave));
    } catch {}
  }

  // --- zaman serileri ARRIVAL ile ---

  private buildHourly12(list: AlarmEvent[], nowMs: number) {
    const hours = 12;
    const labels: string[] = [];
    const boundaries: number[] = [];
    for (let i = hours - 1; i >= 0; i--) {
      const d = new Date(nowMs - i * 60 * 60 * 1000);
      d.setMinutes(0, 0, 0);
      labels.push(`${d.getHours().toString().padStart(2, '0')}:00`);
      boundaries.push(d.getTime());
    }
    boundaries.push(boundaries[boundaries.length - 1] + 60 * 60 * 1000);

    const counts = new Array(hours).fill(0);
    for (const e of list) {
      const t = this.getArrivedMs(e);
      if (isNaN(t)) continue;
      for (let i = 0; i < hours; i++) {
        if (t >= boundaries[i] && t < boundaries[i + 1]) { counts[i]++; break; }
      }
    }
    return { labels, counts };
  }

  private buildHourly12BySeverity(list: AlarmEvent[], nowMs: number) {
    const hours = 12;
    const labels: string[] = [];
    const boundaries: number[] = [];

    for (let i = hours - 1; i >= 0; i--) {
      const d = new Date(nowMs - i * 60 * 60 * 1000);
      d.setMinutes(0, 0, 0);
      labels.push(`${d.getHours().toString().padStart(2, '0')}:00`);
      boundaries.push(d.getTime());
    }
    boundaries.push(boundaries[boundaries.length - 1] + 60 * 60 * 1000);

    const critical = new Array(hours).fill(0);
    const warn     = new Array(hours).fill(0);
    const info     = new Array(hours).fill(0);

    for (const e of list) {
      const t = this.getArrivedMs(e);
      if (isNaN(t)) continue;
      for (let i = 0; i < hours; i++) {
        if (t >= boundaries[i] && t < boundaries[i + 1]) {
          if (e.level === 'CRITICAL')      critical[i]++;
          else if (e.level === 'WARN')     warn[i]++;
          else                              info[i]++;
          break;
        }
      }
    }
    return { labels, critical, warn, info };
  }

  private buildCalendarMonth(list: AlarmEvent[]) {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const days = new Date(y, m + 1, 0).getDate();
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const map = new Map<string, number>();
    for (const e of list) {
      const d = new Date(this.getArrivedMs(e));
      if (d.getFullYear() === y && d.getMonth() === m) {
        const key = `${y}-${pad(m + 1)}-${pad(d.getDate())}`;
        map.set(key, (map.get(key) ?? 0) + 1);
      }
    }
    return Array.from({ length: days }, (_, i) => {
      const key = `${y}-${pad(m + 1)}-${pad(i + 1)}`;
      return [key, map.get(key) ?? 0] as [string, number];
    });
  }

  private buildLast7Days(list: AlarmEvent[], nowMs: number) {
    const dayMs = 24 * 60 * 60 * 1000;
    const names = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

    const labels: string[] = [];
    const boundaries: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(nowMs - i * dayMs);
      d.setHours(0,0,0,0);
      labels.push(names[d.getDay()]);
      boundaries.push(d.getTime());
    }
    boundaries.push(boundaries[boundaries.length - 1] + dayMs);

    const totals = new Array(7).fill(0);
    for (const e of list) {
      const t = this.getArrivedMs(e);
      if (isNaN(t)) continue;
      for (let i = 0; i < 7; i++) {
        if (t >= boundaries[i] && t < boundaries[i + 1]) { totals[i]++; break; }
      }
    }
    return { labels, totals };
  }

  private sortDesc(list: AlarmEvent[]) {
    return [...list].sort((a, b) => this.getArrivedMs(b) - this.getArrivedMs(a));
  }
}