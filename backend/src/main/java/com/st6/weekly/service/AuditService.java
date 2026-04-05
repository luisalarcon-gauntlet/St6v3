package com.st6.weekly.service;

import com.st6.weekly.domain.audit.AuditLog;
import com.st6.weekly.domain.audit.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String entityType, UUID entityId, String action, UUID actorId, Map<String, Object> details) {
        AuditLog entry = new AuditLog();
        entry.setEntityType(entityType);
        entry.setEntityId(entityId);
        entry.setAction(action);
        entry.setActorId(actorId);
        entry.setDetails(details);
        auditLogRepository.save(entry);
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void logInCurrentTransaction(String entityType, UUID entityId, String action, UUID actorId, Map<String, Object> details) {
        AuditLog entry = new AuditLog();
        entry.setEntityType(entityType);
        entry.setEntityId(entityId);
        entry.setAction(action);
        entry.setActorId(actorId);
        entry.setDetails(details);
        auditLogRepository.save(entry);
    }
}
