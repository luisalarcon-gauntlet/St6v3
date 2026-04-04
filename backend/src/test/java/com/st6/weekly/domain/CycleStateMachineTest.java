package com.st6.weekly.domain;

import com.st6.weekly.domain.commit.ChessCategory;
import com.st6.weekly.domain.commit.CompletionStatus;
import com.st6.weekly.domain.cycle.CycleState;
import com.st6.weekly.domain.cycle.CycleStateMachine;
import com.st6.weekly.domain.cycle.CycleStateMachine.TransitionContext;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CycleStateMachineTest {

    private final CycleStateMachine stateMachine = new CycleStateMachine();

    // --- Valid transitions ---

    @Test
    void draft_can_transition_to_locked() {
        TransitionContext ctx = validLockContext();
        CycleState result = stateMachine.transition(CycleState.DRAFT, CycleState.LOCKED, ctx);
        assertThat(result).isEqualTo(CycleState.LOCKED);
    }

    @Test
    void locked_can_transition_to_reconciling() {
        TransitionContext ctx = emptyContext();
        CycleState result = stateMachine.transition(CycleState.LOCKED, CycleState.RECONCILING, ctx);
        assertThat(result).isEqualTo(CycleState.RECONCILING);
    }

    @Test
    void reconciling_can_transition_to_reconciled() {
        TransitionContext ctx = allStatusesSetContext();
        CycleState result = stateMachine.transition(CycleState.RECONCILING, CycleState.RECONCILED, ctx);
        assertThat(result).isEqualTo(CycleState.RECONCILED);
    }

    // --- DRAFT → LOCKED validation ---

    @Test
    void draft_to_locked_requires_minimum_3_commits() {
        TransitionContext ctx = new TransitionContext(
                2,  // fewer than 3
                1,  // has a king
                true,  // all linked
                List.of()
        );
        assertThatThrownBy(() -> stateMachine.transition(CycleState.DRAFT, CycleState.LOCKED, ctx))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("at least 3 commits");
    }

    @Test
    void draft_to_locked_requires_exactly_one_king() {
        TransitionContext ctx = new TransitionContext(
                3,
                0,  // no king
                true,
                List.of()
        );
        assertThatThrownBy(() -> stateMachine.transition(CycleState.DRAFT, CycleState.LOCKED, ctx))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("exactly 1 KING");
    }

    @Test
    void draft_to_locked_rejects_multiple_kings() {
        TransitionContext ctx = new TransitionContext(
                3,
                2,  // too many kings
                true,
                List.of()
        );
        assertThatThrownBy(() -> stateMachine.transition(CycleState.DRAFT, CycleState.LOCKED, ctx))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("exactly 1 KING");
    }

    @Test
    void draft_to_locked_requires_all_commits_linked_to_outcome() {
        TransitionContext ctx = new TransitionContext(
                3,
                1,
                false,  // not all linked
                List.of()
        );
        assertThatThrownBy(() -> stateMachine.transition(CycleState.DRAFT, CycleState.LOCKED, ctx))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("linked to an Outcome");
    }

    // --- RECONCILING → RECONCILED validation ---

    @Test
    void reconciling_to_reconciled_requires_all_statuses_set() {
        TransitionContext ctx = new TransitionContext(
                3, 1, true,
                Arrays.asList(CompletionStatus.COMPLETED, null, CompletionStatus.IN_PROGRESS)
        );
        assertThatThrownBy(() -> stateMachine.transition(CycleState.RECONCILING, CycleState.RECONCILED, ctx))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("completion_status set");
    }

    // --- Invalid transitions ---

    @Test
    void draft_cannot_skip_to_reconciling() {
        TransitionContext ctx = emptyContext();
        assertThatThrownBy(() -> stateMachine.transition(CycleState.DRAFT, CycleState.RECONCILING, ctx))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Cannot transition");
    }

    @Test
    void locked_cannot_go_back_to_draft() {
        TransitionContext ctx = emptyContext();
        assertThatThrownBy(() -> stateMachine.transition(CycleState.LOCKED, CycleState.DRAFT, ctx))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Cannot transition");
    }

    @Test
    void reconciled_is_terminal_state() {
        TransitionContext ctx = emptyContext();
        assertThatThrownBy(() -> stateMachine.transition(CycleState.RECONCILED, CycleState.DRAFT, ctx))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Cannot transition");
        assertThatThrownBy(() -> stateMachine.transition(CycleState.RECONCILED, CycleState.LOCKED, ctx))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Cannot transition");
        assertThatThrownBy(() -> stateMachine.transition(CycleState.RECONCILED, CycleState.RECONCILING, ctx))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Cannot transition");
    }

    // --- Helpers ---

    private TransitionContext validLockContext() {
        return new TransitionContext(3, 1, true, List.of());
    }

    private TransitionContext allStatusesSetContext() {
        return new TransitionContext(3, 1, true,
                List.of(CompletionStatus.COMPLETED, CompletionStatus.IN_PROGRESS, CompletionStatus.DROPPED));
    }

    private TransitionContext emptyContext() {
        return new TransitionContext(0, 0, true, List.of());
    }
}
