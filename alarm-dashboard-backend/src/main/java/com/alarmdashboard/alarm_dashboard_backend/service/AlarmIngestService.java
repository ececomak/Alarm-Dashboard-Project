package com.alarmdashboard.alarm_dashboard_backend.service;

import com.alarmdashboard.alarm_dashboard_backend.model.AlarmEntity;
import com.alarmdashboard.alarm_dashboard_backend.model.AlarmEvent;
import com.alarmdashboard.alarm_dashboard_backend.repository.AlarmRepository;
import com.alarmdashboard.alarm_dashboard_backend.ws.AlarmPublisher;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.function.Consumer;

@Service
public class AlarmIngestService {
    private final AlarmRepository repo;
    private final AlarmPublisher publisher;
    @Nullable private final Consumer<AlarmEvent> recentStoreWriter; // varsa mevcut memory-store'a da yazalım

    public AlarmIngestService(AlarmRepository repo,
                              AlarmPublisher publisher) {
        this.repo = repo;
        this.publisher = publisher;
        this.recentStoreWriter = null; // istersen buraya mevcut store bean'ini enjekte edebiliriz
    }

    @Transactional
    public void ingest(AlarmEvent evt) {
        repo.save(map(evt));   // 1) kalıcı kayıt
        publisher.publish(evt); // 2) canlı yayın
        if (recentStoreWriter != null) recentStoreWriter.accept(evt); // (opsiyonel) eski store
    }

    private AlarmEntity map(AlarmEvent evt) {
        AlarmEntity e = new AlarmEntity();
        e.setId(evt.id());
        e.setLevel(evt.level());
        e.setType(evt.type());
        e.setLocation(evt.location());
        e.setMessage(evt.message());
        e.setTarget(evt.id().split("@")[0]);
        e.setPriority( priorityFromLevel(evt.level()) );
        e.setStatus("ACTIVE");
        e.setCreatedAt(evt.timestamp());
        return e;
    }

    private Integer priorityFromLevel(String level) {
        if ("CRITICAL".equalsIgnoreCase(level)) return 800;
        if ("WARN".equalsIgnoreCase(level)) return 500;
        return 100;
    }
}