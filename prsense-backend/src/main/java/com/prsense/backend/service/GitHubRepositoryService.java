package com.prsense.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class GitHubRepositoryService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public Map<String, Object> fetchRepositoryDetails(String owner, String repo, String accessToken) {
        String url = String.format("https://api.github.com/repos/%s/%s", owner, repo);
        
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + accessToken);
        headers.set("Accept", "application/vnd.github.v3+json");
        
        HttpEntity<Void> request = new HttpEntity<>(headers);
        
        try {
            ResponseEntity<String> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                request,
                String.class
            );
            
            JsonNode node = objectMapper.readTree(response.getBody());
            Map<String, Object> repoDetails = new HashMap<>();
            
            repoDetails.put("name", node.get("name").asText());
            repoDetails.put("fullName", node.get("full_name").asText());
            repoDetails.put("description", node.get("description").asText(null));
            repoDetails.put("url", node.get("html_url").asText());
            repoDetails.put("owner", node.get("owner").get("login").asText());
            repoDetails.put("isPrivate", node.get("private").asBoolean());
            repoDetails.put("defaultBranch", node.get("default_branch").asText());
            repoDetails.put("stars", node.get("stargazers_count").asInt());
            repoDetails.put("forks", node.get("forks_count").asInt());
            repoDetails.put("language", node.get("language").asText(null));
            
            log.info("Successfully fetched repository details: {}/{}", owner, repo);
            return repoDetails;
        } catch (Exception e) {
            log.error("Error fetching repository details: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to fetch repository details", e);
        }
    }

    public Map<String, Object> fetchUserRepositories(String accessToken, int page, int perPage) {
        String url = String.format("https://api.github.com/user/repos?page=%d&per_page=%d&sort=updated", page, perPage);
        
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + accessToken);
        headers.set("Accept", "application/vnd.github.v3+json");
        
        HttpEntity<Void> request = new HttpEntity<>(headers);
        
        try {
            ResponseEntity<String> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                request,
                String.class
            );
            
            Map<String, Object> result = new HashMap<>();
            result.put("repositories", response.getBody());
            result.put("totalCount", Integer.parseInt(response.getHeaders().getFirst("X-Total-Count")));
            
            log.info("Successfully fetched user repositories");
            return result;
        } catch (Exception e) {
            log.error("Error fetching user repositories: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to fetch user repositories", e);
        }
    }
}
