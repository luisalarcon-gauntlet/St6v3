package com.st6.weekly.service;

import com.st6.weekly.domain.commit.ChessCategory;
import com.st6.weekly.domain.commit.CompletionStatus;
import com.st6.weekly.domain.commit.WeeklyCommit;
import com.st6.weekly.domain.commit.WeeklyCommitRepository;
import com.st6.weekly.domain.cycle.CycleState;
import com.st6.weekly.domain.cycle.CycleStateMachine;
import com.st6.weekly.domain.cycle.CycleStateMachine.TransitionContext;
import com.st6.weekly.domain.cycle.WeeklyCycle;
import com.st6.weekly.domain.cycle.WeeklyCycleRepository;
import com.st6.weekly.exception.InvalidStateTransitionException;
import com.st6.weekly.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CycleService {

    private final WeeklyCycleRepository cycleRepository;
    private final WeeklyCommitRepository commitRepository;
    private final CycleStateMachine stateMachine;
    private final Clock clock;

    @Transactional
    public WeeklyCycle getOrCreateCurrentCycle(UUID userId) {
        LocalDate monday = LocalDate.now(clock).with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));

        return cycleRepository.findByUserIdAndWeekStartDate(userId, monday)
                .orElseGet(() -> {
                    WeeklyCycle cycle = new WeeklyCycle();
                    cycle.setUserId(userId);
                    cycle.setWeekStartDate(monday);
                    cycle.setState(CycleState.DRAFT);
                    return cycleRepository.save(cycle);
                });
    }

    @Transactional
    public WeeklyCycle lockCycle(UUID cycleId, UUID userId) {
        WeeklyCycle cycle = findOwnedCycle(cycleId, userId);
        List<WeeklyCommit> activeCommits = getActiveCommits(cycle);

        TransitionContext ctx = buildLockContext(activeCommits);
        doTransition(cycle, CycleState.LOCKED, ctx);

        cycle.setLockedAt(Instant.now());
        return cycleRepository.save(cycle);
    }

    @Transactional
    public WeeklyCycle startReconciliation(UUID cycleId, UUID userId) {
        WeeklyCycle cycle = findOwnedCycle(cycleId, userId);

        TransitionContext ctx = new TransitionContext(0, 0, true, List.of());
        doTransition(cycle, CycleState.RECONCILING, ctx);

        return cycleRepository.save(cycle);
    }

    @Transactional
    public WeeklyCycle reconcile(UUID cycleId, UUID userId) {
        WeeklyCycle cycle = findOwnedCycle(cycleId, userId);
        List<WeeklyCommit> activeCommits = getActiveCommits(cycle);

        List<CompletionStatus> statuses = activeCommits.stream()
                .map(WeeklyCommit::getCompletionStatus)
                .toList();
        TransitionContext ctx = new TransitionContext(activeCommits.size(), 0, true, statuses);
        doTransition(cycle, CycleState.RECONCILED, ctx);

        cycle.setReconciledAt(Instant.now());
        return cycleRepository.save(cycle);
    }

    @Transactional(readOnly = true)
    public Page<WeeklyCycle> getCycles(UUID userId, Pageable pageable) {
        return cycleRepository.findByUserIdOrderByWeekStartDateDesc(userId, pageable);
    }

    @Transactional(readOnly = true)
    public WeeklyCycle getCycleById(UUID cycleId, UUID userId) {
        WeeklyCycle cycle = cycleRepository.findByIdWithCommits(cycleId)
                .orElseThrow(() -> new ResourceNotFoundException("Cycle not found: " + cycleId));
        if (!cycle.getUserId().equals(userId)) {
            throw new ResourceNotFoundException("Cycle not found: " + cycleId);
        }
        return cycle;
    }

    private WeeklyCycle findOwnedCycle(UUID cycleId, UUID userId) {
        WeeklyCycle cycle = cycleRepository.findByIdWithCommits(cycleId)
                .orElseThrow(() -> new ResourceNotFoundException("Cycle not found: " + cycleId));
        if (!cycle.getUserId().equals(userId)) {
            throw new ResourceNotFoundException("Cycle not found: " + cycleId);
        }
        return cycle;
    }

    private List<WeeklyCommit> getActiveCommits(WeeklyCycle cycle) {
        return cycle.getCommits().stream()
                .filter(c -> !c.isDeleted())
                .toList();
    }

    private TransitionContext buildLockContext(List<WeeklyCommit> commits) {
        int commitCount = commits.size();
        long kingCount = commits.stream()
                .filter(c -> c.getChessCategory() == ChessCategory.KING)
                .count();
        boolean allLinked = commits.stream()
                .allMatch(c -> c.getOutcomeId() != null);
        return new TransitionContext(commitCount, (int) kingCount, allLinked, List.of());
    }

    private void doTransition(WeeklyCycle cycle, CycleState target, TransitionContext ctx) {
        try {
            stateMachine.transition(cycle.getState(), target, ctx);
            cycle.setState(target);
        } catch (IllegalStateException e) {
            throw new InvalidStateTransitionException(e.getMessage());
        }
    }
}
