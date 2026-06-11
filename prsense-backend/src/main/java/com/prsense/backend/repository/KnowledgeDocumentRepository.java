package com.prsense.backend.repository;

import com.prsense.backend.entity.KnowledgeDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface KnowledgeDocumentRepository extends JpaRepository<KnowledgeDocument, Long> {
    List<KnowledgeDocument> findByRepositoryId(Long repositoryId);
}
