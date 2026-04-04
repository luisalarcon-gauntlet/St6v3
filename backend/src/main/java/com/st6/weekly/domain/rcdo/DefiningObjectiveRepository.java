package com.st6.weekly.domain.rcdo;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface DefiningObjectiveRepository extends JpaRepository<DefiningObjective, UUID> {
}
