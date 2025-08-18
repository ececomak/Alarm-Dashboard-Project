export interface AlarmEvent {
  id: string;
  level: 'CRITICAL' | 'WARN' | 'INFO';
  type: string;
  location: string;
  message: string;

  /** Olayın payload’daki orijinal zamanı (bilgi amaçlı) */
  timestamp: string; // ISO-8601

  /** MESAJIN EKRANA ULAŞTIĞI AN — bütün grafik ve pencereler bunu kullanacak */
  arrivedAt?: string; // ISO-8601

  /** (opsiyonel) backend/DB tarafından set ediliyorsa gelebilir */
  createdAt?: string; // ISO-8601
}