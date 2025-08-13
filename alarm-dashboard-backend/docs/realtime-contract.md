# Realtime Contract (Alarm Dashboard)

## Event Şeması (sabit)
AlarmEvent:
- id: string (benzersiz)
- level: "CRITICAL" | "WARN" | "INFO"
- type: string (örn: FAN_FAILURE, POWER_OUTAGE)
- location: string (örn: Tunnel-3)
- message: string (kısa açıklama)
- timestamp: ISO-8601 UTC (örn: 2025-08-13T09:15:10Z)

Örnek:
{
"id":"mqtt-42",
"level":"CRITICAL",
"type":"FAN_FAILURE",
"location":"Tunnel-3",
"message":"Fan #2 stopped",
"timestamp":"2025-08-13T09:15:10Z"
}

## API Sözleşmesi
- REST Snapshot:
    - GET /api/alarms/summary?window=10m
      Döner:
      {
      "window":"10m",
      "totalActive": 7,
      "bySeverity": { "CRITICAL":2, "WARN":3, "INFO":2 },
      "byLocation": { "Tunnel-1":3, "Tunnel-3":4 }
      }

    - GET /api/alarms/recent?since=2025-08-13T09:05:00Z
      Döner: AlarmEvent[]

- WebSocket (delta):
    - Endpoint: /ws
    - Topic: /topic/alarms
    - Mesaj: AlarmEvent

## Kaynak Stratejisi
- source = "mock" → sahte üretici backend içinde timer/endpoint ile yayınlar
- source = "mqtt" → MQTT subscriber gerçek veriyi alır
- Her iki durumda da WS yayını tek noktadan yapılır (/topic/alarms)

## Varsayılanlar
- Zaman penceresi: 10 dakika (snapshot ve UI pruning için)
- Timestamp: daima ISO-8601 UTC ("...Z")