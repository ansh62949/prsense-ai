package com.prsense.backend.service;

import com.prsense.backend.entity.ReviewFinding;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class GitHubService {

    public void postPRReview(String repoFullName, Integer prNumber, String overallSeverity, String summary, List<ReviewFinding> findings) {
        String token = System.getenv("GITHUB_TOKEN");
        if (token == null || token.trim().isEmpty()) {
            log.warn("GITHUB_TOKEN environment variable not set. Skipping GitHub Review Comments posting.");
            log.info("--- SIMULATED GITHUB PR REVIEW POSTING ---");
            log.info("Repo: {}, PR #: {}", repoFullName, prNumber);
            log.info("Review Summary: {}", summary);
            log.info("Overall Severity: {}", overallSeverity);
            for (ReviewFinding f : findings) {
                log.info("------------------------------------------");
                log.info("Inline Comment -> File: {}, Line: {}, Agent: {}", f.getFilePath(), f.getLineNumber() != null ? f.getLineNumber() : 1, f.getAgent());
                log.info("Description: {}", f.getDescription());
                log.info("Severity: {}", f.getSeverity());
                log.info("Recommendation: {}", f.getRecommendation());
                log.info("Why Flagged: {}", f.getWhyFlagged());
                log.info("Rule Violated: {}", f.getRuleViolated());
                log.info("Similar PR: {}", f.getSimilarPr());
                log.info("Confidence: {}%", (int)((f.getConfidence() != null ? f.getConfidence() : 0.85) * 100));
            }
            log.info("------------------------------------------");
            return;
        }

        try {
            String url = "https://api.github.com/repos/" + repoFullName + "/pulls/" + prNumber + "/reviews";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + token);
            headers.set("Accept", "application/vnd.github.v3+json");
            headers.set("User-Agent", "PRSense-AI-Copilot");

            Map<String, Object> body = new HashMap<>();
            body.put("body", "### PRSense AI Code Review Summary\n\n" + summary + "\n\n**Overall Severity**: " + overallSeverity.toUpperCase());
            body.put("event", "COMMENT"); // Can be COMMENT, APPROVE, or REQUEST_CHANGES

            List<Map<String, Object>> comments = new ArrayList<>();
            for (ReviewFinding f : findings) {
                if (f.getFilePath() == null || "unknown".equalsIgnoreCase(f.getFilePath())) {
                    continue;
                }
                Map<String, Object> comment = new HashMap<>();
                comment.put("path", f.getFilePath());
                comment.put("line", f.getLineNumber() != null ? f.getLineNumber() : 1);
                
                String commentBody = String.format(
                    "### %s\n**%s**\n\n**Severity**: %s\n\n**Recommendation**:\n%s\n\n*Why Flagged*: %s\n*Rule Violated*: %s\n*Similar PR*: %s\n*Confidence*: %d%%",
                    f.getAgent(),
                    f.getDescription(),
                    f.getSeverity().toUpperCase(),
                    f.getRecommendation(),
                    f.getWhyFlagged() != null ? f.getWhyFlagged() : "Violates general repository conventions.",
                    f.getRuleViolated() != null ? f.getRuleViolated() : "Standard repository guideline.",
                    f.getSimilarPr() != null ? f.getSimilarPr() : "None identified.",
                    (int) ((f.getConfidence() != null ? f.getConfidence() : 0.85) * 100)
                );
                comment.put("body", commentBody);
                comments.add(comment);
            }
            
            if (!comments.isEmpty()) {
                body.put("comments", comments);
            }

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            RestTemplate restTemplate = new RestTemplate();
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            
            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Successfully posted review comments to GitHub PR #{} for {}", prNumber, repoFullName);
            } else {
                log.error("Failed to post comments to GitHub, status: {}, response: {}", response.getStatusCode(), response.getBody());
            }
        } catch (Exception e) {
            log.error("Error posting PR review comments to GitHub: {}", e.getMessage(), e);
        }
    }
}
