package com.st6.weekly.service;

import com.st6.weekly.domain.cycle.WeeklyCycle;
import com.st6.weekly.domain.cycle.WeeklyCycleRepository;
import com.st6.weekly.domain.user.Role;
import com.st6.weekly.domain.user.User;
import com.st6.weekly.domain.user.UserRepository;
import com.st6.weekly.dto.response.CycleResponse;
import com.st6.weekly.dto.response.TeamOverviewResponse;
import com.st6.weekly.exception.ResourceNotFoundException;
import com.st6.weekly.security.InputSanitizer;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ManagerService {

    private final UserRepository userRepository;
    private final WeeklyCycleRepository cycleRepository;
    private final InputSanitizer inputSanitizer;

    @Transactional(readOnly = true)
    public Page<TeamOverviewResponse> getTeamOverview(UUID managerId, Pageable pageable) {
        verifyManagerRole(managerId);

        Page<User> members = userRepository.findByManagerId(managerId, pageable);
        LocalDate monday = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));

        List<UUID> memberIds = members.getContent().stream()
                .map(User::getId)
                .toList();

        Map<UUID, WeeklyCycle> cyclesByUser = memberIds.isEmpty()
                ? Map.of()
                : cycleRepository.findByUserIdInAndWeekStartDate(memberIds, monday).stream()
                        .collect(Collectors.toMap(WeeklyCycle::getUserId, Function.identity()));

        return members.map(member -> {
            WeeklyCycle cycle = cyclesByUser.get(member.getId());
            CycleResponse cycleResponse = cycle != null ? CycleResponse.from(cycle) : null;
            return TeamOverviewResponse.from(member, cycleResponse);
        });
    }

    @Transactional(readOnly = true)
    public TeamOverviewResponse getTeamMemberDetail(UUID managerId, UUID memberId) {
        verifyManagerRole(managerId);

        User member = userRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + memberId));

        if (!managerId.equals(member.getManagerId())) {
            throw new ResourceNotFoundException("User not found: " + memberId);
        }

        LocalDate monday = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        WeeklyCycle cycle = cycleRepository.findByUserIdAndWeekStartDate(memberId, monday).orElse(null);
        CycleResponse cycleResponse = cycle != null ? CycleResponse.from(cycle) : null;

        return TeamOverviewResponse.from(member, cycleResponse);
    }

    @Transactional
    public CycleResponse submitReview(UUID managerId, UUID cycleId, String reviewerNotes) {
        verifyManagerRole(managerId);

        WeeklyCycle cycle = cycleRepository.findByIdWithCommits(cycleId)
                .orElseThrow(() -> new ResourceNotFoundException("Cycle not found: " + cycleId));

        // Verify the cycle belongs to a team member of this manager
        User cycleOwner = userRepository.findById(cycle.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Cycle owner not found"));
        if (!managerId.equals(cycleOwner.getManagerId())) {
            throw new ResourceNotFoundException("Cycle not found: " + cycleId);
        }

        cycle.setReviewerId(managerId);
        cycle.setReviewerNotes(inputSanitizer.sanitize(reviewerNotes));
        cycle.setReviewedAt(Instant.now());
        cycle.setUpdatedAt(Instant.now());

        return CycleResponse.from(cycleRepository.save(cycle));
    }

    private void verifyManagerRole(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        if (user.getRole() != Role.MANAGER && user.getRole() != Role.ADMIN) {
            throw new ResourceNotFoundException("User not found: " + userId);
        }
    }
}
