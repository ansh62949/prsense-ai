package com.prsense.backend.controller;

import com.prsense.backend.entity.ApiKey;
import com.prsense.backend.entity.Organization;
import com.prsense.backend.repository.ApiKeyRepository;
import com.prsense.backend.repository.OrganizationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/developer")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DeveloperPortalController {

    private final ApiKeyRepository apiKeyRepository;
    private final OrganizationRepository organizationRepository;

    @GetMapping("/keys/{orgId}")
    public ResponseEntity<List<ApiKey>> getOrgApiKeys(@PathVariable Long orgId) {
        return ResponseEntity.ok(apiKeyRepository.findByOrganizationId(orgId));
    }

    @PostMapping("/keys/{orgId}")
    public ResponseEntity<ApiKey> generateApiKey(
            @PathVariable Long orgId,
            @RequestBody Map<String, String> body
    ) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new IllegalArgumentException("Org not found"));
        
        ApiKey key = ApiKey.builder()
                .organization(org)
                .name(body.getOrDefault("name", "Generated Key"))
                .token("prsense_live_" + UUID.randomUUID().toString().replace("-", ""))
                .active(true)
                .expiresAt(LocalDateTime.now().plusMonths(12))
                .build();
                
        return ResponseEntity.ok(apiKeyRepository.save(key));
    }

    @DeleteMapping("/keys/{id}")
    public ResponseEntity<Void> revokeApiKey(@PathVariable Long id) {
        apiKeyRepository.findById(id).ifPresent(key -> {
            key.setActive(false);
            apiKeyRepository.save(key);
        });
        return ResponseEntity.ok().build();
    }
}
