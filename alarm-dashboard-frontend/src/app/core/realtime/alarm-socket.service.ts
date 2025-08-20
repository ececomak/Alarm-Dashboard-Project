import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';
import { AlarmStoreService } from './alarm-store.service';
import { AlarmEvent } from './alarm-event';

@Injectable({ providedIn: 'root' })
export class AlarmSocketService {
  private client?: Client;
  private bootstrapped = false;

  constructor(private store: AlarmStoreService) {}

  /** Uygulama başına 1 kez bağlan; tekrar çağrılırsa no-op */
  connect(token?: string) {
    if (this.bootstrapped && this.client?.active) return;

    this.client = new Client({
      webSocketFactory: () => new (SockJS as any)('http://localhost:8080/ws'),
      reconnectDelay: 5000,
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: (msg) => console.log('[STOMP]', msg),
    });

    this.client.onConnect = () => {
      this.bootstrapped = true;

      // Bootstrap kapalı: ilk liste HTTP snapshot ile gelecek.
      // this.client!.subscribe('/user/queue/alarms-bootstrap', ...);

      // CANLI
      this.client!.subscribe('/topic/alarms', (msg: IMessage) => {
        try {
          const raw = JSON.parse(msg.body);
          const ev = this.normalize(raw);

          const nowIso = new Date().toISOString();
          // arrivedAt fallback zinciri: arrivedAt -> createdAt -> timestamp -> now
          ev.arrivedAt = ev.arrivedAt ?? ev.createdAt ?? ev.timestamp ?? nowIso;

          // ID'ye dokunmuyoruz
          this.store.push(ev);
        } catch (e) {
          console.error('[WS] live parse error', e);
        }
      });
    };

    this.client.onStompError = f => {
      console.error('[WS ERROR]', f.headers['message'], f.body);
    };
    this.client.onWebSocketClose = (evt) => console.warn('[WS CLOSED]', evt);

    this.client.activate();
  }

  disconnect() {
    this.client?.deactivate();
    this.bootstrapped = false;
  }

  /** Backend’ten geleni tek tipe indirgeme */
  private normalize(e: any): AlarmEvent {
    const level = String(e.level || '').toUpperCase().replace('WARNING', 'WARN');
    const ts = new Date(e.timestamp ?? e.time ?? e.ts);
    const timestamp = isNaN(ts.getTime()) ? new Date().toISOString() : ts.toISOString();

    return {
      id: e.id ?? `${e.target ?? 'alarm'}@${timestamp}`,
      timestamp,
      location: e.location ?? e.targetName ?? 'Unknown',
      level: (level === 'CRITICAL' || level === 'WARN' || level === 'INFO') ? level : 'INFO',
      type: e.type ?? 'INFO',
      message: e.message ?? e.text ?? '',
      createdAt: e.createdAt
    } as AlarmEvent;
  }
}