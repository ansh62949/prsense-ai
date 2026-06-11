package com.prsense.backend.repository;

import com.prsense.backend.entity.PullRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface PullRequestRepository extends JpaRepository<PullRequest, Long> {
    Optional<PullRequest> findByRepositoryIdAndPrNumber(Long repositoryId, Integer prNumber);
    List<PullRequest> findByRepositoryIdOrderByCreatedAtDesc(Long repositoryId);
}
