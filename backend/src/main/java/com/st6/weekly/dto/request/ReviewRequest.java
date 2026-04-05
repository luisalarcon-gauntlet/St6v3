package com.st6.weekly.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ReviewRequest(
        @NotBlank(message = "Review notes must not be blank")
        @Size(max = 2000, message = "Review notes must not exceed 2000 characters")
        String reviewerNotes
) {}
