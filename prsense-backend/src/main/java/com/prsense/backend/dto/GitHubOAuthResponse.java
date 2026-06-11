package com.prsense.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GitHubOAuthResponse {
    private String access_token;
    private String token_type;
    private String scope;
    private Long expires_in;
    private String refresh_token;
    private Long refresh_token_expires_in;
}
