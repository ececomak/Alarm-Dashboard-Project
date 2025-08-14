import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AlarmEvent } from './alarm-event';

@Injectable({ providedIn: 'root' })
export class AlarmSnapshotService {
  private readonly API = 'http://localhost:8080/api/alarms';
  private loadedRecent = false;
  private loadedMonth = false;

  constructor(private http: HttpClient) {}

  /** Açılışta: son X dakikayı bir kez yükle (Live için) */
  async loadRecentAndHydrate(hydrate: (evts: AlarmEvent[]) => void, minutes = 10) {
    if (this.loadedRecent) return;
    const since = new Date(Date.now() - minutes * 60 * 1000).toISOString();
    try {
      const count = await this.loadSinceAndHydrate(since, hydrate);
      this.loadedRecent = true;
      console.log('[SNAPSHOT] recent loaded:', count);
    } catch (e) {
      console.warn('[SNAPSHOT] recent error', e);
    }
  }

  /** Aylık görünümler için: bu ayın başından beri bir kez yükle */
  async loadMonthSinceFirstDay(hydrate: (evts: AlarmEvent[]) => void) {
    if (this.loadedMonth) return;
    const now = new Date();
    const since = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)).toISOString();
    try {
      const count = await this.loadSinceAndHydrate(since, hydrate);
      this.loadedMonth = true;
      console.log('[SNAPSHOT] month loaded:', count);
    } catch (e) {
      console.warn('[SNAPSHOT] month error', e);
    }
  }

  // ---- ortak yardımcı ----
  private async loadSinceAndHydrate(sinceISO: string, hydrate: (evts: AlarmEvent[]) => void): Promise<number> {
    const params = new HttpParams().set('since', sinceISO);

    const token = localStorage.getItem('token') ?? '';
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;

    const events = await firstValueFrom(
      this.http.get<AlarmEvent[]>(`${this.API}/recent`, { params, headers })
    );
    hydrate(events);
    return events.length;
  }
}