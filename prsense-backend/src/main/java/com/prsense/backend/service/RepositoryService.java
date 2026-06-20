package com.prsense.backend.service;

import com.prsense.backend.entity.Repository;
import com.prsense.backend.repository.RepositoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Random;

@Service
@RequiredArgsConstructor
@Slf4j
public class RepositoryService {

    private final RepositoryRepository repositoryRepository;

    @Transactional(readOnly = true)
    public List<Repository> getAllRepositories() {
        return repositoryRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Repository> getRepositoryById(Long id) {
        return repositoryRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public Optional<Repository> getRepositoryByFullName(String fullName) {
        return repositoryRepository.findByFullName(fullName);
    }

    @Transactional
    public Repository saveRepository(Repository repository) {
        log.info("Saving repository: {}", repository.getFullName());
        return repositoryRepository.save(repository);
    }

    @Transactional
    public void resetIndexingStatus(Long id) {
        repositoryRepository.findById(id).ifPresent(repo -> {
            if ("INDEXED".equals(repo.getIndexingStatus())) {
                repo.setIndexingStatus("PENDING");
                repositoryRepository.save(repo);
                log.info("Reset repository {} indexing status to PENDING due to missing snapshot", repo.getFullName());
            }
        });
    }

    @Transactional
    public Repository registerOrUpdateRepository(String fullName, String name, Long installationId, String language) {
        fullName = normalizeRepoFullName(fullName);
        log.info("Registering/Updating repository: {}, installation: {}", fullName, installationId);
        Optional<Repository> existingOpt = repositoryRepository.findByFullName(fullName);
        
        // Extract owner to generate avatar
        String owner = "github";
        if (fullName.contains("/")) {
            owner = fullName.split("/")[0];
        }
        String avatar = "https://api.dicebear.com/7.x/identicon/svg?seed=" + owner;
        
        // Generate language breakdown
        String lang = language != null ? language : "JavaScript";
        String breakdown;
        if ("Java".equalsIgnoreCase(lang)) {
            breakdown = "{\"Java\": 75, \"XML\": 15, \"YAML\": 10}";
        } else if ("Python".equalsIgnoreCase(lang)) {
            breakdown = "{\"Python\": 85, \"Shell\": 10, \"Markdown\": 5}";
        } else if ("TypeScript".equalsIgnoreCase(lang)) {
            breakdown = "{\"TypeScript\": 70, \"JavaScript\": 20, \"CSS\": 10}";
        } else {
            breakdown = "{\"JavaScript\": 65, \"HTML\": 20, \"CSS\": 15}";
        }

        // Generate semi-random stats
        Random rand = new Random();
        int stars = 40 + rand.nextInt(350);
        int forks = 10 + rand.nextInt(90);
        int contributors = 3 + rand.nextInt(15);
        int branches = 2 + rand.nextInt(8);
        int openPrs = 1 + rand.nextInt(5);

        Repository repo;
        if (existingOpt.isPresent()) {
            repo = existingOpt.get();
            repo.setInstallationId(installationId);
            if (language != null) {
                repo.setLanguage(language);
            }
            repo.setLastSyncAt(LocalDateTime.now());
            repo.setWebhookStatus("healthy");
            
            // Populate stats if missing
            if (repo.getStars() == null) {
                repo.setAvatarUrl(avatar);
                repo.setStars(stars);
                repo.setForks(forks);
                repo.setLanguageBreakdown(breakdown);
                repo.setContributors(contributors);
                repo.setBranchCount(branches);
                repo.setOpenPrCount(openPrs);
            }
        } else {
            repo = Repository.builder()
                    .fullName(fullName)
                    .name(name)
                    .installationId(installationId)
                    .language(lang)
                    .webhookStatus("healthy")
                    .avatarUrl(avatar)
                    .stars(stars)
                    .forks(forks)
                    .languageBreakdown(breakdown)
                    .contributors(contributors)
                    .branchCount(branches)
                    .openPrCount(openPrs)
                    .build();
        }
        
        return repositoryRepository.save(repo);
    }

    @Transactional
    public void deleteRepository(Long id) {
        log.info("Deleting repository with ID: {}", id);
        repositoryRepository.deleteById(id);
    }

    public static String normalizeRepoFullName(String fullName) {
        if (fullName == null) return null;
        fullName = fullName.trim();
        if (fullName.endsWith(".git")) {
            fullName = fullName.substring(0, fullName.length() - 4);
        }
        String[] prefixes = {
            "https://github.com/",
            "http://github.com/",
            "git@github.com:",
            "github.com/"
        };
        for (String prefix : prefixes) {
            if (fullName.startsWith(prefix)) {
                fullName = fullName.substring(prefix.length());
                break;
            }
        }
        if (fullName.startsWith("/")) fullName = fullName.substring(1);
        if (fullName.endsWith("/")) fullName = fullName.substring(0, fullName.length() - 1);
        return fullName;
    }
}
