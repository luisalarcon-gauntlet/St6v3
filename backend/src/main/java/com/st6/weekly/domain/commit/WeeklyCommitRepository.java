package com.st6.weekly.domain.commit;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WeeklyCommitRepository extends JpaRepository<WeeklyCommit, UUID> {

    List<WeeklyCommit> findByWeeklyCycleIdAndDeletedFalse(UUID cycleId);

    @EntityGraph(attributePaths = {"weeklyCycle"})
    @Query("SELECT c FROM WeeklyCommit c WHERE c.id = :id")
    Optional<WeeklyCommit> findByIdWithCycle(@Param("id") UUID id);
}
