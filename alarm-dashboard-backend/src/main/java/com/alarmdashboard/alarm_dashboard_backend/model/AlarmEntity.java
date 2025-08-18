package com.alarmdashboard.alarm_dashboard_backend.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "alarms",
        indexes = {
                @Index(name = "idx_alarms_created_at", columnList = "createdAt"),
                @Index(name = "idx_alarms_target", columnList = "target")
        })
public class AlarmEntity {
    @Id
    private String id;        // Target@timestamp (mapper böyle üretiyor)
    private String level;
    private String type;
    private String location;
    @Column(length = 2000)
    private String message;

    private String target;
    private Integer priority;
    private String status;

    private Instant createdAt;  // AlarmEvent.timestamp
    private Instant endedAt;

    // getters & setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getTarget() { return target; }
    public void setTarget(String target) { this.target = target; }
    public Integer getPriority() { return priority; }
    public void setPriority(Integer priority) { this.priority = priority; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getEndedAt() { return endedAt; }
    public void setEndedAt(Instant endedAt) { this.endedAt = endedAt; }
}