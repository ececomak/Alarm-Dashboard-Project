import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';
import { AlarmStoreService } from './alarm-store.service';
import { AlarmEvent } from './alarm-event';

@Injectable({ providedIn: 'root' })
export class AlarmSocketService {
  private client?: Client;

  constructor(private store: AlarmStoreService) {}

  connect(token?: string) {
    if (this.client?.active) return;

    this.client = new Client({
      webSocketFactory: () => new (SockJS as any)('http://localhost:8080/ws'),
      reconnectDelay: 5000,
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {}
    });

    this.client.onConnect = () => {
      this.client!.subscribe('/topic/alarms', (msg: IMessage) => {
        try {
          const ev = JSON.parse(msg.body) as AlarmEvent;
          this.store.push(ev);
        } catch (e) {
          console.error('Alarm parse error', e);
        }
      });
    };

    this.client.onStompError = f => console.error('Broker error', f);
    this.client.onWebSocketClose = () => console.warn('WS closed');

    this.client.activate();
  }

  disconnect() {
    this.client?.deactivate();
  }
}