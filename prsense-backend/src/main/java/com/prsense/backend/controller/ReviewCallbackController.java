package com.prsense.backend.controller;

import com.prsense.backend.entity.*;
import com.prsense.backend.repository.*;
import com.prsense.backend.service.GitHubService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class ReviewCallbackController {

    @Value("${ai.service.url:http://localhost:8000}")
    private String aiServiceUrl;

    private final ReviewRepository reviewRepository;
    private final ReviewFindingRepository findingRepository;
    private final ReviewTimelineRepository timelineRepository;
    private final GitHubService githubService;
    private final RepositoryRepository repositoryRepository;
    private final RepositorySnapshotRepository repositorySnapshotRepository;
    private final AgentOutputRepository agentOutputRepository;

    @PostMapping("/callback")
    public ResponseEntity<String> handleReviewCallback(@RequestBody Map<String, Object> body) {
        try {
            Long reviewId = ((Number) body.get("review_id")).longValue();
            String status = (String) body.get("status");
            log.info("Received review callback for review ID: {}, status: {}", reviewId, status);

            Review review = reviewRepository.findById(reviewId)
                    .orElseThrow(() -> new IllegalArgumentException("Review not found with ID: " + reviewId));

            if ("FAILED".equals(status)) {
                review.setStatus("FAILED");
                review.setSummaryReport((String) body.get("error_message"));
                reviewRepository.save(review);
                return ResponseEntity.ok("Review marked as failed.");
            }

            review.setStatus("COMPLETED");
            review.setConfidenceScore(((Number) body.get("confidence")).doubleValue());
            review.setSummaryReport((String) body.get("summary"));
            
            Long executionTimeMs = ((Number) body.get("execution_time_ms")).longValue();
            review.setExecutionTimeMs(executionTimeMs);
            review.setCompletedAt(LocalDateTime.now());

            String severity = (String) body.get("overall_severity");
            review.setAiDecision("critical".equalsIgnoreCase(severity) || "high".equalsIgnoreCase(severity) ? "CHANGES_REQUESTED" : "APPROVED");
            
            // Delete old findings and timelines if they exist (clean slate)
            // Save findings
            List<Map<String, Object>> findingsList = (List<Map<String, Object>>) body.get("findings");
            List<ReviewFinding> dbFindings = new ArrayList<>();
            for (Map<String, Object> f : findingsList) {
                Integer lineNum = 1;
                List<Map<String, Object>> lineRefs = (List<Map<String, Object>>) f.get("line_references");
                if (lineRefs != null && !lineRefs.isEmpty()) {
                    Map<String, Object> firstRef = lineRefs.get(0);
                    if (firstRef.get("start_line") != null) {
                        lineNum = ((Number) firstRef.get("start_line")).intValue();
                    }
                }

                ReviewFinding finding = ReviewFinding.builder()
                        .review(review)
                        .agent((String) f.get("agent"))
                        .category((String) f.get("category"))
                        .severity((String) f.get("severity"))
                        .filePath((String) f.get("file_path"))
                        .lineReference(lineRefs != null && !lineRefs.isEmpty() ? (String) lineRefs.get(0).get("note") : "Reference line")
                        .lineNumber(lineNum)
                        .recommendation((String) f.get("recommendation"))
                        .confidence(((Number) f.get("confidence")).doubleValue())
                        .description((String) f.get("description"))
                        .whyFlagged((String) f.get("why_flagged"))
                        .ruleViolated((String) f.get("rule_violated"))
                        .similarPr((String) f.get("similar_pr"))
                        .build();
                dbFindings.add(finding);
            }
            review.setTotalFindings(dbFindings.size());
            
            int criticals = 0;
            for (ReviewFinding rf : dbFindings) {
                String sev = rf.getSeverity();
                if ("critical".equalsIgnoreCase(sev) || "high".equalsIgnoreCase(sev)) {
                    criticals++;
                }
            }
            review.setCriticalFindings(criticals);

            reviewRepository.save(review);
            List<ReviewFinding> savedFindings = findingRepository.saveAll(dbFindings);

            // Save execution timelines
            List<Map<String, Object>> timelinesList = (List<Map<String, Object>>) body.get("timelines");
            if (timelinesList != null) {
                List<ReviewTimeline> dbTimelines = new ArrayList<>();
                for (Map<String, Object> t : timelinesList) {
                    ReviewTimeline tl = ReviewTimeline.builder()
                            .review(review)
                            .stepName((String) t.get("step_name"))
                            .durationMs(((Number) t.get("duration_ms")).intValue())
                            .tokenUsage(t.get("token_usage") != null ? ((Number) t.get("token_usage")).intValue() : 0)
                            .cost(t.get("cost") != null ? ((Number) t.get("cost")).doubleValue() : 0.0)
                            .status((String) t.get("status"))
                            .build();
                    dbTimelines.add(tl);
                }
                timelineRepository.saveAll(dbTimelines);
            }

            // Save agent outputs
            List<Map<String, Object>> agentOutputsList = (List<Map<String, Object>>) body.get("agent_outputs");
            if (agentOutputsList != null) {
                List<AgentOutput> dbOutputs = new ArrayList<>();
                for (Map<String, Object> ao : agentOutputsList) {
                    AgentOutput dbAo = AgentOutput.builder()
                            .review(review)
                            .agentName((String) ao.get("agent_name"))
                            .prompt((String) ao.get("prompt"))
                            .response((String) ao.get("response"))
                            .confidence(ao.get("confidence") != null ? ((Number) ao.get("confidence")).doubleValue() : 0.8)
                            .tokenUsage(ao.get("token_usage") != null ? ((Number) ao.get("token_usage")).intValue() : 0)
                            .cost(ao.get("cost") != null ? ((Number) ao.get("cost")).doubleValue() : 0.0)
                            .durationMs(ao.get("duration_ms") != null ? ((Number) ao.get("duration_ms")).longValue() : 0L)
                            .build();
                    dbOutputs.add(dbAo);
                }
                agentOutputRepository.saveAll(dbOutputs);
            }

            // Post review to GitHub
            githubService.postPRReview(
                    review.getPullRequest().getRepository().getFullName(),
                    review.getPullRequest().getPrNumber(),
                    severity,
                    review.getSummaryReport(),
                    savedFindings
            );

            log.info("Successfully persisted async review ID: {} and posted comments to GitHub.", reviewId);
            return ResponseEntity.ok("Review successfully callback processed.");
        } catch (Exception e) {
            log.error("Failed to handle review callback", e);
            return ResponseEntity.badRequest().body("Failed: " + e.getMessage());
        }
    }

    @PostMapping("/indexing-callback")
    public ResponseEntity<String> handleIndexingCallback(@RequestBody Map<String, Object> body) {
        try {
            Long repoId = ((Number) body.get("repository_id")).longValue();
            String status = (String) body.get("status");
            log.info("Received indexing callback for repo ID: {}, status: {}", repoId, status);

            Repository repo = repositoryRepository.findById(repoId)
                    .orElseThrow(() -> new IllegalArgumentException("Repository not found with ID: " + repoId));

            repo.setIndexingStatus(status);
            if (body.get("files_indexed") != null) {
                repo.setFilesIndexed(((Number) body.get("files_indexed")).intValue());
            }
            if (body.get("embeddings_generated") != null) {
                repo.setEmbeddingsGenerated(((Number) body.get("embeddings_generated")).intValue());
            }
            if (body.get("duration_ms") != null) {
                repo.setIndexingDurationMs(((Number) body.get("duration_ms")).longValue());
            }
            if (body.get("error") != null) {
                repo.setIndexingError((String) body.get("error"));
            }
            if (body.get("progress") != null) {
                repo.setIndexingProgress(((Number) body.get("progress")).intValue());
            }
            repo.setLastIndexedAt(LocalDateTime.now());
            
            repositoryRepository.save(repo);

            if ("INDEXED".equals(status)) {
                if (body.get("snapshot") != null) {
                    Map<String, Object> snapMap = (Map<String, Object>) body.get("snapshot");
                    String commitSha = (String) snapMap.get("commit_sha");
                    log.info("Processing snapshot in callback for repo ID: {}, language: {}, frameworks: {}", 
                            repoId, snapMap.get("primary_language"), snapMap.get("frameworks"));
                    
                    if (commitSha != null) {
                        repositorySnapshotRepository.findByRepositoryIdAndCommitSha(repoId, commitSha)
                                .ifPresent(repositorySnapshotRepository::delete);
                    }
                    
                    RepositorySnapshot snapshot = RepositorySnapshot.builder()
                            .repository(repo)
                            .commitSha(commitSha)
                            .primaryLanguage((String) snapMap.get("primary_language"))
                            .frameworks((String) snapMap.get("frameworks"))
                            .databaseUsed((String) snapMap.get("database_used"))
                            .buildTool((String) snapMap.get("build_tool"))
                            .controllersCount(snapMap.get("controllers_count") != null ? ((Number) snapMap.get("controllers_count")).intValue() : 0)
                            .servicesCount(snapMap.get("services_count") != null ? ((Number) snapMap.get("services_count")).intValue() : 0)
                            .repositoriesCount(snapMap.get("repositories_count") != null ? ((Number) snapMap.get("repositories_count")).intValue() : 0)
                            .testCount(snapMap.get("test_count") != null ? ((Number) snapMap.get("test_count")).intValue() : 0)
                            .architectureStyle((String) snapMap.get("architecture_style"))
                            .securityRules((String) snapMap.get("security_rules"))
                            .codingStandards((String) snapMap.get("coding_standards"))
                            .dependencyGraph((String) snapMap.get("dependency_graph"))
                            .repositoryHealthScore(snapMap.get("health_score") != null ? ((Number) snapMap.get("health_score")).doubleValue() : 90.0)
                            .build();
                    
                    log.info("Saving repository snapshot into database...");
                    repositorySnapshotRepository.save(snapshot);
                    log.info("Successfully saved repository snapshot for repo: {} at commit: {}", repo.getFullName(), commitSha);
                } else {
                    log.warn("Received INDEXED callback status for repo ID: {} but snapshot payload was null!", repoId);
                }
            }

            return ResponseEntity.ok("Indexing callback successfully processed.");
        } catch (Exception e) {
            log.error("Failed to handle indexing callback", e);
            return ResponseEntity.badRequest().body("Failed: " + e.getMessage());
        }
    }

    private final org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();

    @GetMapping("/{reviewId}")
    public ResponseEntity<Map<String, Object>> getReviewDetails(@PathVariable Long reviewId) {
        return reviewRepository.findById(reviewId)
                .map(review -> {
                    Map<String, Object> details = new HashMap<>();
                    details.put("review", review);
                    details.put("pullRequest", review.getPullRequest());
                    
                    // Fetch findings
                    List<ReviewFinding> findings = findingRepository.findByReviewId(review.getId());
                    details.put("findings", findings);
                    
                    // Group findings by category
                    List<ReviewFinding> staticFindings = new ArrayList<>();
                    List<ReviewFinding> securityFindings = new ArrayList<>();
                    List<ReviewFinding> architectureFindings = new ArrayList<>();
                    List<ReviewFinding> styleFindings = new ArrayList<>();
                    
                    List<String> filesChanged = new ArrayList<>();
                    for (ReviewFinding f : findings) {
                        if (f.getFilePath() != null && !filesChanged.contains(f.getFilePath())) {
                            filesChanged.add(f.getFilePath());
                        }
                        
                        String cat = f.getCategory() != null ? f.getCategory().toLowerCase() : "";
                        if (cat.contains("static")) staticFindings.add(f);
                        else if (cat.contains("security")) securityFindings.add(f);
                        else if (cat.contains("arch")) architectureFindings.add(f);
                        else if (cat.contains("style")) styleFindings.add(f);
                    }
                    
                    details.put("filesChanged", filesChanged);
                    details.put("staticFindings", staticFindings);
                    details.put("securityFindings", securityFindings);
                    details.put("architectureFindings", architectureFindings);
                    details.put("styleFindings", styleFindings);
                    
                    // Fetch timelines
                    List<ReviewTimeline> timeline = timelineRepository.findByReviewIdOrderByCreatedAtAsc(review.getId());
                    details.put("timeline", timeline);
                    
                    // Fetch agent outputs
                    List<AgentOutput> agentOutputs = agentOutputRepository.findByReviewIdOrderByCreatedAtAsc(review.getId());
                    details.put("agentOutputs", agentOutputs);
                    
                    // Construct a mock GitHub Comment Preview
                    StringBuilder preview = new StringBuilder();
                    preview.append("### 🔍 PRSense AI Code Review Summary\n\n");
                    preview.append("**Decision:** ").append(review.getAiDecision()).append("\n");
                    preview.append("**Findings:** ").append(findings.size()).append(" total violations (").append(review.getCriticalFindings()).append(" critical)\n");
                    preview.append("**Confidence:** ").append(Math.round(review.getConfidenceScore() * 100)).append("%\n\n");
                    preview.append("#### Findings Breakdown\n");
                    for (ReviewFinding f : findings) {
                        preview.append("- **[").append(f.getSeverity().toUpperCase()).append("]** `").append(f.getFilePath()).append("` line ").append(f.getLineNumber()).append(": ").append(f.getDescription()).append("\n");
                    }
                    details.put("githubCommentPreview", preview.toString());
                    
                    return ResponseEntity.ok(details);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/agents")
    public ResponseEntity<List<AgentOutput>> getAgentOutputs(@PathVariable Long id) {
        List<AgentOutput> agentOutputs = agentOutputRepository.findByReviewIdOrderByCreatedAtAsc(id);
        return ResponseEntity.ok(agentOutputs);
    }

    @PostMapping("/playground")
    public ResponseEntity<Object> runPlaygroundReview(@RequestBody Map<String, Object> body) {
        try {
            String url = aiServiceUrl + "/api/review/playground";
            Object response = restTemplate.postForObject(url, body, Object.class);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to run playground review on AI engine", e);
            return ResponseEntity.badRequest().body(Map.of("error", "AI Engine connection failed: " + e.getMessage()));
        }
    }
}
