package com.prsense.backend.repository;

import com.prsense.backend.entity.Repository;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface RepositoryRepository extends JpaRepository<Repository, Long> {
    Optional<Repository> findByFullName(String fullName);
}
