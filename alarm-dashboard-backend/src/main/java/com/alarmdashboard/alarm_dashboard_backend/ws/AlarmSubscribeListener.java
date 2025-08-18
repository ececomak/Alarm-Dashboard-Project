package com.alarmdashboard.alarm_dashboard_backend.ws;

import com.alarmdashboard.alarm_dashboard_backend.model.AlarmEntity;
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
        Instant since = Instant.now().minus(Duration.ofMinutes(10));
        List<AlarmEntity> recent = repo.findSince(since);

        SimpMessageHeaderAccessor headers = SimpMessageHeaderAccessor.create(SimpMessageType.MESSAGE);
        headers.setSessionId(sessionId);
        headers.setLeaveMutable(true);
        MessageHeaders h = headers.getMessageHeaders();

        // yalnızca o oturuma tek seferlik "ilk paket"
        messaging.convertAndSendToUser(sessionId, "/queue/alarms-bootstrap", recent, h);
    }
}