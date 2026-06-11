package com.prsense.backend.controller;

import com.prsense.backend.entity.*;
import com.prsense.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/billing")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BillingController {

    private final SubscriptionRepository subscriptionRepository;
    private final UsageRecordRepository usageRecordRepository;
    private final OrganizationRepository organizationRepository;

    @GetMapping("/subscription/{orgId}")
    public ResponseEntity<Subscription> getSubscription(@PathVariable Long orgId) {
        Subscription sub = subscriptionRepository.findByOrganizationId(orgId)
                .orElseGet(() -> {
                    Organization org = organizationRepository.findById(orgId)
                            .orElseThrow(() -> new IllegalArgumentException("Org not found"));
                    Subscription newSub = Subscription.builder()
                            .organization(org)
                            .plan(Subscription.Plan.FREE)
                            .status("active")
                            .currentPeriodStart(LocalDateTime.now())
                            .currentPeriodEnd(LocalDateTime.now().plusMonths(1))
                            .build();
                    return subscriptionRepository.save(newSub);
                });
        return ResponseEntity.ok(sub);
    }

    @PostMapping("/subscription/{orgId}/upgrade")
    public ResponseEntity<Subscription> upgradePlan(
            @PathVariable Long orgId,
            @RequestBody Map<String, String> body
    ) {
        Subscription sub = subscriptionRepository.findByOrganizationId(orgId)
                .orElseThrow(() -> new IllegalArgumentException("Subscription not found"));
        
        Subscription.Plan newPlan = Subscription.Plan.valueOf(body.get("plan").toUpperCase());
        sub.setPlan(newPlan);
        sub.setCurrentPeriodStart(LocalDateTime.now());
        sub.setCurrentPeriodEnd(LocalDateTime.now().plusMonths(1));
        sub.setStatus("active");
        
        return ResponseEntity.ok(subscriptionRepository.save(sub));
    }

    @GetMapping("/usage/{orgId}")
    public ResponseEntity<Map<String, Object>> getUsageLimits(@PathVariable Long orgId) {
        Subscription sub = subscriptionRepository.findByOrganizationId(orgId)
                .orElseGet(() -> {
                    Organization org = organizationRepository.findById(orgId)
                            .orElseThrow(() -> new IllegalArgumentException("Org not found"));
                    Subscription newSub = Subscription.builder()
                            .organization(org)
                            .plan(Subscription.Plan.FREE)
                            .status("active")
                            .currentPeriodStart(LocalDateTime.now())
                            .currentPeriodEnd(LocalDateTime.now().plusMonths(1))
                            .build();
                    return subscriptionRepository.save(newSub);
                });
                
        List<UsageRecord> records = usageRecordRepository.findByOrganizationId(orgId);
        
        long totalReviews = records.stream()
                .filter(r -> "pr_reviews".equals(r.getMetricName()))
                .mapToLong(UsageRecord::getQuantity)
                .sum();
                
        long totalTokens = records.stream()
                .filter(r -> "tokens".equals(r.getMetricName()))
                .mapToLong(UsageRecord::getQuantity)
                .sum();
                
        long maxReviews = 5;
        long maxTokens = 100000;
        
        if (sub.getPlan() == Subscription.Plan.PRO) {
            maxReviews = 100;
            maxTokens = 5000000;
        } else if (sub.getPlan() == Subscription.Plan.TEAM || sub.getPlan() == Subscription.Plan.ENTERPRISE) {
            maxReviews = 10000;
            maxTokens = 500000000L;
        }
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("plan", sub.getPlan().name());
        stats.put("totalReviews", totalReviews);
        stats.put("maxReviews", maxReviews);
        stats.put("totalTokens", totalTokens);
        stats.put("maxTokens", maxTokens);
        stats.put("reviewsPercentage", Math.min(100.0, (double) totalReviews / maxReviews * 100.0));
        stats.put("tokensPercentage", Math.min(100.0, (double) totalTokens / maxTokens * 100.0));
        
        return ResponseEntity.ok(stats);
    }
}
