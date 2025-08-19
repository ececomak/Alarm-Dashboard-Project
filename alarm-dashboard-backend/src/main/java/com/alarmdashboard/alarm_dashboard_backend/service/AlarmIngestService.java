package com.alarmdashboard.alarm_dashboard_backend.service;

import com.alarmdashboard.alarm_dashboard_backend.model.AlarmEntity;
import com.alarmdashboard.alarm_dashboard_backend.model.AlarmEvent;
import com.alarmdashboard.alarm_dashboard_backend.repository.AlarmRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class AlarmIngestService {
    private static final Logger log = LoggerFactory.getLogger(AlarmIngestService.class);

    private final AlarmRepository repo;
    private final SimpMessageSendingOperations messaging;

    public AlarmIngestService(AlarmRepository repo,
                              SimpMessageSendingOperations messaging) {
        this.repo = repo;
        this.messaging = messaging;
    }

    @Transactional
    public void ingest(AlarmEvent evt) {
        // 1) DB'ye yaz
        repo.save(map(evt));

        // 2) CANLI WS yayını
        messaging.convertAndSend("/topic/alarms", evt);
        log.info("WS -> /topic/alarms id={} level={} msg={}", evt.id(), evt.level(), evt.message());
    }

    private AlarmEntity map(AlarmEvent evt) {
        AlarmEntity e = new AlarmEntity();
        e.setId(evt.id());
        e.setLevel(nz(evt.level(), "INFO"));
        e.setType(nz(evt.type(), "GENERIC"));
        e.setLocation(nz(evt.location(), "Unknown"));
        e.setMessage(nz(evt.message(), ""));

        e.setTarget(extractTargetFromId(evt.id()));
        e.setPriority(priorityFromLevel(evt.level()));
        e.setStatus("ACTIVE");

        // createdAt: payload timestamp; boşsa now
        e.setCreatedAt(evt.timestamp() != null ? evt.timestamp() : Instant.now());
        return e;
    }

    private static String extractTargetFromId(String id) {
        if (id == null) return "alarm";
        int at = id.indexOf('@');
        return at > 0 ? id.substring(0, at) : id;
    }

    private static int priorityFromLevel(String level) {
        if (level == null) return 100;
        switch (level.toUpperCase()) {
            case "CRITICAL": return 800;
            case "WARN":     return 500;
            default:         return 100;
        }
    }

    private static String nz(String s, String def) {
        return (s == null || s.isBlank()) ? def : s;
    }
}
