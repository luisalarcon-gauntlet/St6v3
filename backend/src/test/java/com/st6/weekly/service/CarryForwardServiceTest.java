package com.st6.weekly.service;

import com.st6.weekly.domain.commit.ChessCategory;
import com.st6.weekly.domain.commit.CompletionStatus;
import com.st6.weekly.domain.commit.WeeklyCommit;
import com.st6.weekly.domain.commit.WeeklyCommitRepository;
import com.st6.weekly.domain.cycle.CycleState;
import com.st6.weekly.domain.cycle.WeeklyCycle;
import com.st6.weekly.domain.cycle.WeeklyCycleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import com.st6.weekly.security.InputSanitizer;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CarryForwardServiceTest {

    @Mock private WeeklyCycleRepository cycleRepository;
    @Mock private WeeklyCommitRepository commitRepository;
    @Spy private InputSanitizer inputSanitizer;
    @InjectMocks private CarryForwardService carryForwardService;

    private UUID userId;
    private LocalDate thisMonday;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        thisMonday = LocalDate.of(2026, 4, 6); // a Monday
    }

    @Test
    void creates_new_draft_cycle_for_next_week() {
        WeeklyCycle reconciled = buildReconciledCycle(List.of());
        when(cycleRepository.findByUserIdAndWeekStartDate(userId, thisMonday.plusWeeks(1)))
                .thenReturn(Optional.empty());
        when(cycleRepository.save(any(WeeklyCycle.class))).thenAnswer(inv -> {
            WeeklyCycle c = inv.getArgument(0);
            c.setId(UUID.randomUUID());
            return c;
        });

        carryForwardService.carryForward(reconciled);

        ArgumentCaptor<WeeklyCycle> captor = ArgumentCaptor.forClass(WeeklyCycle.class);
        verify(cycleRepository).save(captor.capture());
        WeeklyCycle newCycle = captor.getValue();
        assertThat(newCycle.getState()).isEqualTo(CycleState.DRAFT);
        assertThat(newCycle.getWeekStartDate()).isEqualTo(thisMonday.plusWeeks(1));
        assertThat(newCycle.getUserId()).isEqualTo(userId);
    }

    @Test
    void copies_incomplete_commits_to_new_cycle() {
        WeeklyCommit inProgress = buildCommit(ChessCategory.QUEEN, CompletionStatus.IN_PROGRESS);
        WeeklyCommit notStarted = buildCommit(ChessCategory.ROOK, CompletionStatus.NOT_STARTED);
        WeeklyCycle reconciled = buildReconciledCycle(List.of(inProgress, notStarted));

        when(cycleRepository.findByUserIdAndWeekStartDate(userId, thisMonday.plusWeeks(1)))
                .thenReturn(Optional.empty());
        when(cycleRepository.save(any(WeeklyCycle.class))).thenAnswer(inv -> {
            WeeklyCycle c = inv.getArgument(0);
            c.setId(UUID.randomUUID());
            return c;
        });

        carryForwardService.carryForward(reconciled);

        ArgumentCaptor<List<WeeklyCommit>> captor = ArgumentCaptor.forClass(List.class);
        verify(commitRepository).saveAll(captor.capture());
        List<WeeklyCommit> carried = captor.getValue();
        assertThat(carried).hasSize(2);
        assertThat(carried).allMatch(c -> c.getCompletionStatus() == null);
    }

    @Test
    void does_not_copy_completed_or_dropped_commits() {
        WeeklyCommit completed = buildCommit(ChessCategory.KING, CompletionStatus.COMPLETED);
        WeeklyCommit dropped = buildCommit(ChessCategory.PAWN, CompletionStatus.DROPPED);
        WeeklyCommit inProgress = buildCommit(ChessCategory.QUEEN, CompletionStatus.IN_PROGRESS);
        WeeklyCycle reconciled = buildReconciledCycle(List.of(completed, dropped, inProgress));

        when(cycleRepository.findByUserIdAndWeekStartDate(userId, thisMonday.plusWeeks(1)))
                .thenReturn(Optional.empty());
        when(cycleRepository.save(any(WeeklyCycle.class))).thenAnswer(inv -> {
            WeeklyCycle c = inv.getArgument(0);
            c.setId(UUID.randomUUID());
            return c;
        });

        carryForwardService.carryForward(reconciled);

        ArgumentCaptor<List<WeeklyCommit>> captor = ArgumentCaptor.forClass(List.class);
        verify(commitRepository).saveAll(captor.capture());
        assertThat(captor.getValue()).hasSize(1); // only inProgress
    }

    @Test
    void sets_original_commit_status_to_carried_forward() {
        WeeklyCommit inProgress = buildCommit(ChessCategory.QUEEN, CompletionStatus.IN_PROGRESS);
        WeeklyCycle reconciled = buildReconciledCycle(List.of(inProgress));

        when(cycleRepository.findByUserIdAndWeekStartDate(userId, thisMonday.plusWeeks(1)))
                .thenReturn(Optional.empty());
        when(cycleRepository.save(any(WeeklyCycle.class))).thenAnswer(inv -> {
            WeeklyCycle c = inv.getArgument(0);
            c.setId(UUID.randomUUID());
            return c;
        });

        carryForwardService.carryForward(reconciled);

        assertThat(inProgress.getCompletionStatus()).isEqualTo(CompletionStatus.CARRIED_FORWARD);
        verify(commitRepository).saveAll(anyList()); // originals saved via cascade or explicit
    }

    // --- Helpers ---

    private WeeklyCycle buildReconciledCycle(List<WeeklyCommit> commits) {
        WeeklyCycle cycle = new WeeklyCycle();
        cycle.setId(UUID.randomUUID());
        cycle.setUserId(userId);
        cycle.setWeekStartDate(thisMonday);
        cycle.setState(CycleState.RECONCILED);
        cycle.setCommits(new ArrayList<>(commits));
        commits.forEach(c -> c.setWeeklyCycle(cycle));
        return cycle;
    }

    private WeeklyCommit buildCommit(ChessCategory category, CompletionStatus status) {
        WeeklyCommit commit = new WeeklyCommit();
        commit.setId(UUID.randomUUID());
        commit.setTitle("Test " + category.name());
        commit.setOutcomeId(UUID.randomUUID());
        commit.setChessCategory(category);
        commit.setPlannedHours(BigDecimal.valueOf(4));
        commit.setPriorityRank(1);
        commit.setCompletionStatus(status);
        return commit;
    }
}
