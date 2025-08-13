package com.alarmdashboard.alarm_dashboard_backend.api;

import com.alarmdashboard.alarm_dashboard_backend.model.AlarmEvent;
import com.alarmdashboard.alarm_dashboard_backend.ws.AlarmPublisher;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dev")
public class DevAlarmController {

    private final AlarmPublisher publisher;

    public DevAlarmController(AlarmPublisher publisher) {
        this.publisher = publisher;
    }

    @PostMapping("/emit")
    public ResponseEntity<Void> emit(@RequestBody AlarmEvent event) {
        publisher.publish(event);
        return ResponseEntity.accepted().build();
    }

}
