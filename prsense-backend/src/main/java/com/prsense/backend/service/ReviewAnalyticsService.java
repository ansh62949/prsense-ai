package com.prsense.backend.service;

import com.prsense.backend.entity.LearnedPattern;
import com.prsense.backend.entity.Review;
import com.prsense.backend.entity.ReviewFinding;
import com.prsense.backend.entity.ReviewTimeline;
import com.prsense.backend.repository.LearnedPatternRepository;
import com.prsense.backend.repository.PullRequestRepository;
import com.prsense.backend.repository.RepositoryRepository;
import com.prsense.backend.repository.ReviewFindingRepository;
import com.prsense.backend.repository.ReviewRepository;
import com.prsense.backend.repository.ReviewTimelineRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReviewAnalyticsService {

    private final ReviewRepository reviewRepository;
    private final ReviewFindingRepository findingRepository;
    private final RepositoryRepository repositoryRepository;
    private final PullRequestRepository pullRequestRepository;
    private final LearnedPatternRepository learnedPatternRepository;
    private final ReviewTimelineRepository timelineRepository;

    @Transactional(readOnly = true)
    public List<Review> getAllReviews() {
        return reviewRepository.findAllWithDetails();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getRepositoryReviewTimeline(Long repoId) {
        log.info("Compiling review timeline for repository ID: {}", repoId);
        List<Review> reviews = reviewRepository.findAllWithDetails().stream()
                .filter(r -> r.getPullRequest() != null && r.getPullRequest().getRepository() != null && r.getPullRequest().getRepository().getId().equals(repoId))
                .sorted(Comparator.comparing(Review::getCreatedAt).reversed())
                .collect(Collectors.toList());

        List<Map<String, Object>> timeline = new ArrayList<>();
        for (Review r : reviews) {
            Map<String, Object> step = new HashMap<>();
            step.put("reviewId", r.getId());
            step.put("prNumber", r.getPullRequest().getPrNumber());
            step.put("prTitle", r.getPullRequest().getTitle());
            step.put("author", r.getPullRequest().getAuthor());
            step.put("status", r.getStatus());
            step.put("aiDecision", r.getAiDecision());
            step.put("totalFindings", r.getTotalFindings() != null ? r.getTotalFindings() : 0);
            step.put("criticalFindings", r.getCriticalFindings() != null ? r.getCriticalFindings() : 0);
            step.put("confidenceScore", r.getConfidenceScore() != null ? r.getConfidenceScore() : 0.85);
            step.put("executionTimeMs", r.getExecutionTimeMs() != null ? r.getExecutionTimeMs() : 1200L);
            step.put("createdAt", r.getCreatedAt().toString());
            step.put("completedAt", r.getCompletedAt() != null ? r.getCompletedAt().toString() : null);

            // Fetch actual database step timelines
            List<ReviewTimeline> dbSteps = timelineRepository.findByReviewIdOrderByCreatedAtAsc(r.getId());
            List<Map<String, Object>> stepTraces = new ArrayList<>();
            for (ReviewTimeline t : dbSteps) {
                Map<String, Object> trace = new HashMap<>();
                trace.put("step_name", t.getStepName());
                trace.put("duration_ms", t.getDurationMs());
                trace.put("token_usage", t.getTokenUsage());
                trace.put("cost", t.getCost());
                trace.put("status", t.getStatus());
                stepTraces.add(trace);
            }
            step.put("steps", stepTraces);

            timeline.add(step);
        }

        return Map.of(
            "repoId", repoId,
            "reviewsCount", timeline.size(),
            "timeline", timeline
        );
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getAIInsightsDashboard(Long repoId) {
        log.info("Compiling AI Insights Dashboard metrics for repository ID: {}", repoId);
        
        List<Review> allReviews;
        List<ReviewFinding> allFindings;
        long totalRepos = repositoryRepository.count();
        long totalPrs;
        long totalLearnedPatterns;

        if (repoId != null) {
            allReviews = reviewRepository.findAllWithDetails().stream()
                    .filter(r -> r.getPullRequest() != null && r.getPullRequest().getRepository() != null && r.getPullRequest().getRepository().getId().equals(repoId))
                    .collect(Collectors.toList());
            allFindings = findingRepository.findAll().stream()
                    .filter(f -> f.getReview() != null && f.getReview().getPullRequest() != null && f.getReview().getPullRequest().getRepository() != null && f.getReview().getPullRequest().getRepository().getId().equals(repoId))
                    .collect(Collectors.toList());
            totalPrs = pullRequestRepository.findAll().stream()
                    .filter(pr -> pr.getRepository() != null && pr.getRepository().getId().equals(repoId))
                    .count();
            totalLearnedPatterns = learnedPatternRepository.findAll().stream()
                    .filter(p -> p.getRepository() != null && p.getRepository().getId().equals(repoId))
                    .count();
        } else {
            allReviews = reviewRepository.findAllWithDetails();
            allFindings = findingRepository.findAll();
            totalPrs = pullRequestRepository.count();
            totalLearnedPatterns = learnedPatternRepository.count();
        }

        // 1. Calculate violation categories count
        Map<String, Long> categoryCounts = allFindings.stream()
                .collect(Collectors.groupingBy(ReviewFinding::getCategory, Collectors.counting()));

        // Ensure default categories exist if empty
        String[] standardCategories = {"static_analysis", "security", "architecture", "style"};
        for (String cat : standardCategories) {
            categoryCounts.putIfAbsent(cat, 0L);
        }

        // 2. Severity Counts
        Map<String, Long> severityCounts = allFindings.stream()
                .collect(Collectors.groupingBy(ReviewFinding::getSeverity, Collectors.counting()));
        String[] standardSeverities = {"critical", "high", "medium", "low", "info"};
        for (String sev : standardSeverities) {
            severityCounts.putIfAbsent(sev, 0L);
        }

        // 3. Trends over the past weeks dynamically calculated
        LocalDateTime now = LocalDateTime.now();
        List<Map<String, Object>> securityTrends = new ArrayList<>();
        List<Map<String, Object>> architectureTrends = new ArrayList<>();
        List<Map<String, Object>> learningTrends = new ArrayList<>();

        for (int i = 3; i >= 0; i--) {
            LocalDateTime start = now.minusDays((i + 1) * 7);
            LocalDateTime end = now.minusDays(i * 7);
            String label = "Wk " + (now.minusDays(i * 7).getDayOfYear() / 7);

            final LocalDateTime fStart = start;
            final LocalDateTime fEnd = end;

            long secCount = allFindings.stream()
                .filter(f -> "security".equalsIgnoreCase(f.getCategory()))
                .filter(f -> f.getCreatedAt().isAfter(fStart) && f.getCreatedAt().isBefore(fEnd))
                .count();

            long archCount = allFindings.stream()
                .filter(f -> "architecture".equalsIgnoreCase(f.getCategory()))
                .filter(f -> f.getCreatedAt().isAfter(fStart) && f.getCreatedAt().isBefore(fEnd))
                .count();

            long patternCount = learnedPatternRepository.findAll().stream()
                .filter(p -> repoId == null || (p.getRepository() != null && p.getRepository().getId().equals(repoId)))
                .filter(p -> p.getCreatedAt() != null && p.getCreatedAt().isBefore(fEnd))
                .count();

            securityTrends.add(Map.of("week", label, "violations", secCount));
            architectureTrends.add(Map.of("week", label, "violations", archCount));
            learningTrends.add(Map.of("week", label, "rules", patternCount));
        }

        // 4. Feeds Generation
        List<Map<String, Object>> recentPrs = allReviews.stream()
                .sorted(Comparator.comparing(Review::getCreatedAt).reversed())
                .map(r -> {
                    Map<String, Object> map = new HashMap<>();
                    if (r.getPullRequest() != null) {
                        map.put("prNumber", r.getPullRequest().getPrNumber());
                        map.put("title", r.getPullRequest().getTitle());
                        map.put("author", r.getPullRequest().getAuthor());
                        map.put("status", r.getPullRequest().getStatus());
                    } else {
                        map.put("prNumber", 0);
                        map.put("title", "Playground Review");
                        map.put("author", "anonymous");
                        map.put("status", "COMPLETED");
                    }
                    map.put("aiDecision", r.getAiDecision());
                    map.put("createdAt", r.getCreatedAt().toString());
                    return map;
                })
                .limit(5)
                .collect(Collectors.toList());

        List<Map<String, Object>> activeQueue = allReviews.stream()
                .filter(r -> "PENDING".equalsIgnoreCase(r.getStatus()) || "IN_PROGRESS".equalsIgnoreCase(r.getStatus()))
                .sorted(Comparator.comparing(Review::getCreatedAt).reversed())
                .map(r -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("reviewId", r.getId());
                    if (r.getPullRequest() != null) {
                        map.put("prNumber", r.getPullRequest().getPrNumber());
                        map.put("title", r.getPullRequest().getTitle());
                    } else {
                        map.put("prNumber", 0);
                        map.put("title", "Playground Review");
                    }
                    map.put("status", r.getStatus());
                    map.put("createdAt", r.getCreatedAt().toString());
                    
                    List<ReviewTimeline> timelineSteps = timelineRepository.findByReviewIdOrderByCreatedAtAsc(r.getId());
                    List<Map<String, Object>> stepsList = new ArrayList<>();
                    for (ReviewTimeline t : timelineSteps) {
                        Map<String, Object> step = new HashMap<>();
                        step.put("stepName", t.getStepName());
                        step.put("status", t.getStatus());
                        stepsList.add(step);
                    }
                    map.put("steps", stepsList);
                    return map;
                })
                .collect(Collectors.toList());

        List<Map<String, Object>> recentSecurityFindings = allFindings.stream()
                .filter(f -> "security".equalsIgnoreCase(f.getCategory()))
                .sorted(Comparator.comparing(ReviewFinding::getCreatedAt).reversed())
                .map(f -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("filePath", f.getFilePath() != null ? f.getFilePath() : "unknown");
                    map.put("description", f.getDescription());
                    map.put("severity", f.getSeverity());
                    map.put("recommendation", f.getRecommendation());
                    map.put("confidence", f.getConfidence() != null ? f.getConfidence() : 0.85);
                    return map;
                })
                .limit(5)
                .collect(Collectors.toList());

        List<Map<String, Object>> recentLearningEvents = learnedPatternRepository.findAll().stream()
                .filter(p -> repoId == null || (p.getRepository() != null && p.getRepository().getId().equals(repoId)))
                .sorted(Comparator.comparing(LearnedPattern::getCreatedAt).reversed())
                .map(p -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("title", p.getTitle());
                    map.put("description", p.getDescription());
                    map.put("confidence", p.getConfidenceScore() != null ? p.getConfidenceScore() : 0.85);
                    map.put("createdAt", p.getCreatedAt() != null ? p.getCreatedAt().toString() : LocalDateTime.now().toString());
                    return map;
                })
                .limit(5)
                .collect(Collectors.toList());

        Map<String, Object> res = new HashMap<>();
        res.put("activeRepositories", totalRepos);
        res.put("totalPrReviews", allReviews.size());
        res.put("totalPullRequests", totalPrs);
        res.put("totalFindings", allFindings.size());
        res.put("totalLearnedRules", totalLearnedPatterns);
        res.put("categoryBreakdown", categoryCounts);
        res.put("severityBreakdown", severityCounts);
        res.put("securityTrends", securityTrends);
        res.put("architectureTrends", architectureTrends);
        res.put("learningTrends", learningTrends);
        res.put("recentPrs", recentPrs);
        res.put("recentSecurityFindings", recentSecurityFindings);
        res.put("recentLearningEvents", recentLearningEvents);
        res.put("activeQueue", activeQueue);
        res.put("averageConfidence", allReviews.stream().mapToDouble(r -> r.getConfidenceScore() != null ? r.getConfidenceScore() : 0.82).average().orElse(0.85));
        res.put("averageExecutionTimeMs", allReviews.stream().mapToLong(r -> r.getExecutionTimeMs() != null ? r.getExecutionTimeMs() : 1850L).average().orElse(1500.0));

        return res;
    }

    @Transactional(readOnly = true)
    public List<LearnedPattern> getLearnedPatterns(Long repoId) {
        if (repoId != null) {
            return learnedPatternRepository.findByRepositoryId(repoId);
        } else {
            return learnedPatternRepository.findAll();
        }
    }
}
