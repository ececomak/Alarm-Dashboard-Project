package com.alarmdashboard.alarm_dashboard_backend.ws;

import com.alarmdashboard.alarm_dashboard_backend.model.AlarmEvent;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import com.alarmdashboard.alarm_dashboard_backend.storage.RecentAlarmStore;

@Service
public class AlarmPublisher {
    private final SimpMessagingTemplate template;
    private final RecentAlarmStore recent;

    public AlarmPublisher(SimpMessagingTemplate template, RecentAlarmStore recent) {
        this.template = template;
        this.recent = recent;
    }

    public void publish(AlarmEvent event) {
        recent.append(event);
        template.convertAndSend("/topic/alarms", event);
    }
}
