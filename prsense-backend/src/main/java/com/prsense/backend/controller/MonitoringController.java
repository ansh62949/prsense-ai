package com.prsense.backend.controller;

import com.prsense.backend.service.MonitoringService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/monitoring")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MonitoringController {

    private final MonitoringService monitoringService;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getObservabilityStats(@RequestParam(value = "repoId", required = false) Long repoId) {
        return ResponseEntity.ok(monitoringService.getSystemObservabilityStats(repoId));
    }
}
