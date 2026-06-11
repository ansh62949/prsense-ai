package com.prsense.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(
    name = "reviews",
    indexes = {
        @Index(name = "idx_reviews_pull_request_id", columnList = "pull_request_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pull_request_id", nullable = false)
    private PullRequest pullRequest;

    @Column(nullable = false)
    private String status; // PENDING, IN_PROGRESS, COMPLETED, FAILED

    @Column(nullable = false)
    private String aiDecision; // APPROVED, CHANGES_REQUESTED, COMMENTED

    @Column(columnDefinition = "TEXT")
    private String summaryReport;

    private String organizationId;

    private Integer totalFindings;
    private Integer criticalFindings;
    
    private Double confidenceScore;
    
    private Long executionTimeMs;

    @OneToMany(mappedBy = "review", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ReviewFinding> findings;

    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    private LocalDateTime completedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
