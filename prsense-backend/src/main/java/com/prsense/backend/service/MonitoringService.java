package com.prsense.backend.service;

import com.prsense.backend.entity.Review;
import com.prsense.backend.entity.ReviewTimeline;
import com.prsense.backend.repository.ReviewRepository;
import com.prsense.backend.repository.ReviewTimelineRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class MonitoringService {

    private final ReviewRepository reviewRepository;
    private final ReviewTimelineRepository timelineRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> getSystemObservabilityStats(Long repoId) {
        log.info("Aggregating system observability statistics for repoId: {}", repoId);

        List<Review> reviews = reviewRepository.findAll();
        List<ReviewTimeline> timelines = timelineRepository.findAll();

        if (repoId != null) {
            reviews = reviews.stream()
                    .filter(r -> r.getPullRequest() != null && r.getPullRequest().getRepository() != null && r.getPullRequest().getRepository().getId().equals(repoId))
                    .collect(java.util.stream.Collectors.toList());
            
            java.util.Set<Long> reviewIds = reviews.stream()
                    .map(Review::getId)
                    .collect(java.util.stream.Collectors.toSet());
            
            timelines = timelines.stream()
                    .filter(t -> reviewIds.contains(t.getReview().getId()))
                    .collect(java.util.stream.Collectors.toList());
        }

        long totalReviews = reviews.size();
        long completedReviews = reviews.stream().filter(r -> "COMPLETED".equals(r.getStatus())).count();
        long failedReviews = reviews.stream().filter(r -> "FAILED".equals(r.getStatus())).count();
        long activeReviews = reviews.stream().filter(r -> "IN_PROGRESS".equals(r.getStatus()) || "PENDING".equals(r.getStatus())).count();

        double successRate = totalReviews > 0 ? (double) completedReviews / totalReviews : 1.0;
        double failureRate = totalReviews > 0 ? (double) failedReviews / totalReviews : 0.0;

        double avgReviewLatency = reviews.stream()
                .filter(r -> r.getExecutionTimeMs() != null && r.getExecutionTimeMs() > 0)
                .mapToLong(Review::getExecutionTimeMs)
                .average()
                .orElse(0L);

        // Average agent latencies from timeline steps
        double avgStaticLatency = timelines.stream().filter(t -> t.getStepName().toLowerCase().contains("static")).mapToInt(ReviewTimeline::getDurationMs).average().orElse(0.0);
        double avgSecurityLatency = timelines.stream().filter(t -> t.getStepName().toLowerCase().contains("security")).mapToInt(ReviewTimeline::getDurationMs).average().orElse(0.0);
        double avgArchLatency = timelines.stream().filter(t -> t.getStepName().toLowerCase().contains("architecture")).mapToInt(ReviewTimeline::getDurationMs).average().orElse(0.0);
        double avgStyleLatency = timelines.stream().filter(t -> t.getStepName().toLowerCase().contains("style")).mapToInt(ReviewTimeline::getDurationMs).average().orElse(0.0);

        // Token usage & costs
        int totalTokens = timelines.stream().mapToInt(ReviewTimeline::getTokenUsage).sum();
        double totalCost = timelines.stream().mapToDouble(ReviewTimeline::getCost).sum();

        // Queue size set to 0 as Redis has been removed
        Long queueSize = 0L;

        Map<String, Object> agentLatencies = new HashMap<>();
        agentLatencies.put("static_analysis", Math.round(avgStaticLatency));
        agentLatencies.put("security_check", Math.round(avgSecurityLatency));
        agentLatencies.put("architecture_check", Math.round(avgArchLatency));
        agentLatencies.put("style_check", Math.round(avgStyleLatency));

        Map<String, Object> stats = new HashMap<>();
        stats.put("total_reviews", totalReviews);
        stats.put("success_rate", successRate);
        stats.put("failure_rate", failureRate);
        stats.put("active_jobs", activeReviews);
        stats.put("avg_review_latency_ms", Math.round(avgReviewLatency));
        stats.put("agent_latencies_ms", agentLatencies);
        stats.put("total_tokens_consumed", totalTokens);
        stats.put("total_api_costs_usd", totalCost);
        stats.put("active_queue_size", queueSize);
        stats.put("worker_status", totalReviews > 0 ? "active" : "idle");

        return stats;
    }
}
