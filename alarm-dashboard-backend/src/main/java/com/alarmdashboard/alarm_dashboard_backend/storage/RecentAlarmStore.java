package com.alarmdashboard.alarm_dashboard_backend.storage;

import com.alarmdashboard.alarm_dashboard_backend.model.AlarmEvent;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentLinkedDeque;

@Component
public class RecentAlarmStore {
    private final Deque<AlarmEvent> buf = new ConcurrentLinkedDeque<>();
    private final int maxSize = 10000; // güvenli üst sınır
    private final long retentionMs = Duration.ofDays(35).toMillis();

    public void append(AlarmEvent e) {
        buf.addFirst(e);
        prune();
    }

    public List<AlarmEvent> since(Instant since) {
        List<AlarmEvent> out = new ArrayList<>();
        for (AlarmEvent e : buf) {
            if (e.timestamp() != null && !e.timestamp().isBefore(since)) out.add(e);
            else break; // en yeni başta; gerisi daha eskidir
        }
        return out;
    }

    public Summary summary(Duration window) {
        Instant since = Instant.now().minus(window);
        Map<String,Integer> bySeverity = new LinkedHashMap<>();
        Map<String,Integer> byLocation = new LinkedHashMap<>();
        int total = 0;
        for (AlarmEvent e : buf) {
            if (e.timestamp() == null || e.timestamp().isBefore(since)) break;
            total++;
            bySeverity.merge(e.level(), 1, Integer::sum);
            byLocation.merge(e.location(), 1, Integer::sum);
        }
        return new Summary(window.toString(), total, bySeverity, byLocation);
    }

    private void prune() {
        // boyuta göre
        while (buf.size() > maxSize) buf.removeLast();
        // zamana göre
        Instant cutoff = Instant.now().minusMillis(retentionMs);
        while (!buf.isEmpty()) {
            AlarmEvent last = buf.peekLast();
            if (last == null || last.timestamp() == null || last.timestamp().isBefore(cutoff)) buf.removeLast();
            else break;
        }
    }

    // küçük DTO
    public record Summary(
            String window,
            int totalActive,
            Map<String,Integer> bySeverity,
            Map<String,Integer> byLocation
    ) {}
}