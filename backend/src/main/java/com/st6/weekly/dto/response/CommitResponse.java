package com.st6.weekly.dto.response;

import com.st6.weekly.domain.commit.ChessCategory;
import com.st6.weekly.domain.commit.CompletionStatus;
import com.st6.weekly.domain.commit.WeeklyCommit;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record CommitResponse(
        UUID id,
        UUID cycleId,
        String title,
        String description,
        UUID outcomeId,
        ChessCategory chessCategory,
        int priorityRank,
        BigDecimal plannedHours,
        BigDecimal actualHours,
        CompletionStatus completionStatus,
        String reconciliationNotes,
        Long version,
        Instant createdAt,
        Instant updatedAt
) {
    public static CommitResponse from(WeeklyCommit commit) {
        return new CommitResponse(
                commit.getId(),
                commit.getWeeklyCycle() != null ? commit.getWeeklyCycle().getId() : null,
                commit.getTitle(),
                commit.getDescription(),
                commit.getOutcomeId(),
                commit.getChessCategory(),
                commit.getPriorityRank(),
                commit.getPlannedHours(),
                commit.getActualHours(),
                commit.getCompletionStatus(),
                commit.getReconciliationNotes(),
                commit.getVersion(),
                commit.getCreatedAt(),
                commit.getUpdatedAt()
        );
    }
}
