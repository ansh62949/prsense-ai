package com.prsense.backend.controller;

import com.prsense.backend.entity.*;
import com.prsense.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;

import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/api/webhooks")
@RequiredArgsConstructor
@Slf4j
public class WebhookController {

    private final RepositoryRepository repositoryRepository;
    private final PullRequestRepository pullRequestRepository;
    private final ReviewRepository reviewRepository;
    private final ReviewFindingRepository reviewFindingRepository;
    private final LearnedPatternRepository learnedPatternRepository;
    private final com.prsense.backend.service.GitHubService githubService;
    private final com.prsense.backend.service.AiIndexingClient aiIndexingClient;

    @PostMapping("/github")
    @Transactional
    public ResponseEntity<String> handleGithubWebhook(
            @RequestHeader("X-GitHub-Event") String event,
            @RequestHeader(value = "X-Hub-Signature-256", required = false) String signature,
            @RequestBody Map<String, Object> payload
    ) {
        log.info("Received GitHub Webhook Event: {}", event);
        
        try {
            if ("pull_request".equals(event)) {
                String action = (String) payload.get("action");
                Map<String, Object> prData = (Map<String, Object>) payload.get("pull_request");
                Map<String, Object> repoData = (Map<String, Object>) payload.get("repository");
                Map<String, Object> userData = (Map<String, Object>) prData.get("user");
                
                String repoFullName = com.prsense.backend.service.RepositoryService.normalizeRepoFullName((String) repoData.get("full_name"));
                String repoName = (String) repoData.get("name");
                Integer prNumber = (Integer) prData.get("number");
                String prTitle = (String) prData.get("title");
                String author = (String) userData.get("login");
                Long githubPrId = ((Number) prData.get("id")).longValue();
                String body = (String) prData.get("body");
                String headSha = (String) ((Map<String, Object>) prData.get("head")).get("sha");

                log.info("GitHub Pull Request Hook - Action: {}, Repo: {}, PR #: {}, Title: {}", action, repoFullName, prNumber, prTitle);

                // 1. Sync Repository
                Repository repository = repositoryRepository.findByFullName(repoFullName)
                        .orElseGet(() -> {
                            Repository newRepo = Repository.builder()
                                    .fullName(repoFullName)
                                    .name(repoName)
                                    .installationId(123456L) // Fallback installation ID
                                    .language("Java")
                                    .webhookStatus("healthy")
                                    .build();
                            return repositoryRepository.save(newRepo);
                        });

                // 2. Sync Pull Request
                PullRequest pr = pullRequestRepository.findByRepositoryIdAndPrNumber(repository.getId(), prNumber)
                        .orElseGet(() -> PullRequest.builder()
                                .repository(repository)
                                .githubPrId(githubPrId)
                                .prNumber(prNumber)
                                .title(prTitle)
                                .author(author)
                                .status("OPEN")
                                .description(body)
                                .headSha(headSha)
                                .build());

                if ("closed".equals(action)) {
                    Boolean merged = (Boolean) prData.get("merged");
                    if (Boolean.TRUE.equals(merged)) {
                        pr.setStatus("MERGED");
                    } else {
                        pr.setStatus("CLOSED");
                    }
                } else if ("reopened".equals(action)) {
                    pr.setStatus("OPEN");
                }
                
                pr.setTitle(prTitle);
                pr.setHeadSha(headSha);
                pr = pullRequestRepository.save(pr);

                // 3. Trigger Actions based on webhook action type
                if ("opened".equals(action) || "synchronize".equals(action)) {
                    // Start review flow asynchronously
                    triggerAiReviewFlow(pr, repoFullName, prTitle);
                } else if ("closed".equals(action) && "MERGED".equals(pr.getStatus())) {
                    // Trigger Learner module style extraction flow
                    triggerLearnerFlow(repository, prTitle);
                }
            }
        } catch (Exception e) {
            log.error("Failed to parse webhook body: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Failed to parse payload: " + e.getMessage());
        }
        
        return ResponseEntity.ok("Webhook received and successfully queued.");
    }

    private void triggerAiReviewFlow(PullRequest pr, String repoFullName, String prTitle) {
        log.info("Initiating asynchronous direct review flow for PR #{} in {}", pr.getPrNumber(), repoFullName);
        
        // Create Review in IN_PROGRESS state
        Review review = Review.builder()
                .pullRequest(pr)
                .status("IN_PROGRESS")
                .aiDecision("COMMENTED")
                .summaryReport("Direct AI review execution in progress...")
                .totalFindings(0)
                .criticalFindings(0)
                .confidenceScore(0.0)
                .executionTimeMs(0L)
                .organizationId(pr.getRepository().getOrganizationId())
                .build();
        final Review savedReview = reviewRepository.save(review);
 
        String mockDiff = "";
 
        // Call direct indexing service asynchronously
        java.util.concurrent.CompletableFuture.runAsync(() -> {
            try {
                aiIndexingClient.runReview(
                        savedReview.getId(),
                        repoFullName,
                        prTitle,
                        mockDiff,
                        savedReview.getOrganizationId(),
                        pr.getHeadSha()
                );
            } catch (Exception e) {
                log.error("Failed to execute async direct review for review ID: {}", savedReview.getId(), e);
                savedReview.setStatus("FAILED");
                savedReview.setSummaryReport("Direct review call failed: " + e.getMessage());
                reviewRepository.save(savedReview);
            }
        });
    }
 
    private void triggerLearnerFlow(Repository repository, String prTitle) {
        log.info("Triggering asynchronous direct learning task for repo: {}", repository.getFullName());
        
        String mockMergedDiff = "";
 
        // Call direct learning service asynchronously
        java.util.concurrent.CompletableFuture.runAsync(() -> {
            try {
                aiIndexingClient.runLearner(
                        repository.getFullName(),
                        prTitle,
                        mockMergedDiff,
                        repository.getOrganizationId()
                );
            } catch (Exception e) {
                log.error("Failed to execute async direct learner for repo: {}", repository.getFullName(), e);
            }
        });
    }
}
