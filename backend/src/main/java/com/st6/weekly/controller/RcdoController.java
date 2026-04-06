package com.st6.weekly.controller;

import com.st6.weekly.domain.rcdo.DefiningObjective;
import com.st6.weekly.domain.rcdo.Outcome;
import com.st6.weekly.domain.rcdo.RallyCry;
import com.st6.weekly.dto.request.CreateDefiningObjectiveRequest;
import com.st6.weekly.dto.request.CreateOutcomeRequest;
import com.st6.weekly.dto.request.CreateRallyCryRequest;
import com.st6.weekly.dto.request.UpdateRcdoRequest;
import com.st6.weekly.dto.response.RcdoTreeResponse;
import com.st6.weekly.service.RcdoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class RcdoController {

    private final RcdoService rcdoService;

    @GetMapping("/api/v1/rcdo/tree")
    public ResponseEntity<List<RcdoTreeResponse>> getTree(
            @RequestParam(defaultValue = "false") boolean includeArchived) {
        List<RallyCry> rallyCries = includeArchived
                ? rcdoService.fetchAllTree()
                : rcdoService.fetchFullTree();
        List<RcdoTreeResponse> tree = rallyCries.stream()
                .map(RcdoTreeResponse::from)
                .toList();
        return ResponseEntity.ok(tree);
    }

    @PostMapping("/api/v1/rally-cries")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RcdoTreeResponse> createRallyCry(@Valid @RequestBody CreateRallyCryRequest request) {
        RallyCry rc = rcdoService.createRallyCry(request.title(), request.description());
        return ResponseEntity.status(HttpStatus.CREATED).body(RcdoTreeResponse.from(rc));
    }

    @PutMapping("/api/v1/rally-cries/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RcdoTreeResponse> updateRallyCry(
            @PathVariable UUID id, @Valid @RequestBody UpdateRcdoRequest request) {
        RallyCry rc = rcdoService.updateRallyCry(id, request.title(), request.description(), request.status());
        return ResponseEntity.ok(RcdoTreeResponse.from(rc));
    }

    @DeleteMapping("/api/v1/rally-cries/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> archiveRallyCry(@PathVariable UUID id) {
        rcdoService.archiveRallyCry(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/v1/defining-objectives")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RcdoTreeResponse.DefiningObjectiveNode> createDefiningObjective(
            @Valid @RequestBody CreateDefiningObjectiveRequest request) {
        DefiningObjective doObj = rcdoService.createDefiningObjective(
                request.rallyCryId(), request.title(), request.description());
        return ResponseEntity.status(HttpStatus.CREATED).body(RcdoTreeResponse.DefiningObjectiveNode.from(doObj));
    }

    @PutMapping("/api/v1/defining-objectives/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RcdoTreeResponse.DefiningObjectiveNode> updateDefiningObjective(
            @PathVariable UUID id, @Valid @RequestBody UpdateRcdoRequest request) {
        DefiningObjective doObj = rcdoService.updateDefiningObjective(
                id, request.title(), request.description(), request.status());
        return ResponseEntity.ok(RcdoTreeResponse.DefiningObjectiveNode.from(doObj));
    }

    @DeleteMapping("/api/v1/defining-objectives/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> archiveDefiningObjective(@PathVariable UUID id) {
        rcdoService.archiveDefiningObjective(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/v1/outcomes")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RcdoTreeResponse.OutcomeNode> createOutcome(
            @Valid @RequestBody CreateOutcomeRequest request) {
        Outcome outcome = rcdoService.createOutcome(
                request.definingObjectiveId(), request.title(), request.description());
        return ResponseEntity.status(HttpStatus.CREATED).body(RcdoTreeResponse.OutcomeNode.from(outcome));
    }

    @PutMapping("/api/v1/outcomes/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RcdoTreeResponse.OutcomeNode> updateOutcome(
            @PathVariable UUID id, @Valid @RequestBody UpdateRcdoRequest request) {
        Outcome outcome = rcdoService.updateOutcome(
                id, request.title(), request.description(), request.status());
        return ResponseEntity.ok(RcdoTreeResponse.OutcomeNode.from(outcome));
    }

    @DeleteMapping("/api/v1/outcomes/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> archiveOutcome(@PathVariable UUID id) {
        rcdoService.archiveOutcome(id);
        return ResponseEntity.noContent().build();
    }
}
