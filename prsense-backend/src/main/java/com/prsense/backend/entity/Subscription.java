package com.prsense.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "subscriptions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Subscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false, unique = true)
    private Organization organization;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Plan plan;

    @Column(nullable = false)
    private String status; // e.g. "active", "canceled", "past_due"

    @Column(nullable = false)
    private LocalDateTime currentPeriodStart;

    @Column(nullable = false)
    private LocalDateTime currentPeriodEnd;

    public enum Plan {
        FREE, PRO, TEAM, ENTERPRISE
    }
}
