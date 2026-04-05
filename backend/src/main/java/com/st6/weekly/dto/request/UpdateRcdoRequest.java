package com.st6.weekly.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateRcdoRequest(
        @NotBlank @Size(max = 255) String title,
        String description,
        String status
) {}
