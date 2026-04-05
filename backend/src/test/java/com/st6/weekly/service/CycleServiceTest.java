package com.st6.weekly.service;

import com.st6.weekly.domain.commit.ChessCategory;
import com.st6.weekly.domain.commit.CompletionStatus;
import com.st6.weekly.domain.commit.WeeklyCommit;
import com.st6.weekly.domain.commit.WeeklyCommitRepository;
import com.st6.weekly.domain.cycle.CycleState;
import com.st6.weekly.domain.cycle.CycleStateMachine;
import com.st6.weekly.domain.cycle.WeeklyCycle;
import com.st6.weekly.domain.cycle.WeeklyCycleRepository;
import com.st6.weekly.domain.user.Role;
import com.st6.weekly.domain.user.User;
import com.st6.weekly.domain.user.UserRepository;
import com.st6.weekly.exception.InvalidStateTransitionException;
import com.st6.weekly.exception.ResourceNotFoundException;
import com.st6.weekly.security.InputSanitizer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CycleServiceTest {

    @Mock
    private WeeklyCycleRepository cycleRepository;

    @Mock
    private WeeklyCommitRepository commitRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private InputSanitizer inputSanitizer;

    @Mock
    private AuditService auditService;

    @Spy
    private CycleStateMachine stateMachine;

    private CycleService cycleService;

    private UUID userId;
    private UUID managerId;
    private LocalDate currentMonday;
    private Clock clock;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        managerId = UUID.randomUUID();
        clock = Clock.systemDefaultZone();
        cycleService = new CycleService(cycleRepository, commitRepository, stateMachine, clock,
                userRepository, inputSanitizer, auditService);
        currentMonday = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
    }

    // --- getOrCreateCurrentCycle ---

    @Test
    void getOrCreateCurrentCycle_creates_draft_if_none_exists() {
        when(cycleRepository.findByUserIdAndWeekStartDate(eq(userId), any(LocalDate.class)))
                .thenReturn(Optional.empty());
        when(cycleRepository.save(any(WeeklyCycle.class)))
                .thenAnswer(inv -> {
                    WeeklyCycle c = inv.getArgument(0);
                    c.setId(UUID.randomUUID());
                    return c;
                });

        WeeklyCycle result = cycleService.getOrCreateCurrentCycle(userId);

        assertThat(result.getState()).isEqualTo(CycleState.DRAFT);
        assertThat(result.getUserId()).isEqualTo(userId);
        assertThat(result.getWeekStartDate()).isEqualTo(currentMonday);

        ArgumentCaptor<WeeklyCycle> captor = ArgumentCaptor.forClass(WeeklyCycle.class);
        verify(cycleRepository).save(captor.capture());
        assertThat(captor.getValue().getState()).isEqualTo(CycleState.DRAFT);
    }

    @Test
    void getOrCreateCurrentCycle_returns_existing_if_present() {
        WeeklyCycle existing = buildCycle(CycleState.DRAFT);
        when(cycleRepository.findByUserIdAndWeekStartDate(eq(userId), any(LocalDate.class)))
                .thenReturn(Optional.of(existing));

        WeeklyCycle result = cycleService.getOrCreateCurrentCycle(userId);

        assertThat(result).isSameAs(existing);
        verify(cycleRepository, never()).save(any());
    }

    // --- lockCycle ---

    @Test
    void lockCycle_succeeds_with_valid_commits() {
        WeeklyCycle cycle = buildCycleWithValidCommits();
        when(cycleRepository.findByIdWithCommits(cycle.getId())).thenReturn(Optional.of(cycle));
        when(cycleRepository.save(any(WeeklyCycle.class))).thenAnswer(inv -> inv.getArgument(0));

        WeeklyCycle result = cycleService.lockCycle(cycle.getId(), userId);

        assertThat(result.getState()).isEqualTo(CycleState.LOCKED);
        assertThat(result.getLockedAt()).isNotNull();
    }

    @Test
    void lockCycle_fails_without_king() {
        WeeklyCycle cycle = buildCycle(CycleState.DRAFT);
        // 3 commits, none are KING
        cycle.setCommits(List.of(
                buildCommit(cycle, ChessCategory.QUEEN),
                buildCommit(cycle, ChessCategory.ROOK),
                buildCommit(cycle, ChessCategory.PAWN)
        ));
        when(cycleRepository.findByIdWithCommits(cycle.getId())).thenReturn(Optional.of(cycle));

        assertThatThrownBy(() -> cycleService.lockCycle(cycle.getId(), userId))
                .isInstanceOf(InvalidStateTransitionException.class)
                .hasMessageContaining("KING");
    }

    @Test
    void lockCycle_fails_with_fewer_than_3_commits() {
        WeeklyCycle cycle = buildCycle(CycleState.DRAFT);
        cycle.setCommits(List.of(
                buildCommit(cycle, ChessCategory.KING),
                buildCommit(cycle, ChessCategory.QUEEN)
        ));
        when(cycleRepository.findByIdWithCommits(cycle.getId())).thenReturn(Optional.of(cycle));

        assertThatThrownBy(() -> cycleService.lockCycle(cycle.getId(), userId))
                .isInstanceOf(InvalidStateTransitionException.class)
                .hasMessageContaining("3 commits");
    }

    @Test
    void lockCycle_fails_if_not_in_draft_state() {
        WeeklyCycle cycle = buildCycle(CycleState.LOCKED);
        when(cycleRepository.findByIdWithCommits(cycle.getId())).thenReturn(Optional.of(cycle));

        assertThatThrownBy(() -> cycleService.lockCycle(cycle.getId(), userId))
                .isInstanceOf(InvalidStateTransitionException.class)
                .hasMessageContaining("Cannot transition");
    }

    @Test
    void lockCycle_fails_if_cycle_not_found() {
        UUID cycleId = UUID.randomUUID();
        when(cycleRepository.findByIdWithCommits(cycleId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> cycleService.lockCycle(cycleId, userId))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void lockCycle_fails_if_user_does_not_own_cycle() {
        WeeklyCycle cycle = buildCycleWithValidCommits();
        when(cycleRepository.findByIdWithCommits(cycle.getId())).thenReturn(Optional.of(cycle));

        UUID otherUser = UUID.randomUUID();
        assertThatThrownBy(() -> cycleService.lockCycle(cycle.getId(), otherUser))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // --- startReconciliation ---

    @Test
    void startReconciliation_succeeds_from_locked() {
        WeeklyCycle cycle = buildCycle(CycleState.LOCKED);
        when(cycleRepository.findByIdWithCommits(cycle.getId())).thenReturn(Optional.of(cycle));
        when(cycleRepository.save(any(WeeklyCycle.class))).thenAnswer(inv -> inv.getArgument(0));

        WeeklyCycle result = cycleService.startReconciliation(cycle.getId(), userId);

        assertThat(result.getState()).isEqualTo(CycleState.RECONCILING);
    }

    @Test
    void startReconciliation_fails_from_draft() {
        WeeklyCycle cycle = buildCycle(CycleState.DRAFT);
        when(cycleRepository.findByIdWithCommits(cycle.getId())).thenReturn(Optional.of(cycle));

        assertThatThrownBy(() -> cycleService.startReconciliation(cycle.getId(), userId))
                .isInstanceOf(InvalidStateTransitionException.class);
    }

    // --- reconcile ---

    @Test
    void reconcile_succeeds_when_all_statuses_set() {
        WeeklyCycle cycle = buildCycle(CycleState.RECONCILING);
        List<WeeklyCommit> commits = new ArrayList<>();
        WeeklyCommit c1 = buildCommit(cycle, ChessCategory.KING);
        c1.setCompletionStatus(CompletionStatus.COMPLETED);
        WeeklyCommit c2 = buildCommit(cycle, ChessCategory.QUEEN);
        c2.setCompletionStatus(CompletionStatus.IN_PROGRESS);
        WeeklyCommit c3 = buildCommit(cycle, ChessCategory.ROOK);
        c3.setCompletionStatus(CompletionStatus.DROPPED);
        commits.add(c1);
        commits.add(c2);
        commits.add(c3);
        cycle.setCommits(commits);

        when(cycleRepository.findByIdWithCommits(cycle.getId())).thenReturn(Optional.of(cycle));
        when(cycleRepository.save(any(WeeklyCycle.class))).thenAnswer(inv -> inv.getArgument(0));

        WeeklyCycle result = cycleService.reconcile(cycle.getId(), userId);

        assertThat(result.getState()).isEqualTo(CycleState.RECONCILED);
        assertThat(result.getReconciledAt()).isNotNull();
    }

    @Test
    void reconcile_fails_when_any_status_missing() {
        WeeklyCycle cycle = buildCycle(CycleState.RECONCILING);
        List<WeeklyCommit> commits = new ArrayList<>();
        WeeklyCommit c1 = buildCommit(cycle, ChessCategory.KING);
        c1.setCompletionStatus(CompletionStatus.COMPLETED);
        WeeklyCommit c2 = buildCommit(cycle, ChessCategory.QUEEN);
        // c2 has no completionStatus — null
        WeeklyCommit c3 = buildCommit(cycle, ChessCategory.ROOK);
        c3.setCompletionStatus(CompletionStatus.IN_PROGRESS);
        commits.add(c1);
        commits.add(c2);
        commits.add(c3);
        cycle.setCommits(commits);

        when(cycleRepository.findByIdWithCommits(cycle.getId())).thenReturn(Optional.of(cycle));

        assertThatThrownBy(() -> cycleService.reconcile(cycle.getId(), userId))
                .isInstanceOf(InvalidStateTransitionException.class)
                .hasMessageContaining("completion_status");
    }

    @Test
    void reconcile_succeeds_when_commit_is_dropped() {
        WeeklyCycle cycle = buildCycle(CycleState.RECONCILING);
        List<WeeklyCommit> commits = new ArrayList<>();
        WeeklyCommit c1 = buildCommit(cycle, ChessCategory.KING);
        c1.setCompletionStatus(CompletionStatus.DROPPED);
        commits.add(c1);
        cycle.setCommits(commits);

        when(cycleRepository.findByIdWithCommits(cycle.getId())).thenReturn(Optional.of(cycle));
        when(cycleRepository.save(any(WeeklyCycle.class))).thenAnswer(inv -> inv.getArgument(0));

        WeeklyCycle result = cycleService.reconcile(cycle.getId(), userId);

        assertThat(result.getState()).isEqualTo(CycleState.RECONCILED);
        assertThat(result.getReconciledAt()).isNotNull();
    }

    // --- getCycles (paginated) ---

    @Test
    void getCycles_returns_paginated_results() {
        Pageable pageable = PageRequest.of(0, 20);
        List<WeeklyCycle> cycles = List.of(buildCycle(CycleState.DRAFT), buildCycle(CycleState.LOCKED));
        Page<WeeklyCycle> page = new PageImpl<>(cycles, pageable, 2);

        when(cycleRepository.findByUserIdOrderByWeekStartDateDesc(userId, pageable)).thenReturn(page);

        Page<WeeklyCycle> result = cycleService.getCycles(userId, pageable);

        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getTotalElements()).isEqualTo(2);
    }

    // --- getCycleById ---

    @Test
    void getCycleById_returns_cycle_for_owner() {
        WeeklyCycle cycle = buildCycle(CycleState.DRAFT);
        when(cycleRepository.findByIdWithCommits(cycle.getId())).thenReturn(Optional.of(cycle));

        WeeklyCycle result = cycleService.getCycleById(cycle.getId(), userId);

        assertThat(result).isSameAs(cycle);
    }

    @Test
    void getCycleById_throws_if_not_found() {
        UUID cycleId = UUID.randomUUID();
        when(cycleRepository.findByIdWithCommits(cycleId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> cycleService.getCycleById(cycleId, userId))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getCycleById_throws_if_not_owner() {
        WeeklyCycle cycle = buildCycle(CycleState.DRAFT);
        when(cycleRepository.findByIdWithCommits(cycle.getId())).thenReturn(Optional.of(cycle));

        UUID otherUser = UUID.randomUUID();
        assertThatThrownBy(() -> cycleService.getCycleById(cycle.getId(), otherUser))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // --- week_start_date calculation ---

    @Test
    void getOrCreateCurrentCycle_on_sunday_returns_previous_monday() {
        // 2026-04-05 is a Sunday; the previous Monday is 2026-03-30
        LocalDate sunday = LocalDate.of(2026, 4, 5);
        LocalDate expectedMonday = LocalDate.of(2026, 3, 30);
        Clock sundayClock = Clock.fixed(
                sunday.atStartOfDay(ZoneOffset.UTC).toInstant(),
                ZoneId.of("UTC")
        );
        CycleService sundayService = new CycleService(
                cycleRepository, commitRepository, stateMachine, sundayClock,
                userRepository, inputSanitizer, auditService);

        when(cycleRepository.findByUserIdAndWeekStartDate(eq(userId), eq(expectedMonday)))
                .thenReturn(Optional.empty());
        when(cycleRepository.save(any(WeeklyCycle.class)))
                .thenAnswer(inv -> {
                    WeeklyCycle c = inv.getArgument(0);
                    c.setId(UUID.randomUUID());
                    return c;
                });

        WeeklyCycle result = sundayService.getOrCreateCurrentCycle(userId);

        assertThat(result.getWeekStartDate()).isEqualTo(expectedMonday);
        assertThat(result.getWeekStartDate().getDayOfWeek()).isEqualTo(DayOfWeek.MONDAY);
    }

    // --- regressCycle ---

    @Test
    void regressCycle_updates_state_to_draft() {
        WeeklyCycle cycle = buildCycle(CycleState.LOCKED);
        User owner = buildUser(userId, Role.MEMBER, managerId);

        when(cycleRepository.findByIdWithCommits(cycle.getId())).thenReturn(Optional.of(cycle));
        when(userRepository.findById(cycle.getUserId())).thenReturn(Optional.of(owner));
        when(inputSanitizer.sanitize("Re-plan needed")).thenReturn("Re-plan needed");
        when(cycleRepository.save(any(WeeklyCycle.class))).thenAnswer(inv -> inv.getArgument(0));

        WeeklyCycle result = cycleService.regressCycle(cycle.getId(), managerId, "Re-plan needed");

        assertThat(result.getState()).isEqualTo(CycleState.DRAFT);
    }

    @Test
    void regressCycle_creates_audit_entry() {
        WeeklyCycle cycle = buildCycle(CycleState.LOCKED);
        User owner = buildUser(userId, Role.MEMBER, managerId);

        when(cycleRepository.findByIdWithCommits(cycle.getId())).thenReturn(Optional.of(cycle));
        when(userRepository.findById(cycle.getUserId())).thenReturn(Optional.of(owner));
        when(inputSanitizer.sanitize("Re-plan needed")).thenReturn("Re-plan needed");
        when(cycleRepository.save(any(WeeklyCycle.class))).thenAnswer(inv -> inv.getArgument(0));

        cycleService.regressCycle(cycle.getId(), managerId, "Re-plan needed");

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> detailsCaptor = ArgumentCaptor.forClass(Map.class);
        verify(auditService).logInCurrentTransaction(
                eq("WEEKLY_CYCLE"), eq(cycle.getId()), eq("REGRESSED"),
                eq(managerId), detailsCaptor.capture());

        Map<String, Object> details = detailsCaptor.getValue();
        assertThat(details).containsEntry("previous_state", "LOCKED");
        assertThat(details).containsEntry("new_state", "DRAFT");
        assertThat(details).containsEntry("reason", "Re-plan needed");
        assertThat(details).containsKey("timestamp");
    }

    @Test
    void regressCycle_rejects_if_not_managers_direct_report() {
        WeeklyCycle cycle = buildCycle(CycleState.LOCKED);
        UUID otherManagerId = UUID.randomUUID();
        User owner = buildUser(userId, Role.MEMBER, otherManagerId); // belongs to different manager

        when(cycleRepository.findByIdWithCommits(cycle.getId())).thenReturn(Optional.of(cycle));
        when(userRepository.findById(cycle.getUserId())).thenReturn(Optional.of(owner));

        assertThatThrownBy(() -> cycleService.regressCycle(cycle.getId(), managerId, "Reason"))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void regressCycle_rejects_from_draft() {
        WeeklyCycle cycle = buildCycle(CycleState.DRAFT);
        User owner = buildUser(userId, Role.MEMBER, managerId);

        when(cycleRepository.findByIdWithCommits(cycle.getId())).thenReturn(Optional.of(cycle));
        when(userRepository.findById(cycle.getUserId())).thenReturn(Optional.of(owner));
        when(inputSanitizer.sanitize("Reason")).thenReturn("Reason");

        assertThatThrownBy(() -> cycleService.regressCycle(cycle.getId(), managerId, "Reason"))
                .isInstanceOf(InvalidStateTransitionException.class)
                .hasMessageContaining("Cannot regress");
    }

    @Test
    void regressCycle_sanitizes_reason() {
        WeeklyCycle cycle = buildCycle(CycleState.LOCKED);
        User owner = buildUser(userId, Role.MEMBER, managerId);

        when(cycleRepository.findByIdWithCommits(cycle.getId())).thenReturn(Optional.of(cycle));
        when(userRepository.findById(cycle.getUserId())).thenReturn(Optional.of(owner));
        when(inputSanitizer.sanitize("<script>alert('xss')</script>Reason")).thenReturn("Reason");
        when(cycleRepository.save(any(WeeklyCycle.class))).thenAnswer(inv -> inv.getArgument(0));

        cycleService.regressCycle(cycle.getId(), managerId, "<script>alert('xss')</script>Reason");

        verify(inputSanitizer).sanitize("<script>alert('xss')</script>Reason");

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> detailsCaptor = ArgumentCaptor.forClass(Map.class);
        verify(auditService).logInCurrentTransaction(
                any(), any(), any(), any(), detailsCaptor.capture());
        assertThat(detailsCaptor.getValue()).containsEntry("reason", "Reason");
    }

    // --- Helpers ---

    private User buildUser(UUID id, Role role, UUID userManagerId) {
        User user = new User();
        user.setId(id);
        user.setEmail(id + "@st6.com");
        user.setDisplayName("Test User");
        user.setPasswordHash("hash");
        user.setRole(role);
        user.setManagerId(userManagerId);
        return user;
    }

    private WeeklyCycle buildCycle(CycleState state) {
        WeeklyCycle cycle = new WeeklyCycle();
        cycle.setId(UUID.randomUUID());
        cycle.setUserId(userId);
        cycle.setWeekStartDate(currentMonday);
        cycle.setState(state);
        cycle.setCommits(new ArrayList<>());
        return cycle;
    }

    private WeeklyCycle buildCycleWithValidCommits() {
        WeeklyCycle cycle = buildCycle(CycleState.DRAFT);
        cycle.setCommits(List.of(
                buildCommit(cycle, ChessCategory.KING),
                buildCommit(cycle, ChessCategory.QUEEN),
                buildCommit(cycle, ChessCategory.ROOK)
        ));
        return cycle;
    }

    private WeeklyCommit buildCommit(WeeklyCycle cycle, ChessCategory category) {
        WeeklyCommit commit = new WeeklyCommit();
        commit.setId(UUID.randomUUID());
        commit.setWeeklyCycle(cycle);
        commit.setTitle("Test commit");
        commit.setOutcomeId(UUID.randomUUID());
        commit.setChessCategory(category);
        commit.setPlannedHours(BigDecimal.valueOf(4));
        commit.setPriorityRank(1);
        return commit;
    }
}
