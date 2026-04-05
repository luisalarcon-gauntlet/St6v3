package com.st6.weekly.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegressCycleRequest(
        @NotBlank(message = "Regression reason must not be blank")
        @Size(max = 2000, message = "Reason must not exceed 2000 characters")
        String reason
) {}
