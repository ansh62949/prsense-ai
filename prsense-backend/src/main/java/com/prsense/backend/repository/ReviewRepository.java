package com.prsense.backend.repository;

import com.prsense.backend.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    Review findByPullRequestId(Long pullRequestId);

    @Query("SELECT DISTINCT r FROM Review r LEFT JOIN FETCH r.findings LEFT JOIN FETCH r.pullRequest pr LEFT JOIN FETCH pr.repository")
    List<Review> findAllWithDetails();
}
