package com.alarmdashboard.alarm_dashboard_backend.api;

import com.alarmdashboard.alarm_dashboard_backend.dto.AlarmRow;
import com.alarmdashboard.alarm_dashboard_backend.model.AlarmEntity;
import com.alarmdashboard.alarm_dashboard_backend.repository.AlarmRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AlarmQueryController {

    private final AlarmRepository repo;

    /** Son N alarm (created_at DESC). Varsayılan 200, üst sınır 2000. */
    @GetMapping(value = "/alarms/recent", params = "limit")
    public List<AlarmRow> recent(@RequestParam(name = "limit", defaultValue = "200") int limit) {
        int capped = Math.min(Math.max(limit, 1), 2000);
        return repo.findAllByOrderByCreatedAtDesc(PageRequest.of(0, capped))
                .getContent()
                .stream()
                .map(this::toRow)
                .toList();
    }

    private AlarmRow toRow(AlarmEntity a) {
        String target = nz(a.getTarget()).replace('\\','/');
        String[] parts = Arrays.stream(target.split("/")).filter(s -> !s.isBlank()).toArray(String[]::new);
        String system = parts.length >= 2 ? parts[1] : "";
        String device = parts.length >= 3 ? parts[2] : "";
        String point  = parts.length >= 4 ? parts[3] : (parts.length >= 3 ? parts[2] : "");

        return new AlarmRow(
                a.getId(),
                system,
                device,
                point,
                nz(a.getLocation()),
                nz(a.getLevel()),
                nz(a.getMessage()),
                a.getCreatedAt() != null ? a.getCreatedAt().toString() : ""
        );
    }

    private static String nz(String s) { return s == null ? "" : s; }
}