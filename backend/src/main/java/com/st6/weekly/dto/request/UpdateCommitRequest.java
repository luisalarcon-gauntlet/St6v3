package com.st6.weekly.dto.request;

import com.st6.weekly.domain.commit.ChessCategory;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

public record UpdateCommitRequest(
        @NotBlank @Size(max = 200) String title,
        String description,
        @NotNull UUID outcomeId,
        @NotNull ChessCategory chessCategory,
        @NotNull @DecimalMin("0") @DecimalMax("80") BigDecimal plannedHours
) {}
