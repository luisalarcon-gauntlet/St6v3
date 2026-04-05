package com.st6.weekly.service;

import com.st6.weekly.domain.rcdo.DefiningObjective;
import com.st6.weekly.domain.rcdo.DefiningObjectiveRepository;
import com.st6.weekly.domain.rcdo.Outcome;
import com.st6.weekly.domain.rcdo.OutcomeRepository;
import com.st6.weekly.domain.rcdo.RallyCry;
import com.st6.weekly.domain.rcdo.RallyCryRepository;
import com.st6.weekly.exception.ResourceNotFoundException;
import com.st6.weekly.security.InputSanitizer;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RcdoService {

    private final RallyCryRepository rallyCryRepository;
    private final DefiningObjectiveRepository definingObjectiveRepository;
    private final OutcomeRepository outcomeRepository;
    private final InputSanitizer inputSanitizer;

    @Transactional(readOnly = true)
    public List<RallyCry> fetchFullTree() {
        return rallyCryRepository.fetchFullTree();
    }

    @Transactional
    public RallyCry createRallyCry(String title, String description) {
        RallyCry rc = new RallyCry();
        rc.setTitle(inputSanitizer.sanitize(title));
        rc.setDescription(inputSanitizer.sanitize(description));
        rc.setStatus("ACTIVE");
        rc.setDisplayOrder(0);
        return rallyCryRepository.save(rc);
    }

    @Transactional
    public DefiningObjective createDefiningObjective(UUID rallyCryId, String title, String description) {
        RallyCry rc = rallyCryRepository.findById(rallyCryId)
                .orElseThrow(() -> new ResourceNotFoundException("Rally Cry not found: " + rallyCryId));

        DefiningObjective doObj = new DefiningObjective();
        doObj.setTitle(inputSanitizer.sanitize(title));
        doObj.setDescription(inputSanitizer.sanitize(description));
        doObj.setStatus("ACTIVE");
        doObj.setRallyCry(rc);
        return definingObjectiveRepository.save(doObj);
    }

    @Transactional
    public Outcome createOutcome(UUID definingObjectiveId, String title, String description) {
        DefiningObjective doObj = definingObjectiveRepository.findById(definingObjectiveId)
                .orElseThrow(() -> new ResourceNotFoundException("Defining Objective not found: " + definingObjectiveId));

        Outcome outcome = new Outcome();
        outcome.setTitle(inputSanitizer.sanitize(title));
        outcome.setDescription(inputSanitizer.sanitize(description));
        outcome.setStatus("ACTIVE");
        outcome.setDefiningObjective(doObj);
        return outcomeRepository.save(outcome);
    }

    @Transactional(readOnly = true)
    public List<RallyCry> fetchAllTree() {
        return rallyCryRepository.fetchAllTree();
    }

    @Transactional
    public RallyCry updateRallyCry(UUID id, String title, String description, String status) {
        RallyCry rc = rallyCryRepository.findWithTreeById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rally Cry not found: " + id));
        rc.setTitle(inputSanitizer.sanitize(title));
        rc.setDescription(inputSanitizer.sanitize(description));
        if (status != null) rc.setStatus(status);
        rc.setUpdatedAt(Instant.now());
        return rallyCryRepository.save(rc);
    }

    @Transactional
    public DefiningObjective updateDefiningObjective(UUID id, String title, String description, String status) {
        DefiningObjective doObj = definingObjectiveRepository.findWithOutcomesById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Defining Objective not found: " + id));
        doObj.setTitle(inputSanitizer.sanitize(title));
        doObj.setDescription(inputSanitizer.sanitize(description));
        if (status != null) doObj.setStatus(status);
        doObj.setUpdatedAt(Instant.now());
        return definingObjectiveRepository.save(doObj);
    }

    @Transactional
    public Outcome updateOutcome(UUID id, String title, String description, String status) {
        Outcome outcome = outcomeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Outcome not found: " + id));
        outcome.setTitle(inputSanitizer.sanitize(title));
        outcome.setDescription(inputSanitizer.sanitize(description));
        if (status != null) outcome.setStatus(status);
        outcome.setUpdatedAt(Instant.now());
        return outcomeRepository.save(outcome);
    }

    @Transactional
    public void archiveRallyCry(UUID id) {
        RallyCry rc = rallyCryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rally Cry not found: " + id));
        rc.setStatus("ARCHIVED");
        rc.setUpdatedAt(Instant.now());
        rallyCryRepository.save(rc);
    }

    @Transactional
    public void archiveDefiningObjective(UUID id) {
        DefiningObjective doObj = definingObjectiveRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Defining Objective not found: " + id));
        doObj.setStatus("ARCHIVED");
        doObj.setUpdatedAt(Instant.now());
        definingObjectiveRepository.save(doObj);
    }

    @Transactional
    public void archiveOutcome(UUID id) {
        Outcome outcome = outcomeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Outcome not found: " + id));
        outcome.setStatus("ARCHIVED");
        outcome.setUpdatedAt(Instant.now());
        outcomeRepository.save(outcome);
    }
}
