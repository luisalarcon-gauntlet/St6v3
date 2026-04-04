package com.st6.weekly.dto.response;

import com.st6.weekly.domain.cycle.CycleState;
import com.st6.weekly.domain.cycle.WeeklyCycle;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record CycleResponse(
        UUID id,
        UUID userId,
        LocalDate weekStartDate,
        CycleState state,
        Long version,
        Instant lockedAt,
        Instant reconciledAt,
        Instant reviewedAt,
        UUID reviewerId,
        String reviewerNotes,
        List<CommitResponse> commits,
        Instant createdAt,
        Instant updatedAt
) {
    public static CycleResponse from(WeeklyCycle cycle) {
        List<CommitResponse> commitResponses = cycle.getCommits() != null
                ? cycle.getCommits().stream()
                        .filter(c -> !c.isDeleted())
                        .map(CommitResponse::from)
                        .toList()
                : List.of();

        return new CycleResponse(
                cycle.getId(),
                cycle.getUserId(),
                cycle.getWeekStartDate(),
                cycle.getState(),
                cycle.getVersion(),
                cycle.getLockedAt(),
                cycle.getReconciledAt(),
                cycle.getReviewedAt(),
                cycle.getReviewerId(),
                cycle.getReviewerNotes(),
                commitResponses,
                cycle.getCreatedAt(),
                cycle.getUpdatedAt()
        );
    }
}
