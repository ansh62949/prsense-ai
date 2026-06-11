package com.prsense.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class CeleryProducerService {

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public void publishReviewTask(Long reviewId, String repoFullName, String prTitle, String prDiff) {
        publishReviewTask(reviewId, repoFullName, prTitle, prDiff, null, null);
    }

    public void publishReviewTask(Long reviewId, String repoFullName, String prTitle, String prDiff, String organizationId, String commitSha) {
        log.info("Queueing Celery review task for review ID: {} in repo: {}", reviewId, repoFullName);
        
        Map<String, Object> payload = new HashMap<>();
        payload.put("review_id", reviewId);
        payload.put("repo_full_name", repoFullName);
        payload.put("pr_title", prTitle);
        payload.put("pr_diff", prDiff);
        payload.put("organization_id", organizationId);
        payload.put("commit_sha", commitSha);
        
        List<Object> args = Arrays.asList("review", payload);
        publishTask("celery_worker.handle_event", args);
    }

    public void publishLearnerTask(String repoFullName, String prTitle, String prDiff) {
        publishLearnerTask(repoFullName, prTitle, prDiff, null);
    }

    public void publishLearnerTask(String repoFullName, String prTitle, String prDiff, String organizationId) {
        log.info("Queueing Celery learner task for repo: {}", repoFullName);
        
        Map<String, Object> payload = new HashMap<>();
        payload.put("repo_full_name", repoFullName);
        payload.put("pr_title", prTitle);
        payload.put("pr_diff", prDiff);
        payload.put("organization_id", organizationId);
        
        List<Object> args = Arrays.asList("learner", payload);
        publishTask("celery_worker.handle_event", args);
    }

    public void publishIndexingTask(Long repoId, String repoFullName) {
        publishIndexingTask(repoId, repoFullName, null, null);
    }

    public void publishIndexingTask(Long repoId, String repoFullName, String organizationId, String commitSha) {
        log.info("Queueing Celery repository indexing task for repo ID: {} (fullName: {})", repoId, repoFullName);
        
        Map<String, Object> payload = new HashMap<>();
        payload.put("repo_id", repoId);
        payload.put("repo_full_name", repoFullName);
        payload.put("organization_id", organizationId);
        payload.put("commit_sha", commitSha);
        
        List<Object> args = Arrays.asList("index", payload);
        publishTask("celery_worker.handle_event", args);
    }

    private void publishTask(String taskName, List<Object> args) {
        try {
            String uuid = UUID.randomUUID().toString();
            
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("callbacks", null);
            metadata.put("errbacks", null);
            metadata.put("chain", null);
            metadata.put("chord", null);

            // Celery body is [[args], {kwargs}, {embed_metadata}]
            List<Object> bodyList = Arrays.asList(
                    args,
                    new HashMap<>(),
                    metadata
            );
            
            String bodyJson = objectMapper.writeValueAsString(bodyList);
            String bodyBase64 = Base64.getEncoder().encodeToString(bodyJson.getBytes(StandardCharsets.UTF_8));
            
            Map<String, Object> envelope = new HashMap<>();
            envelope.put("body", bodyBase64);
            envelope.put("content-encoding", "utf-8");
            envelope.put("content-type", "application/json");
            
            Map<String, Object> headers = new HashMap<>();
            headers.put("lang", "py");
            headers.put("task", taskName);
            headers.put("id", uuid);
            headers.put("root_id", uuid);
            envelope.put("headers", headers);
            
            Map<String, Object> properties = new HashMap<>();
            properties.put("correlation_id", uuid);
            properties.put("delivery_mode", 2);
            properties.put("delivery_tag", UUID.randomUUID().toString());
            properties.put("body_encoding", "base64");
            properties.put("delivery_info", Map.of(
                    "exchange", "",
                    "routing_key", "celery"
            ));
            envelope.put("properties", properties);
            
            String envelopeJson = objectMapper.writeValueAsString(envelope);
            redisTemplate.opsForList().rightPush("celery", envelopeJson);
            
            log.info("Celery task '{}' successfully pushed to Redis list 'celery'. ID: {}", taskName, uuid);
        } catch (Exception e) {
            log.error("Failed to serialize and publish Celery task", e);
        }
    }
}
