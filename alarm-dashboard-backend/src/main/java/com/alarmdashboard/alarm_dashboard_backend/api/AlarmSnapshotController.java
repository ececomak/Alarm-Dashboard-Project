package com.alarmdashboard.alarm_dashboard_backend.api;

import com.alarmdashboard.alarm_dashboard_backend.model.AlarmEvent;
import com.alarmdashboard.alarm_dashboard_backend.storage.RecentAlarmStore;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/alarms")
public class AlarmSnapshotController {
    private final RecentAlarmStore store;
    public AlarmSnapshotController(RecentAlarmStore store) { this.store = store; }

    @GetMapping(value = "/recent", params = "since")
    public List<AlarmEvent> recent(@RequestParam("since")
                                   @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant since) {
        return store.since(since);
    }

    @GetMapping("/summary")
    public RecentAlarmStore.Summary summary(@RequestParam(defaultValue = "PT10M") String window) {
        // window ISO-8601 duration: PT10M=10 dakika, PT1H=1 saat
        return store.summary(Duration.parse(window));
    }
}