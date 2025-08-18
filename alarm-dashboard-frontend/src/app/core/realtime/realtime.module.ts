import { NgModule, APP_INITIALIZER } from '@angular/core';
import { AlarmSocketService } from './alarm-socket.service';

export function startWs(socket: AlarmSocketService) {
  return () => socket.connect();
}

@NgModule({
  providers: [
    { provide: APP_INITIALIZER, useFactory: startWs, deps: [AlarmSocketService], multi: true }
  ]
})
export class RealtimeModule {}