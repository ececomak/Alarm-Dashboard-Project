package com.alarmdashboard.alarm_dashboard_backend.dto;

public record AlarmRow(
        String id,
        String system,
        String device,
        String point,
        String location,
        String level,
        String message,
        String createdAt
) {}