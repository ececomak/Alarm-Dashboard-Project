package com.alarmdashboard.alarm_dashboard_backend.ws;

import com.alarmdashboard.alarm_dashboard_backend.model.AlarmEntity;
import com.alarmdashboard.alarm_dashboard_backend.model.AlarmEvent;
import com.alarmdashboard.alarm_dashboard_backend.repository.AlarmRepository;
import org.springframework.context.ApplicationListener;
import org.springframework.messaging.MessageHeaders;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.messaging.simp.SimpMessageType;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Component
public class AlarmSubscribeListener implements ApplicationListener<SessionSubscribeEvent> {

    private final SimpMessageSendingOperations messaging;
    private final AlarmRepository repo;

    public AlarmSubscribeListener(SimpMessageSendingOperations messaging, AlarmRepository repo) {
        this.messaging = messaging;
        this.repo = repo;
    }

    @Override
    public void onApplicationEvent(SessionSubscribeEvent event) {
        var acc = SimpMessageHeaderAccessor.wrap(event.getMessage());
        if (!"/topic/alarms".equals(acc.getDestination())) return;

        String sessionId = acc.getSessionId();

        // Son 10 dakika
        Instant since = Instant.now().minus(Duration.ofMinutes(10));
        List<AlarmEntity> recent = repo.findSince(since);

        // Entity -> Event (frontend şeması)
        List<AlarmEvent> payload = recent.stream()
                .map(this::toEvent)
                .toList();

        // Yalnızca bu WS oturumuna gönder
        messaging.convertAndSendToUser(
                sessionId,
                "/queue/alarms-bootstrap",
                payload,
                headersForSession(sessionId)
        );
    }

    private MessageHeaders headersForSession(String sessionId) {
        var h = SimpMessageHeaderAccessor.create(SimpMessageType.MESSAGE);
        h.setSessionId(sessionId);
        h.setLeaveMutable(true);
        return h.getMessageHeaders();
    }

    private AlarmEvent toEvent(AlarmEntity e) {
        String level    = nz(e.getLevel(), "INFO");
        String type     = nz(e.getType(),  "INFO");
        String location = nz(e.getLocation(), "Unknown");
        String message  = nz(e.getMessage(), "");

        Instant ts = (e.getCreatedAt() != null ? e.getCreatedAt() : Instant.now());
        String id  = nz(e.getId(), null);
        if (id == null || id.isBlank()) {
            String target = nz(e.getTarget(), "alarm");
            id = target + "@" + ts;
        }
        return new AlarmEvent(id, level, type, location, message, ts);
    }

    private static String nz(String v, String def) {
        return (v == null || v.isBlank()) ? def : v;
    }
}