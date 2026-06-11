package com.prsense.backend.controller;

import com.prsense.backend.dto.AuthResponse;
import com.prsense.backend.dto.GitHubOAuthCallbackRequest;
import com.prsense.backend.dto.LoginRequest;
import com.prsense.backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService service;

    @Value("${github.oauth.client-id}")
    private String githubClientId;

    @Value("${github.oauth.redirect-uri}")
    private String githubRedirectUri;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> authenticate(
            @RequestBody LoginRequest request
    ) {
        return ResponseEntity.ok(service.authenticate(request));
    }

    @GetMapping("/github/login-url")
    public ResponseEntity<Map<String, String>> getGitHubLoginUrl() {
        String state = UUID.randomUUID().toString();
        String authUrl = String.format(
            "https://github.com/login/oauth/authorize?client_id=%s&redirect_uri=%s&scope=repo,user&state=%s",
            githubClientId,
            githubRedirectUri,
            state
        );
        
        Map<String, String> response = new HashMap<>();
        response.put("authUrl", authUrl);
        response.put("state", state);
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/github/callback")
    public ResponseEntity<AuthResponse> handleGitHubCallback(
            @RequestBody GitHubOAuthCallbackRequest request
    ) {
        AuthResponse authResponse = service.authenticateWithGitHubCode(request.getCode());
        return ResponseEntity.ok(authResponse);
    }
}
