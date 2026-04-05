package com.st6.weekly.controller;

import com.st6.weekly.domain.user.User;
import com.st6.weekly.domain.user.UserRepository;
import com.st6.weekly.dto.request.RegressCycleRequest;
import com.st6.weekly.dto.response.CycleResponse;
import com.st6.weekly.service.CycleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/cycles")
@RequiredArgsConstructor
public class CycleController {

    private final CycleService cycleService;
    private final UserRepository userRepository;

    @GetMapping("/current")
    public ResponseEntity<CycleResponse> getCurrentCycle(@AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = resolveUserId(userDetails);
        return ResponseEntity.ok(CycleResponse.from(cycleService.getOrCreateCurrentCycle(userId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CycleResponse> getCycleById(@PathVariable UUID id,
                                                       @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = resolveUserId(userDetails);
        return ResponseEntity.ok(CycleResponse.from(cycleService.getCycleById(id, userId)));
    }

    @GetMapping
    public ResponseEntity<Page<CycleResponse>> getCycles(@AuthenticationPrincipal UserDetails userDetails,
                                                          Pageable pageable) {
        UUID userId = resolveUserId(userDetails);
        Page<CycleResponse> page = cycleService.getCycles(userId, pageable)
                .map(CycleResponse::from);
        return ResponseEntity.ok(page);
    }

    @PostMapping("/{id}/lock")
    public ResponseEntity<CycleResponse> lockCycle(@PathVariable UUID id,
                                                    @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = resolveUserId(userDetails);
        return ResponseEntity.ok(CycleResponse.from(cycleService.lockCycle(id, userId)));
    }

    @PostMapping("/{id}/start-reconciliation")
    public ResponseEntity<CycleResponse> startReconciliation(@PathVariable UUID id,
                                                              @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = resolveUserId(userDetails);
        return ResponseEntity.ok(CycleResponse.from(cycleService.startReconciliation(id, userId)));
    }

    @PostMapping("/{id}/reconcile")
    public ResponseEntity<CycleResponse> reconcile(@PathVariable UUID id,
                                                    @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = resolveUserId(userDetails);
        return ResponseEntity.ok(CycleResponse.from(cycleService.reconcile(id, userId)));
    }

    @PostMapping("/{id}/regress")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<CycleResponse> regressCycle(@PathVariable UUID id,
                                                       @Valid @RequestBody RegressCycleRequest request,
                                                       @AuthenticationPrincipal UserDetails userDetails) {
        UUID managerId = resolveUserId(userDetails);
        return ResponseEntity.ok(CycleResponse.from(
                cycleService.regressCycle(id, managerId, request.reason())));
    }

    private UUID resolveUserId(UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getId();
    }
}
