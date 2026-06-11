package com.prsense.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "review_timelines",
    indexes = {
        @Index(name = "idx_review_timelines_review_id", columnList = "review_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewTimeline {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "review_id", nullable = false)
    private Review review;

    @Column(nullable = false)
    private String stepName;

    @Column(nullable = false)
    private Integer durationMs;

    @Column(nullable = false)
    private Integer tokenUsage;

    @Column(nullable = false)
    private Double cost;

    @Column(nullable = false)
    private String status; // COMPLETED, FAILED, IN_PROGRESS

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
