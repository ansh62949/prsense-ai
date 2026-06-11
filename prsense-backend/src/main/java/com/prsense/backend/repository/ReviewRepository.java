package com.prsense.backend.repository;

import com.prsense.backend.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    Review findByPullRequestId(Long pullRequestId);
}
