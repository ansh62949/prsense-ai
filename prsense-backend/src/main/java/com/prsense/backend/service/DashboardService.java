package com.prsense.backend.service;

import com.prsense.backend.entity.Review;
import com.prsense.backend.repository.PullRequestRepository;
import com.prsense.backend.repository.RepositoryRepository;
import com.prsense.backend.repository.ReviewFindingRepository;
import com.prsense.backend.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final PullRequestRepository prRepository;
    private final RepositoryRepository repoRepository;
    private final ReviewRepository reviewRepository;
    private final ReviewFindingRepository findingRepository;

    public Map<String, Object> getDashboardMetrics() {
        long totalRepos = repoRepository.count();
        long totalPrs = prRepository.count();
        List<Review> reviews = reviewRepository.findAll();
        
        LocalDateTime dayAgo = LocalDateTime.now().minusDays(1);
        long reviewsToday = reviews.stream()
                .filter(r -> r.getCreatedAt() != null && r.getCreatedAt().isAfter(dayAgo))
                .count();

        long securityFindings = findingRepository.findAll().stream()
                .filter(f -> "security".equalsIgnoreCase(f.getCategory()))
                .count();

        long architectureFindings = findingRepository.findAll().stream()
                .filter(f -> "architecture".equalsIgnoreCase(f.getCategory()))
                .count();

        return Map.of(
            "activeRepositories", totalRepos,
            "totalPrReviews", (long) reviews.size(),
            "reviewsToday", reviewsToday,
            "securityFindings", securityFindings,
            "architectureFindings", architectureFindings,
            "aiAgentUptime", 100.0
        );
    }
}
