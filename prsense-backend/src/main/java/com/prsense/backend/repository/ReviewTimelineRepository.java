package com.prsense.backend.repository;

import com.prsense.backend.entity.ReviewTimeline;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewTimelineRepository extends JpaRepository<ReviewTimeline, Long> {
    List<ReviewTimeline> findByReviewIdOrderByCreatedAtAsc(Long reviewId);
}
