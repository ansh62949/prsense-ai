package com.prsense.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "review_findings",
    indexes = {
        @Index(name = "idx_review_findings_review_id", columnList = "review_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ReviewFinding {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "review_id", nullable = false)
    @JsonIgnore
    private Review review;

    @Column(nullable = false)
    private String agent; // e.g. "Security Agent"

    @Column(nullable = false)
    private String category; // e.g. "security", "style"

    @Column(nullable = false)
    private String severity; // e.g. "high", "medium"

    private String filePath;
    private String lineReference;
    private Integer lineNumber;

    @Column(columnDefinition = "TEXT")
    private String recommendation;

    private Double confidence;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    // Review Explanation Engine
    @Column(columnDefinition = "TEXT")
    private String whyFlagged;

    private String ruleViolated;
    private String similarPr;

    private String status; // SUGGESTED, ACCEPTED, REJECTED, DISMISSED

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) {
            status = "SUGGESTED";
        }
    }
}
