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

    /** SADE FİLTRE:
     *  Target değeri case-insensitive olarak .../Alarm ile bitiyorsa true.
     *  (başka hiçbir şeye bakmıyoruz)
     */
    public boolean isAlarmLike(String json) {
        try {
            JsonNode root = om.readTree(json);
            String target = text(root, "Target", "");
            return target != null && target.toUpperCase().endsWith("/ALARM");
        } catch (Exception e) {
            return false;
        }
    }

    /** JSON -> AlarmEvent (dayanıklı eşlem) */
    public AlarmEvent toEvent(String json) {
        try {
            JsonNode root = om.readTree(json);
            JsonNode v = root.path("Value");

            String target = text(root, "Target", "UNKNOWN/Alarm");

            // Zaman: Value.Start > Timestamp > now
            Instant ts = parseInstant(text(v, "Start", null));
            if (ts == null) ts = parseInstant(text(root, "Timestamp", null));
            if (ts == null) ts = Instant.now();

            // Konum: TargetName > Location > Target'tan cihaz segmenti > Unknown
            String location = firstNonBlank(
                    text(v, "TargetName", null),
                    text(v, "Location", null),
                    deviceFromTarget(target),
                    "Unknown"
            );

            // Tip: Target'ta 'Alarm'dan önceki parça > Status > TagInfo > ValueType > GENERIC
            String type = firstNonBlank(
                    typeFromTarget(target),
                    text(v, "Status", null),
                    text(root, "TagInfo", null),
                    text(root, "ValueType", null),
                    "GENERIC"
            );

            // Mesaj: Value.Message > Target kısa özet
            String message = firstNonBlank(
                    text(v, "Message", null),
                    shortFromTarget(target)
            );

            // Seviye: Priority yoksa INFO; varsa eşiklere göre
            int pr = v.has("Priority") && v.path("Priority").isNumber() ? v.path("Priority").asInt() : 0;
            String level = toLevel(pr);

            // ID: Target@ts
            String id = (target == null || target.isBlank() ? "alarm" : target) + "@" + ts;

            return new AlarmEvent(id, level, type, location, message, ts);
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

    // -------- yardımcılar --------
    private static String toLevel(int p) {
        if (p >= 8) return "CRITICAL";
        if (p >= 4) return "WARN";
        return "INFO";
    }

    private static Instant parseInstant(String iso) {
        if (iso == null || iso.isBlank()) return null;
        try { return Instant.parse(iso); } catch (Exception ignored) { return null; }
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

    private static String[] splitTarget(String t) {
        return (t == null ? "" : t).replace('\\','/').split("/");
    }

    private static String typeFromTarget(String t) {
        String[] p = splitTarget(t);
        if (p.length >= 2) return p[p.length - 2];
        if (p.length >= 1) return p[p.length - 1];
        return null;
    }

    private static String deviceFromTarget(String t) {
        String[] p = splitTarget(t);
        if (p.length >= 3) return p[p.length - 3];
        if (p.length >= 2) return p[p.length - 2];
        return null;
    }

    private static String shortFromTarget(String t) {
        String[] p = splitTarget(t);
        int n = p.length;
        if (n >= 3) return p[n - 3] + "/" + p[n - 2] + "/" + p[n - 1];
        if (n >= 2) return p[n - 2] + "/" + p[n - 1];
        return t;
    }
}