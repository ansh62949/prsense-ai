package com.prsense.backend.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class GitHubUserInfo {
    private Long id;
    private String login;
    private String name;
    private String email;
    private String avatar_url;
    private String bio;
    private String company;
    private String location;
    private String blog;
    private String twitter_username;
    private Integer public_repos;
    private Integer followers;
    private Integer following;
    private String created_at;
    private String updated_at;
}
