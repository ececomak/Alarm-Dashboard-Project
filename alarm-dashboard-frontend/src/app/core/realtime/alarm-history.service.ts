import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AlarmRowDTO {
  id: string;
  system: string;
  device: string;
  point: string;
  location: string;
  level: 'CRITICAL' | 'WARN' | 'INFO' | string;
  message: string;
  createdAt: string; // ISO
}

@Injectable({ providedIn: 'root' })
export class AlarmHistoryService {
  private base = environment.apiBase;

  constructor(private http: HttpClient) {}

  recent(limit = 200): Observable<AlarmRowDTO[]> {
    return this.http.get<AlarmRowDTO[]>(
      `${this.base}/api/alarms/recent?limit=${limit}`
    );
  }
}