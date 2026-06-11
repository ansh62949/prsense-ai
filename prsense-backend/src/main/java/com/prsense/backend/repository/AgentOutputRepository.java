package com.prsense.backend.repository;

import com.prsense.backend.entity.AgentOutput;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AgentOutputRepository extends JpaRepository<AgentOutput, Long> {
    List<AgentOutput> findByReviewIdOrderByCreatedAtAsc(Long reviewId);
}
