package com.prsense.backend.service;

import com.prsense.backend.config.JwtService;
import com.prsense.backend.dto.AuthResponse;
import com.prsense.backend.dto.GitHubOAuthResponse;
import com.prsense.backend.dto.GitHubUserInfo;
import com.prsense.backend.dto.LoginRequest;
import com.prsense.backend.entity.User;
import com.prsense.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final GitHubOAuthService gitHubOAuthService;

    public AuthResponse authenticate(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );
        var user = repository.findByEmail(request.getEmail())
                .orElseThrow();
        var jwtToken = jwtService.generateToken(user);
        return AuthResponse.builder()
                .token(jwtToken)
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }

    public AuthResponse authenticateWithGitHubCode(String code) {
        log.info("Starting GitHub OAuth authentication with code");

        // Step 1: Exchange code for token
        GitHubOAuthResponse oauthResponse = gitHubOAuthService.exchangeCodeForToken(code);
        String accessToken = oauthResponse.getAccess_token();

        // Step 2: Fetch GitHub user info
        GitHubUserInfo githubUser = gitHubOAuthService.fetchUserInfo(accessToken);

        // Step 3: Find or create user
        Optional<User> existingUser = repository.findByGithubUsername(githubUser.getLogin());
        
        User user;
        if (existingUser.isPresent()) {
            user = existingUser.get();
            log.info("Found existing GitHub user: {}", githubUser.getLogin());
            // Update OAuth tokens
            user.setGithubAccessToken(accessToken);
            user.setGithubRefreshToken(oauthResponse.getRefresh_token());
            if (oauthResponse.getExpires_in() != null) {
                user.setGithubTokenExpiresAt(
                    LocalDateTime.now().plusSeconds(oauthResponse.getExpires_in())
                );
            }
            user.setOauthProvider("github");
            user.setUpdatedAt(LocalDateTime.now());
        } else {
            log.info("Creating new GitHub user: {}", githubUser.getLogin());
            user = User.builder()
                    .email(githubUser.getEmail() != null ? githubUser.getEmail() : githubUser.getLogin() + "@github.com")
                    .githubUsername(githubUser.getLogin())
                    .password(passwordEncoder.encode(System.nanoTime() + ""))  // Random password for OAuth users
                    .githubAccessToken(accessToken)
                    .githubRefreshToken(oauthResponse.getRefresh_token())
                    .oauthProvider("github")
                    .role(User.Role.USER)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            
            if (oauthResponse.getExpires_in() != null) {
                user.setGithubTokenExpiresAt(
                    LocalDateTime.now().plusSeconds(oauthResponse.getExpires_in())
                );
            }
        }
        
        // Step 4: Save user
        user = repository.save(user);
        
        // Step 5: Generate JWT token
        var jwtToken = jwtService.generateToken(user);
        
        return AuthResponse.builder()
                .token(jwtToken)
                .email(user.getEmail())
                .role(user.getRole().name())
                .githubUsername(user.getGithubUsername())
                .build();
    }
}
