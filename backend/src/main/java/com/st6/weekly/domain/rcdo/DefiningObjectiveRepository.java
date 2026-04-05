package com.st6.weekly.domain.rcdo;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface DefiningObjectiveRepository extends JpaRepository<DefiningObjective, UUID> {

    @EntityGraph(attributePaths = {"outcomes"})
    Optional<DefiningObjective> findWithOutcomesById(UUID id);
}
