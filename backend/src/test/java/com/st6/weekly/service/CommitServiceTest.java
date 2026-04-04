package com.st6.weekly.service;

import com.st6.weekly.domain.commit.ChessCategory;
import com.st6.weekly.domain.commit.CompletionStatus;
import com.st6.weekly.domain.commit.WeeklyCommit;
import com.st6.weekly.domain.commit.WeeklyCommitRepository;
import com.st6.weekly.domain.cycle.CycleState;
import com.st6.weekly.domain.cycle.WeeklyCycle;
import com.st6.weekly.domain.cycle.WeeklyCycleRepository;
import com.st6.weekly.domain.rcdo.Outcome;
import com.st6.weekly.domain.rcdo.OutcomeRepository;
import com.st6.weekly.dto.request.CreateCommitRequest;
import com.st6.weekly.dto.request.ReconcileCommitRequest;
import com.st6.weekly.dto.request.UpdateCommitRequest;
import com.st6.weekly.exception.InvalidStateTransitionException;
import com.st6.weekly.exception.ResourceNotFoundException;
import com.st6.weekly.security.InputSanitizer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CommitServiceTest {

    @Mock
    private WeeklyCommitRepository commitRepository;

    @Mock
    private WeeklyCycleRepository cycleRepository;

    @Mock
    private OutcomeRepository outcomeRepository;

    @Mock
    private AuditService auditService;

    @Spy
    private InputSanitizer inputSanitizer;

    @InjectMocks
    private CommitService commitService;

    private UUID userId;
    private UUID outcomeId;
    private WeeklyCycle draftCycle;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        outcomeId = UUID.randomUUID();
        draftCycle = buildCycle(CycleState.DRAFT);
    }

    // --- create ---

    @Test
    void create_commit_in_draft_cycle_succeeds() {
        when(cycleRepository.findByIdWithCommits(draftCycle.getId())).thenReturn(Optional.of(draftCycle));
        when(outcomeRepository.existsById(outcomeId)).thenReturn(true);
        when(commitRepository.save(any(WeeklyCommit.class))).thenAnswer(inv -> {
            WeeklyCommit c = inv.getArgument(0);
            c.setId(UUID.randomUUID());
            return c;
        });

        CreateCommitRequest request = new CreateCommitRequest(
                "Build login page", "Implement the login UI", outcomeId,
                ChessCategory.QUEEN, BigDecimal.valueOf(8));

        WeeklyCommit result = commitService.createCommit(draftCycle.getId(), request, userId);

        assertThat(result.getTitle()).isEqualTo("Build login page");
        assertThat(result.getChessCategory()).isEqualTo(ChessCategory.QUEEN);
        assertThat(result.getPlannedHours()).isEqualByComparingTo(BigDecimal.valueOf(8));
        assertThat(result.getWeeklyCycle()).isSameAs(draftCycle);

        verify(auditService).log(eq("WEEKLY_COMMIT"), any(UUID.class), eq("CREATED"), eq(userId), any());
    }

    @Test
    void create_commit_in_locked_cycle_fails() {
        WeeklyCycle lockedCycle = buildCycle(CycleState.LOCKED);
        when(cycleRepository.findByIdWithCommits(lockedCycle.getId())).thenReturn(Optional.of(lockedCycle));

        CreateCommitRequest request = new CreateCommitRequest(
                "Task", null, outcomeId, ChessCategory.QUEEN, BigDecimal.valueOf(4));

        assertThatThrownBy(() -> commitService.createCommit(lockedCycle.getId(), request, userId))
                .isInstanceOf(InvalidStateTransitionException.class)
                .hasMessageContaining("DRAFT");
    }

    @Test
    void second_king_in_same_week_fails() {
        // Add an existing KING commit to the cycle
        WeeklyCommit existingKing = buildCommit(draftCycle, ChessCategory.KING);
        draftCycle.getCommits().add(existingKing);

        when(cycleRepository.findByIdWithCommits(draftCycle.getId())).thenReturn(Optional.of(draftCycle));
        when(outcomeRepository.existsById(outcomeId)).thenReturn(true);

        CreateCommitRequest request = new CreateCommitRequest(
                "Another King", null, outcomeId, ChessCategory.KING, BigDecimal.valueOf(4));

        assertThatThrownBy(() -> commitService.createCommit(draftCycle.getId(), request, userId))
                .isInstanceOf(InvalidStateTransitionException.class)
                .hasMessageContaining("KING");
    }

    @Test
    void title_sanitized_before_save() {
        when(cycleRepository.findByIdWithCommits(draftCycle.getId())).thenReturn(Optional.of(draftCycle));
        when(outcomeRepository.existsById(outcomeId)).thenReturn(true);
        when(commitRepository.save(any(WeeklyCommit.class))).thenAnswer(inv -> {
            WeeklyCommit c = inv.getArgument(0);
            c.setId(UUID.randomUUID());
            return c;
        });

        CreateCommitRequest request = new CreateCommitRequest(
                "<script>alert('xss')</script>Build page", "Desc <img onerror=alert(1)>",
                outcomeId, ChessCategory.QUEEN, BigDecimal.valueOf(4));

        WeeklyCommit result = commitService.createCommit(draftCycle.getId(), request, userId);

        assertThat(result.getTitle()).doesNotContain("<script>");
        assertThat(result.getDescription()).doesNotContain("<img");
    }

    @Test
    void create_commit_with_nonexistent_outcome_fails() {
        when(cycleRepository.findByIdWithCommits(draftCycle.getId())).thenReturn(Optional.of(draftCycle));
        when(outcomeRepository.existsById(outcomeId)).thenReturn(false);

        CreateCommitRequest request = new CreateCommitRequest(
                "Task", null, outcomeId, ChessCategory.QUEEN, BigDecimal.valueOf(4));

        assertThatThrownBy(() -> commitService.createCommit(draftCycle.getId(), request, userId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Outcome");
    }

    // --- update ---

    @Test
    void update_plan_fields_only_in_draft() {
        WeeklyCommit commit = buildCommit(draftCycle, ChessCategory.QUEEN);
        draftCycle.getCommits().add(commit);

        when(commitRepository.findById(commit.getId())).thenReturn(Optional.of(commit));
        when(outcomeRepository.existsById(outcomeId)).thenReturn(true);
        when(commitRepository.save(any(WeeklyCommit.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateCommitRequest request = new UpdateCommitRequest(
                "Updated title", "Updated desc", outcomeId, ChessCategory.ROOK, BigDecimal.valueOf(6));

        WeeklyCommit result = commitService.updateCommit(commit.getId(), request, userId);

        assertThat(result.getTitle()).isEqualTo("Updated title");
        assertThat(result.getDescription()).isEqualTo("Updated desc");
        assertThat(result.getChessCategory()).isEqualTo(ChessCategory.ROOK);
        assertThat(result.getPlannedHours()).isEqualByComparingTo(BigDecimal.valueOf(6));

        verify(auditService).log(eq("WEEKLY_COMMIT"), eq(commit.getId()), eq("UPDATED"), eq(userId), any());
    }

    @Test
    void update_fails_if_cycle_not_in_draft() {
        WeeklyCycle lockedCycle = buildCycle(CycleState.LOCKED);
        WeeklyCommit commit = buildCommit(lockedCycle, ChessCategory.QUEEN);

        when(commitRepository.findById(commit.getId())).thenReturn(Optional.of(commit));

        UpdateCommitRequest request = new UpdateCommitRequest(
                "Updated", null, outcomeId, ChessCategory.QUEEN, BigDecimal.valueOf(4));

        assertThatThrownBy(() -> commitService.updateCommit(commit.getId(), request, userId))
                .isInstanceOf(InvalidStateTransitionException.class)
                .hasMessageContaining("DRAFT");
    }

    @Test
    void update_to_king_fails_if_another_king_exists() {
        WeeklyCommit existingKing = buildCommit(draftCycle, ChessCategory.KING);
        WeeklyCommit commitToUpdate = buildCommit(draftCycle, ChessCategory.QUEEN);
        draftCycle.setCommits(new ArrayList<>(List.of(existingKing, commitToUpdate)));

        when(commitRepository.findById(commitToUpdate.getId())).thenReturn(Optional.of(commitToUpdate));
        when(outcomeRepository.existsById(outcomeId)).thenReturn(true);

        UpdateCommitRequest request = new UpdateCommitRequest(
                "Now a king", null, outcomeId, ChessCategory.KING, BigDecimal.valueOf(4));

        assertThatThrownBy(() -> commitService.updateCommit(commitToUpdate.getId(), request, userId))
                .isInstanceOf(InvalidStateTransitionException.class)
                .hasMessageContaining("KING");
    }

    // --- reconcile ---

    @Test
    void reconcile_fields_only_in_reconciling() {
        WeeklyCycle reconcilingCycle = buildCycle(CycleState.RECONCILING);
        WeeklyCommit commit = buildCommit(reconcilingCycle, ChessCategory.QUEEN);

        when(commitRepository.findById(commit.getId())).thenReturn(Optional.of(commit));
        when(commitRepository.save(any(WeeklyCommit.class))).thenAnswer(inv -> inv.getArgument(0));

        ReconcileCommitRequest request = new ReconcileCommitRequest(
                BigDecimal.valueOf(6), CompletionStatus.COMPLETED, "Done on time");

        WeeklyCommit result = commitService.reconcileCommit(commit.getId(), request, userId);

        assertThat(result.getActualHours()).isEqualByComparingTo(BigDecimal.valueOf(6));
        assertThat(result.getCompletionStatus()).isEqualTo(CompletionStatus.COMPLETED);
        assertThat(result.getReconciliationNotes()).isEqualTo("Done on time");

        verify(auditService).log(eq("WEEKLY_COMMIT"), eq(commit.getId()), eq("RECONCILED"), eq(userId), any());
    }

    @Test
    void reconcile_fails_if_cycle_not_in_reconciling() {
        WeeklyCommit commit = buildCommit(draftCycle, ChessCategory.QUEEN);

        when(commitRepository.findById(commit.getId())).thenReturn(Optional.of(commit));

        ReconcileCommitRequest request = new ReconcileCommitRequest(
                BigDecimal.valueOf(6), CompletionStatus.COMPLETED, null);

        assertThatThrownBy(() -> commitService.reconcileCommit(commit.getId(), request, userId))
                .isInstanceOf(InvalidStateTransitionException.class)
                .hasMessageContaining("RECONCILING");
    }

    // --- soft delete ---

    @Test
    void soft_delete_sets_flag_and_logs_audit() {
        WeeklyCommit commit = buildCommit(draftCycle, ChessCategory.QUEEN);
        draftCycle.getCommits().add(commit);

        when(commitRepository.findById(commit.getId())).thenReturn(Optional.of(commit));
        when(commitRepository.save(any(WeeklyCommit.class))).thenAnswer(inv -> inv.getArgument(0));

        commitService.deleteCommit(commit.getId(), userId);

        ArgumentCaptor<WeeklyCommit> captor = ArgumentCaptor.forClass(WeeklyCommit.class);
        verify(commitRepository).save(captor.capture());
        assertThat(captor.getValue().isDeleted()).isTrue();

        verify(auditService).log(eq("WEEKLY_COMMIT"), eq(commit.getId()), eq("DELETED"), eq(userId), any());
    }

    @Test
    void soft_delete_fails_if_cycle_not_in_draft() {
        WeeklyCycle lockedCycle = buildCycle(CycleState.LOCKED);
        WeeklyCommit commit = buildCommit(lockedCycle, ChessCategory.QUEEN);

        when(commitRepository.findById(commit.getId())).thenReturn(Optional.of(commit));

        assertThatThrownBy(() -> commitService.deleteCommit(commit.getId(), userId))
                .isInstanceOf(InvalidStateTransitionException.class)
                .hasMessageContaining("DRAFT");
    }

    @Test
    void delete_nonexistent_commit_throws() {
        UUID fakeId = UUID.randomUUID();
        when(commitRepository.findById(fakeId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> commitService.deleteCommit(fakeId, userId))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void delete_fails_if_user_does_not_own_cycle() {
        WeeklyCommit commit = buildCommit(draftCycle, ChessCategory.QUEEN);
        draftCycle.getCommits().add(commit);

        when(commitRepository.findById(commit.getId())).thenReturn(Optional.of(commit));

        UUID otherUser = UUID.randomUUID();
        assertThatThrownBy(() -> commitService.deleteCommit(commit.getId(), otherUser))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // --- Helpers ---

    private WeeklyCycle buildCycle(CycleState state) {
        WeeklyCycle cycle = new WeeklyCycle();
        cycle.setId(UUID.randomUUID());
        cycle.setUserId(userId);
        cycle.setState(state);
        cycle.setCommits(new ArrayList<>());
        return cycle;
    }

    private WeeklyCommit buildCommit(WeeklyCycle cycle, ChessCategory category) {
        WeeklyCommit commit = new WeeklyCommit();
        commit.setId(UUID.randomUUID());
        commit.setWeeklyCycle(cycle);
        commit.setTitle("Test commit");
        commit.setOutcomeId(outcomeId);
        commit.setChessCategory(category);
        commit.setPlannedHours(BigDecimal.valueOf(4));
        commit.setPriorityRank(1);
        return commit;
    }
}
