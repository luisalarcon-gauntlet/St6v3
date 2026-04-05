package com.st6.weekly.dto.response;

import com.st6.weekly.domain.user.User;

import java.util.UUID;

public record TeamOverviewResponse(
        UUID id,
        String email,
        String displayName,
        CycleResponse currentCycle
) {
    public static TeamOverviewResponse from(User user, CycleResponse currentCycle) {
        return new TeamOverviewResponse(
                user.getId(),
                user.getEmail(),
                user.getDisplayName(),
                currentCycle
        );
    }
}
