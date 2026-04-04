package com.st6.weekly.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record ReorderCommitRequest(
        @NotNull @Min(0) Integer priorityRank
) {}
