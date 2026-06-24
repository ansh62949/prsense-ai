package com.prsense.backend.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
@RequestMapping({"/api/health", "/health"})
@RequiredArgsConstructor
@Slf4j
public class HealthController {

    private final DataSource dataSource;

    @GetMapping
    public ResponseEntity<Map<String, String>> checkHealth() {
        Map<String, String> healthReport = new HashMap<>();
        boolean isDbUp = false;

        healthReport.put("service", "backend");
        healthReport.put("timestamp", java.time.Instant.now().toString());

        // Check Database
        try (Connection conn = dataSource.getConnection()) {
            if (conn.isValid(2)) {
                isDbUp = true;
                healthReport.put("database", "CONNECTED");
            } else {
                healthReport.put("database", "DISCONNECTED");
            }
        } catch (Exception e) {
            log.error("Database health check failed", e);
            healthReport.put("database", "ERROR - " + e.getMessage());
        }

        if (isDbUp) {
            healthReport.put("status", "UP");
            return ResponseEntity.ok(healthReport);
        } else {
            healthReport.put("status", "DOWN");
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(healthReport);
        }
    }
}
