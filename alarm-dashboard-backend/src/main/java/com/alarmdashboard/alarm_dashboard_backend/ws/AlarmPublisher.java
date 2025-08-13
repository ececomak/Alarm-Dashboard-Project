package com.alarmdashboard.alarm_dashboard_backend.ws;

import com.alarmdashboard.alarm_dashboard_backend.model.AlarmEvent;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class AlarmPublisher {
    private final SimpMessagingTemplate template;

    public AlarmPublisher(SimpMessagingTemplate template) {
        this.template = template;
    }

    public void publish(AlarmEvent event) {
        template.convertAndSend("/topic/alarms", event);
    }
}
