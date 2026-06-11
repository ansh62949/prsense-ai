package com.prsense.backend.config;

import com.prsense.backend.entity.*;
import com.prsense.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final PasswordEncoder passwordEncoder;

    @org.springframework.beans.factory.annotation.Value("${webhook.base.url:http://localhost:8080}")
    private String webhookBaseUrl;

    @Override
    public void run(String... args) throws Exception {
        User adminUser = null;
        if (userRepository.findByEmail("admin@prsense.ai").isEmpty()) {
            log.info("Seeding default admin user: admin@prsense.ai");
            User admin = User.builder()
                    .email("admin@prsense.ai")
                    .githubUsername("admin")
                    .password(passwordEncoder.encode("password"))
                    .role(User.Role.ADMIN)
                    .oauthProvider("email")
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            adminUser = userRepository.save(admin);
            log.info("Default admin user seeded successfully.");
        } else {
            adminUser = userRepository.findByEmail("admin@prsense.ai").get();
        }

        Organization org = null;
        if (organizationRepository.findAll().isEmpty()) {
            log.info("Seeding default organization: Acme Corporation");
            org = Organization.builder()
                    .name("Acme Corporation")
                    .description("Acme Corporation Enterprise Account")
                    .build();
            org = organizationRepository.save(org);
        } else {
            org = organizationRepository.findAll().get(0);
        }

        Workspace ws = null;
        if (workspaceRepository.findByOrganizationId(org.getId()).isEmpty()) {
            log.info("Seeding default workspace: Engineering");
            ws = Workspace.builder()
                    .organization(org)
                    .name("Engineering")
                    .description("Core engineering workspace for repository audits")
                    .webhookUrl(webhookBaseUrl + "/api/webhooks/github")
                    .build();
            ws = workspaceRepository.save(ws);
        } else {
            ws = workspaceRepository.findByOrganizationId(org.getId()).get(0);
        }

        if (workspaceMemberRepository.findByWorkspaceId(ws.getId()).isEmpty() && adminUser != null) {
            log.info("Seeding default workspace member: OWNER");
            WorkspaceMember member = WorkspaceMember.builder()
                    .workspace(ws)
                    .user(adminUser)
                    .role(WorkspaceMember.Role.OWNER)
                    .joinedAt(LocalDateTime.now())
                    .build();
            workspaceMemberRepository.save(member);
        }
    }
}
