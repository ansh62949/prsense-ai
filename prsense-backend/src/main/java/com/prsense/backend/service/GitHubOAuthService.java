package com.prsense.backend.service;

import com.prsense.backend.dto.GitHubOAuthResponse;
import com.prsense.backend.dto.GitHubUserInfo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
@Slf4j
public class GitHubOAuthService {

    @Value("${github.oauth.client-id}")
    private String clientId;

    @Value("${github.oauth.client-secret}")
    private String clientSecret;

    private final RestTemplate restTemplate;

    public GitHubOAuthResponse exchangeCodeForToken(String code) {
        String url = "https://github.com/login/oauth/access_token";
        
        HttpHeaders headers = new HttpHeaders();
        headers.set("Accept", "application/json");
        
        String body = String.format(
            "client_id=%s&client_secret=%s&code=%s",
            clientId, clientSecret, code
        );
        
        HttpEntity<String> request = new HttpEntity<>(body, headers);
        
        try {
            ResponseEntity<GitHubOAuthResponse> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                request,
                GitHubOAuthResponse.class
            );
            
            log.info("Successfully exchanged GitHub OAuth code for token");
            return response.getBody();
        } catch (Exception e) {
            log.error("Error exchanging GitHub OAuth code: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to exchange GitHub OAuth code", e);
        }
    }

    public GitHubUserInfo fetchUserInfo(String accessToken) {
        String url = "https://api.github.com/user";
        
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + accessToken);
        headers.set("Accept", "application/vnd.github.v3+json");
        
        HttpEntity<Void> request = new HttpEntity<>(headers);
        
        try {
            ResponseEntity<GitHubUserInfo> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                request,
                GitHubUserInfo.class
            );
            
            log.info("Successfully fetched GitHub user info for user: {}", response.getBody().getLogin());
            return response.getBody();
        } catch (Exception e) {
            log.error("Error fetching GitHub user info: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to fetch GitHub user info", e);
        }
    }
}
