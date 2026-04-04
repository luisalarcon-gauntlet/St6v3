package com.st6.weekly.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateOutcomeRequest(
        @NotNull UUID definingObjectiveId,
        @NotBlank @Size(max = 255) String title,
        String description
) {}
