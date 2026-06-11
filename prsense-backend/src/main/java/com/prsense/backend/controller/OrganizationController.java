package com.prsense.backend.controller;

import com.prsense.backend.entity.*;
import com.prsense.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/organizations")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class OrganizationController {

    private final OrganizationRepository organizationRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final InviteTokenRepository inviteTokenRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<Organization>> getAllOrganizations() {
        return ResponseEntity.ok(organizationRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<Organization> createOrganization(@RequestBody Map<String, String> body) {
        Organization org = Organization.builder()
                .name(body.get("name"))
                .description(body.get("description"))
                .build();
        return ResponseEntity.ok(organizationRepository.save(org));
    }

    @GetMapping("/{id}/workspaces")
    public ResponseEntity<List<Workspace>> getWorkspaces(@PathVariable Long id) {
        return ResponseEntity.ok(workspaceRepository.findByOrganizationId(id));
    }

    @PostMapping("/{id}/workspaces")
    public ResponseEntity<Workspace> createWorkspace(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Organization org = organizationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Org not found"));
        Workspace ws = Workspace.builder()
                .organization(org)
                .name(body.get("name"))
                .description(body.get("description"))
                .webhookUrl(body.get("webhookUrl"))
                .build();
        return ResponseEntity.ok(workspaceRepository.save(ws));
    }

    @GetMapping("/workspaces/{workspaceId}/members")
    public ResponseEntity<List<WorkspaceMember>> getWorkspaceMembers(@PathVariable Long workspaceId) {
        return ResponseEntity.ok(workspaceMemberRepository.findByWorkspaceId(workspaceId));
    }

    @PostMapping("/workspaces/{workspaceId}/invites")
    public ResponseEntity<InviteToken> inviteMember(
            @PathVariable Long workspaceId,
            @RequestBody Map<String, String> body
    ) {
        Workspace ws = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace not found"));
        
        InviteToken invite = InviteToken.builder()
                .workspace(ws)
                .email(body.get("email"))
                .role(WorkspaceMember.Role.valueOf(body.getOrDefault("role", "REVIEWER")))
                .token(UUID.randomUUID().toString())
                .expiresAt(LocalDateTime.now().plusDays(7))
                .accepted(false)
                .build();
        
        return ResponseEntity.ok(inviteTokenRepository.save(invite));
    }

    @PostMapping("/invites/accept")
    public ResponseEntity<WorkspaceMember> acceptInvite(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        Long userId = Long.valueOf(body.get("userId"));
        
        InviteToken invite = inviteTokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid invite token"));
        
        if (invite.getAccepted() || invite.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalStateException("Invite expired or already accepted");
        }
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        invite.setAccepted(true);
        inviteTokenRepository.save(invite);
        
        WorkspaceMember member = WorkspaceMember.builder()
                .workspace(invite.getWorkspace())
                .user(user)
                .role(invite.getRole())
                .build();
        
        return ResponseEntity.ok(workspaceMemberRepository.save(member));
    }
}
