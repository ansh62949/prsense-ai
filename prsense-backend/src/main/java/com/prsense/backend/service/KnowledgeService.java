package com.prsense.backend.service;

import com.prsense.backend.entity.KnowledgeDocument;
import com.prsense.backend.entity.Repository;
import com.prsense.backend.repository.KnowledgeDocumentRepository;
import com.prsense.backend.repository.RepositoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class KnowledgeService {

    private final KnowledgeDocumentRepository knowledgeDocumentRepository;
    private final RepositoryRepository repositoryRepository;
    
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${ai.service.url:http://127.0.0.1:8000}")
    private String aiServiceUrl;

    @Transactional
    public boolean ingestDocument(String repoFullName, String title, String content, String contentType, String sourceUrl) {
        log.info("Ingesting document '{}' for repository '{}' of type '{}'", title, repoFullName, contentType);
        
        Optional<Repository> repoOpt = repositoryRepository.findByFullName(repoFullName);
        if (repoOpt.isEmpty()) {
            log.warn("Repository '{}' not found. Cannot associate knowledge document.", repoFullName);
            return false;
        }
        
        Repository repo = repoOpt.get();

        // 1. Call FastAPI vector ingestion
        String ingestUrl = aiServiceUrl + "/api/rag/ingest";
        Map<String, Object> request = new HashMap<>();
        request.put("title", title);
        request.put("content", content);
        request.put("content_type", contentType);
        request.put("repo_name", repoFullName);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(ingestUrl, request, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                boolean success = Boolean.TRUE.equals(body.get("success"));
                
                if (success) {
                    // 2. Save KnowledgeDocument entity locally in PostgreSQL
                    KnowledgeDocument doc = KnowledgeDocument.builder()
                            .repository(repo)
                            .title(title)
                            .sourceUrl(sourceUrl != null ? sourceUrl : "manual")
                            .documentType(contentType.toUpperCase())
                            .vectorDbId(body.get("chunks_created").toString())
                            .build();
                    
                    knowledgeDocumentRepository.save(doc);
                    log.info("Successfully ingested and saved knowledge document: {}", title);
                    return true;
                }
            }
        } catch (Exception e) {
            log.error("Failed to call FastAPI ingestion endpoint: {}", e.getMessage(), e);
        }
        
        return false;
    }

    public Map<String, Object> queryRag(String repoFullName, String query, String contentType, Integer topK) {
        log.info("Querying RAG for repository '{}' with query '{}'", repoFullName, query);
        String searchUrl = aiServiceUrl + "/api/rag/search";
        
        Map<String, Object> request = new HashMap<>();
        request.put("query", query);
        request.put("repo_name", repoFullName);
        request.put("content_type", contentType);
        request.put("top_k", topK != null ? topK : 5);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(searchUrl, request, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
        } catch (Exception e) {
            log.error("Failed to query RAG search endpoint: {}", e.getMessage(), e);
        }
        
        return Map.of("query", query, "context_block", "Failed to retrieve RAG context", "documents", List.of());
    }

    public Map<String, Object> askRepository(String repoFullName, String query) {
        log.info("Asking repository '{}' question: {}", repoFullName, query);
        String askUrl = aiServiceUrl + "/api/repository/ask";
        
        Map<String, Object> request = new HashMap<>();
        request.put("query", query);
        request.put("repo_name", repoFullName);
        request.put("top_k", 5);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(askUrl, request, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
        } catch (Exception e) {
            log.error("Failed to call FastAPI Ask Repository endpoint: {}", e.getMessage(), e);
        }
        
        return Map.of("answer", "An error occurred while compiling answers from the repository copilot.", "reasoning", "HTTP call to FastAPI service failed.", "retrieved_documents", List.of());
    }

    public Map<String, Object> generateRepositoryIntelligence(String repoFullName, String readme, String architecture, String standards) {
        log.info("Generating repository intelligence profiles for '{}'", repoFullName);
        String profileUrl = aiServiceUrl + "/api/repository/profile";
        
        Map<String, Object> request = new HashMap<>();
        request.put("repo_name", repoFullName);
        request.put("readme_content", readme);
        request.put("architecture_content", architecture);
        request.put("standards_content", standards);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(profileUrl, request, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
        } catch (Exception e) {
            log.error("Failed to call FastAPI repository intelligence profile endpoint: {}", e.getMessage(), e);
        }
        
        return Map.of("success", false, "message", "HTTP call to FastAPI intelligence layer failed.", "profiles_created", 0);
    }

    public Map<String, Object> getRepositorySummary(String repoFullName) {
        log.info("Retrieving repository summary from AI service for '{}'", repoFullName);
        String summaryUrl = aiServiceUrl + "/api/repository/summary?repo_name=" + repoFullName;

        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(summaryUrl, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
        } catch (Exception e) {
            log.error("Failed to call FastAPI repository summarizer endpoint: {}", e.getMessage(), e);
        }
        
        return Map.of(
            "repo_name", repoFullName,
            "summary", "Overview summary is currently offline.",
            "technology_stack", List.of(),
            "architecture_patterns", List.of(),
            "coding_conventions", List.of()
        );
    }
}
