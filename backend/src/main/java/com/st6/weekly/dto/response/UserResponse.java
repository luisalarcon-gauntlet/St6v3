package com.st6.weekly.dto.response;

import com.st6.weekly.domain.user.Role;
import com.st6.weekly.domain.user.User;

import java.util.UUID;

public record UserResponse(
        UUID id,
        String email,
        String displayName,
        Role role,
        UUID managerId
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getDisplayName(),
                user.getRole(),
                user.getManagerId()
        );
    }
}
