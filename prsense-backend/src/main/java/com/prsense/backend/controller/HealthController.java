package com.prsense.backend.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
@RequiredArgsConstructor
@Slf4j
public class HealthController {

    private final DataSource dataSource;
    private final StringRedisTemplate redisTemplate;

    @GetMapping
    public ResponseEntity<Map<String, String>> checkHealth() {
        Map<String, String> healthReport = new HashMap<>();
        boolean isDbUp = false;
        boolean isRedisUp = false;

        // 1. Check Database
        try (Connection conn = dataSource.getConnection()) {
            if (conn.isValid(2)) {
                isDbUp = true;
                healthReport.put("database", "UP");
            } else {
                healthReport.put("database", "DOWN");
            }
        } catch (Exception e) {
            log.error("Database health check failed", e);
            healthReport.put("database", "DOWN - " + e.getMessage());
        }

        // 2. Check Redis
        try {
            String pingResult = redisTemplate.getConnectionFactory().getConnection().ping();
            if ("PONG".equalsIgnoreCase(pingResult)) {
                isRedisUp = true;
                healthReport.put("redis", "UP");
            } else {
                healthReport.put("redis", "DOWN");
            }
        } catch (Exception e) {
            log.error("Redis health check failed", e);
            healthReport.put("redis", "DOWN - " + e.getMessage());
        }

        if (isDbUp && isRedisUp) {
            healthReport.put("status", "UP");
            return ResponseEntity.ok(healthReport);
        } else {
            healthReport.put("status", "DOWN");
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(healthReport);
        }
    }
}
