package com.st6.weekly.domain.rcdo;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface OutcomeRepository extends JpaRepository<Outcome, UUID> {
}
