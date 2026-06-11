package com.prsense.backend.repository;

import com.prsense.backend.entity.RepositorySnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RepositorySnapshotRepository extends JpaRepository<RepositorySnapshot, Long> {
    java.util.List<RepositorySnapshot> findByRepositoryId(Long repositoryId);
    Optional<RepositorySnapshot> findByRepositoryIdAndCommitSha(Long repositoryId, String commitSha);
}
