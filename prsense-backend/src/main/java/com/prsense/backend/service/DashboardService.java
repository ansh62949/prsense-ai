package com.prsense.backend.service;

import com.prsense.backend.repository.PullRequestRepository;
import com.prsense.backend.repository.RepositoryRepository;
import com.prsense.backend.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final PullRequestRepository prRepository;
    private final RepositoryRepository repoRepository;
    private final ReviewRepository reviewRepository;

    public Map<String, Object> getDashboardMetrics() {
        long totalRepos = repoRepository.count();
        long totalPrs = prRepository.count();
        long totalReviews = reviewRepository.count();
        
        // Mocking some complex metrics for now
        return Map.of(
            "activeRepositories", totalRepos,
            "totalPrReviews", totalReviews,
            "reviewsToday", 29, // Placeholder
            "securityFindings", 12, // Placeholder
            "architectureFindings", 89, // Placeholder
            "aiAgentUptime", 99.8
        );
    }
}
