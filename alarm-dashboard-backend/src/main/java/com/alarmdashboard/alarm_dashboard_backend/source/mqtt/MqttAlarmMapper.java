package com.alarmdashboard.alarm_dashboard_backend.source.mqtt;

import com.alarmdashboard.alarm_dashboard_backend.model.AlarmEvent;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.Instant;

public class MqttAlarmMapper {
    private final ObjectMapper om;

    public MqttAlarmMapper(ObjectMapper om) {
        this.om = om;
    }

    /**
     * Alarm mı?
     * - Öncelik: payload.Target ya da MQTT topic (case-insensitive) ".../Alarm" ile bitiyorsa TRUE
     * - Yedek: Value.Message dolu VEYA Value.Priority sayısal ise TRUE
     */

    public boolean isAlarmLike(String json, String mqttTopic) {
        try {
            JsonNode root = om.readTree(json);
            String target = text(root, "Target", null);
            String candidate = firstNonBlank(target, mqttTopic);
            if (candidate != null && normalize(candidate).endsWith("/ALARM")) return true;

            JsonNode v = root.path("Value");
            boolean hasMsg = v.hasNonNull("Message") && !v.path("Message").asText("").isBlank();
            boolean hasPr  = v.has("Priority") && v.path("Priority").isNumber();
            return hasMsg || hasPr;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * JSON -> AlarmEvent
     * createdAt (AlarmEvent.timestamp) = NOW (ARRIVAL) — UI tüm analizlerde arrivedAt/createdAt’i kullanıyor.
     */

    public AlarmEvent toEvent(String json, String mqttTopic) {
        try {
            JsonNode root = om.readTree(json);
            JsonNode v = root.path("Value");

            // Target: payload.Target > topic > "UNKNOWN/Alarm"
            String target = firstNonBlank(text(root, "Target", null), mqttTopic, "UNKNOWN/Alarm");
            target = normalize(target);

            // Location: TargetName > Location > target’tan cihaz segmenti > "Unknown"
            String location = firstNonBlank(
                    text(v, "TargetName", null),
                    text(v, "Location", null),
                    deviceFromPath(target),
                    "Unknown"
            );

            // Tip: path’te "Alarm"dan önceki parça > Value.Message > TagInfo > ValueType > "GENERIC"
            String type = firstNonBlank(
                    typeFromPath(target),
                    text(v, "Message", null),
                    text(root, "TagInfo", null),
                    text(root, "ValueType", null),
                    "GENERIC"
            );

            String message = firstNonBlank(
                    text(v, "Message", null),
                    shortFromPath(target)
            );

            // 8+=CRITICAL, 4+=WARN, aksi INFO
            int pr = v.has("Priority") && v.path("Priority").isNumber() ? v.path("Priority").asInt() : 0;
            String level = toLevel(pr);

            // ARRIVAL time + tekilleştirme
            Instant now = Instant.now();
            String id = (target.isBlank() ? "alarm" : target) + "@" + now;

            return new AlarmEvent(id, level, type, location, message, now);
        } catch (Exception ex) {
            Instant now = Instant.now();
            return new AlarmEvent(
                    "fallback@" + now.toEpochMilli(),
                    "INFO", "RAW", "Unknown",
                    "Unparseable MQTT payload",
                    now
            );
        }
    }

    // ---------- helpers ----------
    private static String toLevel(int p) {
        if (p >= 8) return "CRITICAL";
        if (p >= 4) return "WARN";
        return "INFO";
    }

    private static String normalize(String s) {
        return (s == null ? "" : s).replace('\\','/').toUpperCase();
    }

    private static String text(JsonNode node, String field, String def) {
        if (node == null) return def;
        JsonNode n = node.path(field);
        if (n.isMissingNode() || n.isNull()) return def;
        String s = n.asText(null);
        return (s == null || s.isBlank()) ? def : s;
    }

    private static String firstNonBlank(String... xs) {
        if (xs == null) return null;
        for (String x : xs) if (x != null && !x.isBlank()) return x;
        return null;
    }

    private static String[] splitPath(String t) {
        return (t == null ? "" : t).replace('\\','/').split("/");
    }

    private static String typeFromPath(String t) {
        String[] p = splitPath(t);
        if (p.length >= 2) return p[p.length - 2];
        if (p.length >= 1) return p[p.length - 1];
        return null;
    }

    private static String deviceFromPath(String t) {
        String[] p = splitPath(t);
        if (p.length >= 3) return p[p.length - 3];
        if (p.length >= 2) return p[p.length - 2];
        return null;
    }

    private static String shortFromPath(String t) {
        String[] p = splitPath(t);
        int n = p.length;
        if (n >= 3) return p[n - 3] + "/" + p[n - 2] + "/" + p[n - 1];
        if (n >= 2) return p[n - 2] + "/" + p[n - 1];
        return t;
    }
}