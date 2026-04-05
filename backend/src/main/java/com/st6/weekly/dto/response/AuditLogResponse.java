package com.st6.weekly.dto.response;

import com.st6.weekly.domain.audit.AuditLog;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record AuditLogResponse(
        UUID id,
        String entityType,
        UUID entityId,
        String action,
        UUID actorId,
        String actorDisplayName,
        Map<String, Object> details,
        Instant createdAt
) {
    public static AuditLogResponse from(AuditLog log, String actorDisplayName) {
        return new AuditLogResponse(
                log.getId(),
                log.getEntityType(),
                log.getEntityId(),
                log.getAction(),
                log.getActorId(),
                actorDisplayName,
                log.getDetails(),
                log.getCreatedAt()
        );
    }
}
