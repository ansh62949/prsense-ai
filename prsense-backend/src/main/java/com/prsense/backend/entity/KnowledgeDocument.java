package com.prsense.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "knowledge_documents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KnowledgeDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "repository_id", nullable = false)
    private Repository repository;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String sourceUrl; // GitHub URL or Wiki link

    @Column(nullable = false)
    private String documentType; // GUIDELINE, ARCHITECTURE, PAST_PR

    @Column(nullable = false)
    private String vectorDbId; // ID reference in the Vector DB (e.g. pgvector/Chroma)

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
