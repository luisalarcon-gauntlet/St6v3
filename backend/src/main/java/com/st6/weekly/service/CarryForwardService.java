package com.st6.weekly.service;

import com.st6.weekly.domain.commit.CompletionStatus;
import com.st6.weekly.domain.commit.WeeklyCommit;
import com.st6.weekly.domain.commit.WeeklyCommitRepository;
import com.st6.weekly.domain.cycle.CycleState;
import com.st6.weekly.domain.cycle.WeeklyCycle;
import com.st6.weekly.domain.cycle.WeeklyCycleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class CarryForwardService {

    private static final Set<CompletionStatus> CARRY_STATUSES = Set.of(
            CompletionStatus.NOT_STARTED,
            CompletionStatus.IN_PROGRESS
    );

    private final WeeklyCycleRepository cycleRepository;
    private final WeeklyCommitRepository commitRepository;

    @Transactional
    public void carryForward(WeeklyCycle reconciledCycle) {
        List<WeeklyCommit> toCarry = reconciledCycle.getCommits().stream()
                .filter(c -> !c.isDeleted())
                .filter(c -> c.getCompletionStatus() != null && CARRY_STATUSES.contains(c.getCompletionStatus()))
                .toList();

        if (toCarry.isEmpty()) {
            // Still create next week's draft even with nothing to carry
            getOrCreateNextWeekCycle(reconciledCycle);
            return;
        }

        WeeklyCycle nextCycle = getOrCreateNextWeekCycle(reconciledCycle);

        // Mark originals as CARRIED_FORWARD
        toCarry.forEach(c -> c.setCompletionStatus(CompletionStatus.CARRIED_FORWARD));

        // Create copies in next cycle
        List<WeeklyCommit> copies = toCarry.stream()
                .map(original -> {
                    WeeklyCommit copy = new WeeklyCommit();
                    copy.setWeeklyCycle(nextCycle);
                    copy.setTitle(original.getTitle());
                    copy.setDescription(original.getDescription());
                    copy.setOutcomeId(original.getOutcomeId());
                    copy.setChessCategory(original.getChessCategory());
                    copy.setPlannedHours(original.getPlannedHours());
                    copy.setPriorityRank(original.getPriorityRank());
                    // completionStatus left null (fresh start)
                    return copy;
                })
                .toList();

        commitRepository.saveAll(copies);
    }

    private WeeklyCycle getOrCreateNextWeekCycle(WeeklyCycle current) {
        return cycleRepository.findByUserIdAndWeekStartDate(
                        current.getUserId(),
                        current.getWeekStartDate().plusWeeks(1))
                .orElseGet(() -> {
                    WeeklyCycle next = new WeeklyCycle();
                    next.setUserId(current.getUserId());
                    next.setWeekStartDate(current.getWeekStartDate().plusWeeks(1));
                    next.setState(CycleState.DRAFT);
                    return cycleRepository.save(next);
                });
    }
}
