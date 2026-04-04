package com.st6.weekly.service;

import com.st6.weekly.domain.commit.ChessCategory;
import com.st6.weekly.domain.commit.WeeklyCommit;
import com.st6.weekly.domain.commit.WeeklyCommitRepository;
import com.st6.weekly.domain.cycle.CycleState;
import com.st6.weekly.domain.cycle.WeeklyCycle;
import com.st6.weekly.domain.cycle.WeeklyCycleRepository;
import com.st6.weekly.domain.rcdo.OutcomeRepository;
import com.st6.weekly.dto.request.CreateCommitRequest;
import com.st6.weekly.dto.request.ReconcileCommitRequest;
import com.st6.weekly.dto.request.UpdateCommitRequest;
import com.st6.weekly.exception.InvalidStateTransitionException;
import com.st6.weekly.exception.ResourceNotFoundException;
import com.st6.weekly.security.InputSanitizer;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CommitService {

    private final WeeklyCommitRepository commitRepository;
    private final WeeklyCycleRepository cycleRepository;
    private final OutcomeRepository outcomeRepository;
    private final AuditService auditService;
    private final InputSanitizer inputSanitizer;

    @Transactional
    public WeeklyCommit createCommit(UUID cycleId, CreateCommitRequest request, UUID userId) {
        WeeklyCycle cycle = findOwnedCycleWithCommits(cycleId, userId);
        requireState(cycle, CycleState.DRAFT, "Commits can only be created in DRAFT state");

        if (!outcomeRepository.existsById(request.outcomeId())) {
            throw new ResourceNotFoundException("Outcome not found: " + request.outcomeId());
        }

        validateKingLimit(cycle, request.chessCategory(), null);

        WeeklyCommit commit = new WeeklyCommit();
        commit.setWeeklyCycle(cycle);
        commit.setTitle(inputSanitizer.sanitize(request.title()));
        commit.setDescription(inputSanitizer.sanitize(request.description()));
        commit.setOutcomeId(request.outcomeId());
        commit.setChessCategory(request.chessCategory());
        commit.setPlannedHours(request.plannedHours());
        commit.setPriorityRank(nextRank(cycle));

        WeeklyCommit saved = commitRepository.save(commit);

        auditService.log("WEEKLY_COMMIT", saved.getId(), "CREATED", userId,
                Map.of("title", saved.getTitle(), "chessCategory", saved.getChessCategory().name()));

        return saved;
    }

    @Transactional
    public WeeklyCommit updateCommit(UUID commitId, UpdateCommitRequest request, UUID userId) {
        WeeklyCommit commit = findOwnedCommit(commitId, userId);
        WeeklyCycle cycle = commit.getWeeklyCycle();
        requireState(cycle, CycleState.DRAFT, "Commits can only be updated in DRAFT state");

        if (!outcomeRepository.existsById(request.outcomeId())) {
            throw new ResourceNotFoundException("Outcome not found: " + request.outcomeId());
        }

        validateKingLimit(cycle, request.chessCategory(), commitId);

        commit.setTitle(inputSanitizer.sanitize(request.title()));
        commit.setDescription(inputSanitizer.sanitize(request.description()));
        commit.setOutcomeId(request.outcomeId());
        commit.setChessCategory(request.chessCategory());
        commit.setPlannedHours(request.plannedHours());
        commit.setUpdatedAt(Instant.now());

        WeeklyCommit saved = commitRepository.save(commit);

        auditService.log("WEEKLY_COMMIT", saved.getId(), "UPDATED", userId,
                Map.of("title", saved.getTitle(), "chessCategory", saved.getChessCategory().name()));

        return saved;
    }

    @Transactional
    public WeeklyCommit reconcileCommit(UUID commitId, ReconcileCommitRequest request, UUID userId) {
        WeeklyCommit commit = findOwnedCommit(commitId, userId);
        WeeklyCycle cycle = commit.getWeeklyCycle();
        requireState(cycle, CycleState.RECONCILING, "Commits can only be reconciled in RECONCILING state");

        commit.setActualHours(request.actualHours());
        commit.setCompletionStatus(request.completionStatus());
        commit.setReconciliationNotes(inputSanitizer.sanitize(request.reconciliationNotes()));
        commit.setUpdatedAt(Instant.now());

        WeeklyCommit saved = commitRepository.save(commit);

        auditService.log("WEEKLY_COMMIT", saved.getId(), "RECONCILED", userId,
                Map.of("completionStatus", saved.getCompletionStatus().name(),
                        "actualHours", saved.getActualHours()));

        return saved;
    }

    @Transactional
    public void deleteCommit(UUID commitId, UUID userId) {
        WeeklyCommit commit = findOwnedCommit(commitId, userId);
        requireState(commit.getWeeklyCycle(), CycleState.DRAFT, "Commits can only be deleted in DRAFT state");

        commit.setDeleted(true);
        commit.setUpdatedAt(Instant.now());
        commitRepository.save(commit);

        auditService.log("WEEKLY_COMMIT", commitId, "DELETED", userId,
                Map.of("title", commit.getTitle()));
    }

    @Transactional
    public WeeklyCommit reorderCommit(UUID commitId, int newRank, UUID userId) {
        WeeklyCommit commit = findOwnedCommit(commitId, userId);
        commit.setPriorityRank(newRank);
        commit.setUpdatedAt(Instant.now());
        return commitRepository.save(commit);
    }

    private WeeklyCycle findOwnedCycleWithCommits(UUID cycleId, UUID userId) {
        WeeklyCycle cycle = cycleRepository.findByIdWithCommits(cycleId)
                .orElseThrow(() -> new ResourceNotFoundException("Cycle not found: " + cycleId));
        if (!cycle.getUserId().equals(userId)) {
            throw new ResourceNotFoundException("Cycle not found: " + cycleId);
        }
        return cycle;
    }

    private WeeklyCommit findOwnedCommit(UUID commitId, UUID userId) {
        WeeklyCommit commit = commitRepository.findById(commitId)
                .orElseThrow(() -> new ResourceNotFoundException("Commit not found: " + commitId));
        if (!commit.getWeeklyCycle().getUserId().equals(userId)) {
            throw new ResourceNotFoundException("Commit not found: " + commitId);
        }
        return commit;
    }

    private void requireState(WeeklyCycle cycle, CycleState required, String message) {
        if (cycle.getState() != required) {
            throw new InvalidStateTransitionException(message);
        }
    }

    private void validateKingLimit(WeeklyCycle cycle, ChessCategory category, UUID excludeCommitId) {
        if (category != ChessCategory.KING) {
            return;
        }
        boolean hasKing = cycle.getCommits().stream()
                .filter(c -> !c.isDeleted())
                .filter(c -> excludeCommitId == null || !c.getId().equals(excludeCommitId))
                .anyMatch(c -> c.getChessCategory() == ChessCategory.KING);
        if (hasKing) {
            throw new InvalidStateTransitionException("Only one KING commit is allowed per week");
        }
    }

    private int nextRank(WeeklyCycle cycle) {
        return cycle.getCommits().stream()
                .filter(c -> !c.isDeleted())
                .mapToInt(WeeklyCommit::getPriorityRank)
                .max()
                .orElse(0) + 1;
    }
}
