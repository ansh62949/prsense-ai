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

                    Long repoId = updated.getId();
                    String repoFullName = updated.getFullName();
                    String orgId = updated.getOrganizationId();
                    String commitSha = updated.getLatestCommitSha();
                    
                    java.util.concurrent.CompletableFuture.runAsync(() -> {
                        try {
                            long startTime = System.currentTimeMillis();
                            Map<String, Object> result = aiIndexingClient.indexRepository(
                                    repoId,
                                    repoFullName,
                                    orgId,
                                    commitSha
                            );
                            
                            Repository currentRepo = repositoryService.getRepositoryById(repoId).orElse(null);
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
                            log.error("Failed to run async repository indexing for repo {}", repoFullName, e);
                            repositoryService.getRepositoryById(repoId).ifPresent(r -> {
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
        log.info("Snapshots found in database for repository ID {}: {}", id, snapshots.size());
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
