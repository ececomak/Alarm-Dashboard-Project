package com.alarmdashboard.alarm_dashboard_backend.model;

import java.time.Instant;

public record AlarmEvent(
        String id,
        String level,     // CRITICAL | WARN | INFO
        String type,      // e.g. FAN_FAILURE
        String location,  // e.g. Tunnel-3
        String message,
        Instant timestamp
) {}