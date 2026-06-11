package com.prsense.backend.repository;

import com.prsense.backend.entity.LearnedPattern;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LearnedPatternRepository extends JpaRepository<LearnedPattern, Long> {
    List<LearnedPattern> findByRepositoryId(Long repositoryId);
}
