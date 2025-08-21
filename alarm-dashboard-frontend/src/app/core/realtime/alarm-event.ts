export interface AlarmEvent {
  id: string;
  level: 'CRITICAL' | 'WARN' | 'INFO';
  type: string;
  location: string;
  message: string;

  timestamp: string;   // ISO-8601 (payload)
  arrivedAt?: string;  // ISO-8601 (UI pencereleri bunu kullanır)
  createdAt?: string;  // ISO-8601

  // UI için türetilmiş (path'ten çıkarılır)
  system?: string;     // EmergencyCall / LVMV / Lighting ...
  device?: string;     // Call / CircuitBreaker / LightLevel ...
  point?: string;      // T1RC3 / AKMADPQ1 ...
}