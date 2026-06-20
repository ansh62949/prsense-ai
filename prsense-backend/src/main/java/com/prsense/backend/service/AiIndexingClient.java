package com.prsense.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class AiIndexingClient {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${ai.service.url:http://localhost:8000}")
    private String aiServiceUrl;

    public Map<String, Object> indexRepository(Long repositoryId, String fullName, String organizationId, String latestCommitSha) {
        log.info("Sending direct HTTP indexing request to FastAPI for repo ID: {} ({})", repositoryId, fullName);
        String url = aiServiceUrl + "/api/index/repository";

        Map<String, Object> request = new HashMap<>();
        request.put("repositoryId", repositoryId);
        request.put("fullName", fullName);
        request.put("organizationId", organizationId);
        request.put("latestCommitSha", latestCommitSha);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return (Map<String, Object>) response.getBody();
            }
        } catch (Exception e) {
            log.error("HTTP call to FastAPI indexing endpoint failed for repo {}: {}", fullName, e.getMessage(), e);
        }
        return Map.of("success", false, "error", "FastAPI connection failed or timed out");
    }

    public Map<String, Object> runReview(Long reviewId, String repoFullName, String prTitle, String prDiff, String organizationId, String commitSha) {
        log.info("Sending direct HTTP review request to FastAPI for review ID: {}", reviewId);
        String url = aiServiceUrl + "/api/review/run";

        Map<String, Object> request = new HashMap<>();
        request.put("review_id", reviewId);
        request.put("repo_full_name", repoFullName);
        request.put("pr_title", prTitle);
        request.put("pr_diff", prDiff);
        request.put("organization_id", organizationId);
        request.put("commit_sha", commitSha);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return (Map<String, Object>) response.getBody();
            }
        } catch (Exception e) {
            log.error("HTTP call to FastAPI review endpoint failed for review {}: {}", reviewId, e.getMessage(), e);
        }
        return Map.of("success", false, "error", "FastAPI review call failed");
    }

    public Map<String, Object> runLearner(String repoFullName, String prTitle, String prDiff, String organizationId) {
        log.info("Sending direct HTTP learner request to FastAPI for repo: {}", repoFullName);
        String url = aiServiceUrl + "/api/learner/run";

        Map<String, Object> request = new HashMap<>();
        request.put("repo_full_name", repoFullName);
        request.put("pr_title", prTitle);
        request.put("pr_diff", prDiff);
        request.put("organization_id", organizationId);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return (Map<String, Object>) response.getBody();
            }
        } catch (Exception e) {
            log.error("HTTP call to FastAPI learner endpoint failed for repo {}: {}", repoFullName, e.getMessage(), e);
        }
        return Map.of("success", false, "error", "FastAPI learner call failed");
    }
}
