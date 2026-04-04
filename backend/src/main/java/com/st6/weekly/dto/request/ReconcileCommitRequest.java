package com.st6.weekly.dto.request;

import com.st6.weekly.domain.commit.CompletionStatus;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record ReconcileCommitRequest(
        @NotNull @DecimalMin("0") @DecimalMax("80") BigDecimal actualHours,
        @NotNull CompletionStatus completionStatus,
        String reconciliationNotes
) {}
