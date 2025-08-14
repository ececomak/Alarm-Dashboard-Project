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
      debug: () => {} 
    });

    this.client.onConnect = () => {
      this.bootstrapped = true;
      this.client!.subscribe('/topic/alarms', (msg: IMessage) => {
        try {
          const raw = JSON.parse(msg.body);
          const ev = this.normalize(raw) as AlarmEvent;
          this.store.push(ev);
        } catch (e) {
          console.error('[WS] parse error', e);
        }
      });
    };

    this.client.onStompError = f => console.error('[WS] broker error', f);
    this.client.onWebSocketClose = () => console.warn('[WS] closed');

    this.client.activate();
  }

  disconnect() {
    this.client?.deactivate();
    this.bootstrapped = false;
  }

  private normalize(e: any): AlarmEvent {
    const level = String(e.level || '').toUpperCase().replace('WARNING', 'WARN');
    const ts = new Date(e.timestamp);
    const timestamp = isNaN(ts.getTime()) ? new Date().toISOString() : ts.toISOString();

    return {
      id: e.id ?? `${Date.now()}`,
      timestamp,
      location: e.location ?? 'Unknown',
      level: (level === 'CRITICAL' || level === 'WARN' || level === 'INFO') ? level : 'INFO',
      type: e.type ?? 'INFO',
      message: e.message ?? ''
    };
  }
}