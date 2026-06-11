package com.prsense.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RepositoryResponse {
    private Long id;
    private String name;
    private String fullName;
    private String description;
    private String url;
    private String owner;
    private Long installationId;
    private Boolean isPrivate;
    private String defaultBranch;
    private Integer stars;
    private Integer forks;
    private LocalDateTime syncedAt;
    private String syncStatus; // "pending", "syncing", "completed", "failed"
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
