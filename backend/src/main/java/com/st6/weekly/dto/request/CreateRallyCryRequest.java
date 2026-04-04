package com.st6.weekly.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateRallyCryRequest(
        @NotBlank @Size(max = 255) String title,
        String description
) {}
