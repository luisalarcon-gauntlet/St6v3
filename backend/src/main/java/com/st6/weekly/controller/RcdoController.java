package com.st6.weekly.controller;

import com.st6.weekly.domain.rcdo.DefiningObjective;
import com.st6.weekly.domain.rcdo.Outcome;
import com.st6.weekly.domain.rcdo.RallyCry;
import com.st6.weekly.dto.request.CreateDefiningObjectiveRequest;
import com.st6.weekly.dto.request.CreateOutcomeRequest;
import com.st6.weekly.dto.request.CreateRallyCryRequest;
import com.st6.weekly.dto.response.RcdoTreeResponse;
import com.st6.weekly.service.RcdoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class RcdoController {

    private final RcdoService rcdoService;

    @GetMapping("/api/v1/rcdo/tree")
    public ResponseEntity<List<RcdoTreeResponse>> getTree() {
        List<RcdoTreeResponse> tree = rcdoService.fetchFullTree().stream()
                .map(RcdoTreeResponse::from)
                .toList();
        return ResponseEntity.ok(tree);
    }

    @PostMapping("/api/v1/rally-cries")
    public ResponseEntity<RcdoTreeResponse> createRallyCry(@Valid @RequestBody CreateRallyCryRequest request) {
        RallyCry rc = rcdoService.createRallyCry(request.title(), request.description());
        return ResponseEntity.status(HttpStatus.CREATED).body(RcdoTreeResponse.from(rc));
    }

    @PostMapping("/api/v1/defining-objectives")
    public ResponseEntity<RcdoTreeResponse.DefiningObjectiveNode> createDefiningObjective(
            @Valid @RequestBody CreateDefiningObjectiveRequest request) {
        DefiningObjective doObj = rcdoService.createDefiningObjective(
                request.rallyCryId(), request.title(), request.description());
        return ResponseEntity.status(HttpStatus.CREATED).body(RcdoTreeResponse.DefiningObjectiveNode.from(doObj));
    }

    @PostMapping("/api/v1/outcomes")
    public ResponseEntity<RcdoTreeResponse.OutcomeNode> createOutcome(
            @Valid @RequestBody CreateOutcomeRequest request) {
        Outcome outcome = rcdoService.createOutcome(
                request.definingObjectiveId(), request.title(), request.description());
        return ResponseEntity.status(HttpStatus.CREATED).body(RcdoTreeResponse.OutcomeNode.from(outcome));
    }
}
