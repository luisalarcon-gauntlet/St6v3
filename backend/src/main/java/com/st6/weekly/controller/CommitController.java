package com.st6.weekly.controller;

import com.st6.weekly.domain.commit.WeeklyCommit;
import com.st6.weekly.domain.user.User;
import com.st6.weekly.domain.user.UserRepository;
import com.st6.weekly.dto.request.CreateCommitRequest;
import com.st6.weekly.dto.request.ReconcileCommitRequest;
import com.st6.weekly.dto.request.ReorderCommitRequest;
import com.st6.weekly.dto.request.UpdateCommitRequest;
import com.st6.weekly.dto.response.CommitResponse;
import com.st6.weekly.service.CommitService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class CommitController {

    private final CommitService commitService;
    private final UserRepository userRepository;

    @PostMapping("/api/v1/cycles/{cycleId}/commits")
    public ResponseEntity<CommitResponse> createCommit(
            @PathVariable UUID cycleId,
            @Valid @RequestBody CreateCommitRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID userId = resolveUserId(userDetails);
        WeeklyCommit commit = commitService.createCommit(cycleId, request, userId);
        CommitResponse response = CommitResponse.from(commit);

        return ResponseEntity
                .created(URI.create("/api/v1/commits/" + commit.getId()))
                .body(response);
    }

    @PutMapping("/api/v1/commits/{id}")
    public ResponseEntity<CommitResponse> updateCommit(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateCommitRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID userId = resolveUserId(userDetails);
        WeeklyCommit commit = commitService.updateCommit(id, request, userId);
        return ResponseEntity.ok(CommitResponse.from(commit));
    }

    @DeleteMapping("/api/v1/commits/{id}")
    public ResponseEntity<Void> deleteCommit(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID userId = resolveUserId(userDetails);
        commitService.deleteCommit(id, userId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/api/v1/commits/{id}/reconcile")
    public ResponseEntity<CommitResponse> reconcileCommit(
            @PathVariable UUID id,
            @Valid @RequestBody ReconcileCommitRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID userId = resolveUserId(userDetails);
        WeeklyCommit commit = commitService.reconcileCommit(id, request, userId);
        return ResponseEntity.ok(CommitResponse.from(commit));
    }

    @PutMapping("/api/v1/commits/{id}/reorder")
    public ResponseEntity<CommitResponse> reorderCommit(
            @PathVariable UUID id,
            @Valid @RequestBody ReorderCommitRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID userId = resolveUserId(userDetails);
        WeeklyCommit commit = commitService.reorderCommit(id, request.priorityRank(), userId);
        return ResponseEntity.ok(CommitResponse.from(commit));
    }

    private UUID resolveUserId(UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getId();
    }
}
