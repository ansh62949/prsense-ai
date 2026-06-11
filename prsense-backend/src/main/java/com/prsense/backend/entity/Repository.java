package com.prsense.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "repositories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Repository {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String fullName; // e.g. "acme-corp/backend-api"

    @Column(nullable = false)
    private String name; // e.g. "backend-api"

    @Column(nullable = false)
    private Long installationId; // GitHub App installation ID

    @Column(nullable = true)
    private String owner; // GitHub owner/org name

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id")
    private Workspace workspace;

    private String organizationId;
    private String latestCommitSha;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String url; // GitHub URL
    private Boolean isPrivate;
    private String defaultBranch;

    private String language;
    private String webhookStatus; // e.g. "healthy", "failed"

    // Real GitHub Integration Metadata
    private String avatarUrl;
    private Integer stars;
    private Integer forks;
    
    @Column(columnDefinition = "TEXT")
    private String languageBreakdown; // e.g. '{"Java": 70, "HTML": 20, "CSS": 10}'
    
    private Integer contributors;
    private Integer branchCount;
    private Integer openPrCount;

    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    private LocalDateTime lastSyncAt;
    private LocalDateTime updatedAt;

    private String syncStatus; // "pending", "syncing", "completed", "failed"

    private String indexingStatus; // e.g. "PENDING", "INDEXING", "INDEXED", "FAILED"
    private Integer filesIndexed;
    private Integer embeddingsGenerated;
    private Long indexingDurationMs;
    
    @Column(columnDefinition = "TEXT")
    private String indexingError;
    
    private Integer indexingProgress;
    private LocalDateTime lastIndexedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        lastSyncAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
