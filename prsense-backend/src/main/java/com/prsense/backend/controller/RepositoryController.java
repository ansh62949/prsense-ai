package com.prsense.backend.controller;

import com.prsense.backend.dto.RepositoryConnectRequest;
import com.prsense.backend.dto.RepositoryResponse;
import com.prsense.backend.entity.Repository;
import com.prsense.backend.entity.RepositorySnapshot;
import com.prsense.backend.entity.User;
import com.prsense.backend.entity.KnowledgeDocument;
import com.prsense.backend.repository.KnowledgeDocumentRepository;
import com.prsense.backend.repository.RepositorySnapshotRepository;
import com.prsense.backend.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/repositories")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class RepositoryController {

    private final RepositoryService repositoryService;
    private final KnowledgeService knowledgeService;
    private final AiIndexingClient aiIndexingClient;
    private final RepositorySnapshotRepository snapshotRepository;
    private final KnowledgeDocumentRepository knowledgeDocumentRepository;
    private final GitHubOAuthService gitHubOAuthService;
    private final GitHubRepositoryService gitHubRepositoryService;

    @GetMapping
    public ResponseEntity<List<Repository>> getAllRepositories() {
        return ResponseEntity.ok(repositoryService.getAllRepositories());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Repository> getRepositoryById(@PathVariable Long id) {
        return repositoryService.getRepositoryById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/connect")
    public ResponseEntity<RepositoryResponse> connectRepository(
            @RequestBody RepositoryConnectRequest request,
            Authentication authentication
    ) {
        try {
            User user = (User) authentication.getPrincipal();
            
            if (user.getGithubAccessToken() == null) {
                return ResponseEntity.badRequest().build(); // User not authenticated with GitHub
            }
            
            // Fetch repository details from GitHub
            Map<String, Object> repoDetails = gitHubRepositoryService.fetchRepositoryDetails(
                request.getOwner(),
                request.getRepo(),
                user.getGithubAccessToken()
            );
            
            String normalizedFullName = RepositoryService.normalizeRepoFullName((String) repoDetails.get("fullName"));
            // Create or update repository
            Repository repo = repositoryService.getRepositoryByFullName(normalizedFullName)
                .orElseGet(() -> new Repository());
            
            repo.setName((String) repoDetails.get("name"));
            repo.setFullName(normalizedFullName);
            repo.setDescription((String) repoDetails.get("description"));
            repo.setUrl((String) repoDetails.get("url"));
            repo.setOwner((String) repoDetails.get("owner"));
            repo.setIsPrivate((Boolean) repoDetails.get("isPrivate"));
            repo.setDefaultBranch((String) repoDetails.get("defaultBranch"));
            repo.setStars((Integer) repoDetails.get("stars"));
            repo.setForks((Integer) repoDetails.get("forks"));
            repo.setLanguage((String) repoDetails.get("language"));
            repo.setInstallationId(request.getInstallationId() != null ? request.getInstallationId() : 0L);
            repo.setSyncStatus("completed");
            repo.setLastSyncAt(LocalDateTime.now());
            
            Repository saved = repositoryService.saveRepository(repo);
            
            log.info("Successfully connected repository: {}", saved.getFullName());
            
            return ResponseEntity.ok(mapToResponse(saved));
        } catch (Exception e) {
            log.error("Error connecting repository: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/user/repositories")
    public ResponseEntity<Map<String, Object>> getUserRepositories(
            Authentication authentication
    ) {
        try {
            User user = (User) authentication.getPrincipal();
            
            if (user.getGithubAccessToken() == null) {
                return ResponseEntity.badRequest().build();
            }
            
            Map<String, Object> repos = gitHubRepositoryService.fetchUserRepositories(
                user.getGithubAccessToken(),
                1,
                50
            );
            
            return ResponseEntity.ok(repos);
        } catch (Exception e) {
            log.error("Error fetching user repositories: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/sync")
    public ResponseEntity<Repository> syncRepository(@RequestBody Map<String, String> body) {
        String fullName = RepositoryService.normalizeRepoFullName(body.get("fullName"));
        String name = body.get("name");
        String language = body.get("language");
        Long installationId = 123456L; // Default mock installation ID
        
        Repository repo = repositoryService.registerOrUpdateRepository(fullName, name, installationId, language);
        return ResponseEntity.ok(repo);
    }

    @GetMapping("/{id}/summary")
    public ResponseEntity<Map<String, Object>> getRepositorySummary(@PathVariable Long id) {
        return repositoryService.getRepositoryById(id)
                .map(repo -> ResponseEntity.ok(knowledgeService.getRepositorySummary(repo.getFullName())))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/profile")
    public ResponseEntity<Map<String, Object>> generateRepositoryProfile(
            @PathVariable Long id,
            @RequestBody Map<String, String> body
    ) {
        return repositoryService.getRepositoryById(id)
                .map(repo -> {
                    String readme = body.get("readme");
                    String architecture = body.get("architecture");
                    String standards = body.get("standards");
                    
                    Map<String, Object> result = knowledgeService.generateRepositoryIntelligence(
                            repo.getFullName(), readme, architecture, standards
                    );
                    return ResponseEntity.ok(result);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/index")
    public ResponseEntity<Repository> triggerIndexing(@PathVariable Long id) {
        return repositoryService.getRepositoryById(id)
                .map(repo -> {
                    if ("INDEXING".equals(repo.getIndexingStatus())) {
                        log.info("Repository {} is already indexing, skipping re-indexing trigger", repo.getFullName());
                        return ResponseEntity.ok(repo);
                    }
                    
                    repo.setIndexingStatus("INDEXING");
                    repo.setIndexingProgress(0);
                    repo.setIndexingError(null);
                    Repository updated = repositoryService.saveRepository(repo);
                    
                    java.util.concurrent.CompletableFuture.runAsync(() -> {
                        try {
                            long startTime = System.currentTimeMillis();
                            Map<String, Object> result = aiIndexingClient.indexRepository(
                                    updated.getId(),
                                    updated.getFullName(),
                                    updated.getOrganizationId(),
                                    updated.getLatestCommitSha()
                            );
                            
                            Repository currentRepo = repositoryService.getRepositoryById(updated.getId()).orElse(null);
                            if (currentRepo != null) {
                                boolean success = Boolean.TRUE.equals(result.get("success"));
                                if (success) {
                                    log.info("Repository {} indexing successfully queued in AI service", currentRepo.getFullName());
                                } else {
                                    currentRepo.setIndexingStatus("FAILED");
                                    currentRepo.setIndexingError((String) result.getOrDefault("error", "Indexing failed"));
                                    repositoryService.saveRepository(currentRepo);
                                }
                            }
                        } catch (Exception e) {
                            log.error("Failed to run async repository indexing for repo {}", updated.getFullName(), e);
                            repositoryService.getRepositoryById(updated.getId()).ifPresent(r -> {
                                r.setIndexingStatus("FAILED");
                                r.setIndexingError(e.getMessage());
                                repositoryService.saveRepository(r);
                            });
                        }
                    });
                    
                    return ResponseEntity.ok(updated);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/snapshot")
    public ResponseEntity<RepositorySnapshot> getRepositorySnapshot(@PathVariable Long id) {
        List<RepositorySnapshot> snapshots = snapshotRepository.findByRepositoryId(id);
        if (snapshots.isEmpty()) {
            repositoryService.resetIndexingStatus(id);
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(snapshots.get(snapshots.size() - 1));
    }

    @GetMapping("/{id}/files")
    public ResponseEntity<List<Map<String, Object>>> getRepositoryFiles(@PathVariable Long id) {
        List<KnowledgeDocument> docs = knowledgeDocumentRepository.findByRepositoryId(id);
        List<Map<String, Object>> files = docs.stream()
                .map(doc -> Map.<String, Object>of(
                        "id", doc.getId(),
                        "title", doc.getTitle(),
                        "documentType", doc.getDocumentType(),
                        "sourceUrl", doc.getSourceUrl()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(files);
    }

    @GetMapping("/{id}/sync-status")
    public ResponseEntity<Map<String, Object>> getRepositorySyncStatus(@PathVariable Long id) {
        return repositoryService.getRepositoryById(id)
                .map(repo -> {
                    Map<String, Object> status = Map.<String, Object>of(
                        "id", repo.getId(),
                        "fullName", repo.getFullName(),
                        "syncStatus", repo.getSyncStatus() != null ? repo.getSyncStatus() : "pending",
                        "indexingStatus", repo.getIndexingStatus() != null ? repo.getIndexingStatus() : "PENDING",
                        "indexingProgress", repo.getIndexingProgress() != null ? repo.getIndexingProgress() : 0,
                        "filesIndexed", repo.getFilesIndexed() != null ? repo.getFilesIndexed() : 0,
                        "lastSyncAt", repo.getLastSyncAt(),
                        "lastIndexedAt", repo.getLastIndexedAt()
                    );
                    return ResponseEntity.ok(status);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    private RepositoryResponse mapToResponse(Repository repo) {
        return RepositoryResponse.builder()
                .id(repo.getId())
                .name(repo.getName())
                .fullName(repo.getFullName())
                .description(repo.getDescription())
                .url(repo.getUrl())
                .owner(repo.getOwner())
                .installationId(repo.getInstallationId())
                .isPrivate(repo.getIsPrivate())
                .defaultBranch(repo.getDefaultBranch())
                .stars(repo.getStars())
                .forks(repo.getForks())
                .syncedAt(repo.getLastSyncAt())
                .syncStatus(repo.getSyncStatus() != null ? repo.getSyncStatus() : "pending")
                .createdAt(repo.getCreatedAt())
                .updatedAt(repo.getUpdatedAt())
                .build();
    }
}
