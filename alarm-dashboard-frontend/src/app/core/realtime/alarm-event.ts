export interface AlarmEvent {
  id: string;
  level: 'CRITICAL' | 'WARN' | 'INFO';
  type: string;
  location: string;
  message: string;
  timestamp: string; // ISO-8601 UTC
}