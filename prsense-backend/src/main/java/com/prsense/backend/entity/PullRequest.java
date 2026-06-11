package com.prsense.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "pull_requests",
    indexes = {
        @Index(name = "idx_pull_requests_repository_id", columnList = "repository_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class PullRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "repository_id", nullable = false)
    private Repository repository;

    @Column(nullable = false)
    private Long githubPrId; // ID from GitHub

    @Column(nullable = false)
    private Integer prNumber;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String author; // GitHub username

    @Column(nullable = false)
    private String status; // OPEN, CLOSED, MERGED

    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(nullable = false)
    private String headSha;

    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
