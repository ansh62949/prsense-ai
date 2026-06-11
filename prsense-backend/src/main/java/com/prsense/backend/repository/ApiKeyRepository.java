package com.prsense.backend.repository;

import com.prsense.backend.entity.ApiKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApiKeyRepository extends JpaRepository<ApiKey, Long> {
    Optional<ApiKey> findByToken(String token);
    List<ApiKey> findByOrganizationId(Long organizationId);
}
