package com.st6.weekly.domain.cycle;

import com.st6.weekly.domain.commit.CompletionStatus;

import java.util.List;
import java.util.Set;

public class CycleStateMachine {

    private static final Set<StateTransition> ALLOWED = Set.of(
            new StateTransition(CycleState.DRAFT, CycleState.LOCKED),
            new StateTransition(CycleState.LOCKED, CycleState.RECONCILING),
            new StateTransition(CycleState.RECONCILING, CycleState.RECONCILED)
    );

    public CycleState transition(CycleState from, CycleState to, TransitionContext context) {
        if (!ALLOWED.contains(new StateTransition(from, to))) {
            throw new IllegalStateException(
                    "Cannot transition from " + from + " to " + to);
        }

        if (from == CycleState.DRAFT && to == CycleState.LOCKED) {
            validateLock(context);
        }

        if (from == CycleState.RECONCILING && to == CycleState.RECONCILED) {
            validateReconcile(context);
        }

        return to;
    }

    private void validateLock(TransitionContext ctx) {
        if (ctx.commitCount() < 3) {
            throw new IllegalStateException(
                    "Cannot lock: cycle must have at least 3 commits");
        }
        if (ctx.kingCount() != 1) {
            throw new IllegalStateException(
                    "Cannot lock: cycle must have exactly 1 KING commit");
        }
        if (!ctx.allLinkedToOutcome()) {
            throw new IllegalStateException(
                    "Cannot lock: all commits must be linked to an Outcome");
        }
    }

    private static final Set<CompletionStatus> RESOLVED_STATUSES = Set.of(
            CompletionStatus.COMPLETED,
            CompletionStatus.IN_PROGRESS,
            CompletionStatus.CARRIED_FORWARD,
            CompletionStatus.DROPPED
    );

    private void validateReconcile(TransitionContext ctx) {
        boolean allResolved = ctx.completionStatuses().stream()
                .allMatch(s -> s != null && RESOLVED_STATUSES.contains(s));
        if (!allResolved) {
            throw new IllegalStateException(
                    "Cannot reconcile: all commits must have completion_status set");
        }
    }

    public CycleState regress(CycleState from, String reason) {
        if (from == CycleState.DRAFT) {
            throw new IllegalStateException("Cannot regress from DRAFT");
        }
        if (reason == null || reason.isBlank()) {
            throw new IllegalStateException("Regression reason must not be blank");
        }
        return CycleState.DRAFT;
    }

    public record TransitionContext(
            int commitCount,
            int kingCount,
            boolean allLinkedToOutcome,
            List<CompletionStatus> completionStatuses
    ) {}

    private record StateTransition(CycleState from, CycleState to) {}
}
