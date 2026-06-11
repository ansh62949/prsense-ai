package com.prsense.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "repository_snapshots")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RepositorySnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "repository_id", nullable = false)
    private Repository repository;

    private String commitSha;

    private String primaryLanguage;
    private String frameworks;
    private String databaseUsed;
    private String buildTool;
    private Integer controllersCount;
    private Integer servicesCount;
    private Integer repositoriesCount;
    private Integer testCount;
    private String architectureStyle;
    
    @Column(columnDefinition = "TEXT")
    private String securityRules;
    
    @Column(columnDefinition = "TEXT")
    private String codingStandards;
    
    @Column(columnDefinition = "TEXT")
    private String dependencyGraph;
    
    private Double repositoryHealthScore;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
