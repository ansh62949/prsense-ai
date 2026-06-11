package com.prsense.backend.controller;

import com.prsense.backend.entity.Review;
import com.prsense.backend.service.ReviewAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ReviewAnalyticsController {

    private final ReviewAnalyticsService analyticsService;

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardAnalytics(@RequestParam(value = "repoId", required = false) Long repoId) {
        return ResponseEntity.ok(analyticsService.getAIInsightsDashboard(repoId));
    }

    @GetMapping("/timeline/{repoId}")
    public ResponseEntity<Map<String, Object>> getRepositoryTimeline(@PathVariable Long repoId) {
        return ResponseEntity.ok(analyticsService.getRepositoryReviewTimeline(repoId));
    }

    @GetMapping("/reviews")
    public ResponseEntity<List<Review>> getAllReviews() {
        return ResponseEntity.ok(analyticsService.getAllReviews());
    }
}
