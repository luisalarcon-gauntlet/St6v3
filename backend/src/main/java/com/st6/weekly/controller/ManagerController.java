package com.st6.weekly.controller;

import com.st6.weekly.domain.user.User;
import com.st6.weekly.domain.user.UserRepository;
import com.st6.weekly.dto.request.ReviewRequest;
import com.st6.weekly.dto.response.AuditLogResponse;
import com.st6.weekly.dto.response.CycleResponse;
import com.st6.weekly.dto.response.TeamOverviewResponse;
import com.st6.weekly.service.ManagerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/manager")
@RequiredArgsConstructor
public class ManagerController {

    private final ManagerService managerService;
    private final UserRepository userRepository;

    @GetMapping("/team")
    public ResponseEntity<Page<TeamOverviewResponse>> getTeamOverview(
            @AuthenticationPrincipal UserDetails userDetails,
            Pageable pageable) {
        UUID managerId = resolveUserId(userDetails);
        return ResponseEntity.ok(managerService.getTeamOverview(managerId, pageable));
    }

    @GetMapping("/team/{userId}")
    public ResponseEntity<TeamOverviewResponse> getTeamMemberDetail(
            @PathVariable UUID userId,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID managerId = resolveUserId(userDetails);
        return ResponseEntity.ok(managerService.getTeamMemberDetail(managerId, userId));
    }

    @GetMapping("/cycles/{cycleId}/audit")
    public ResponseEntity<Page<AuditLogResponse>> getCycleAudit(
            @PathVariable UUID cycleId,
            @AuthenticationPrincipal UserDetails userDetails,
            Pageable pageable) {
        UUID managerId = resolveUserId(userDetails);
        return ResponseEntity.ok(managerService.getCycleAudit(managerId, cycleId, pageable));
    }

    @PostMapping("/reviews/{cycleId}")
    public ResponseEntity<CycleResponse> submitReview(
            @PathVariable UUID cycleId,
            @Valid @RequestBody ReviewRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID managerId = resolveUserId(userDetails);
        return ResponseEntity.ok(managerService.submitReview(managerId, cycleId, request.reviewerNotes()));
    }

    private UUID resolveUserId(UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getId();
    }
}
