package com.st6.weekly.domain.cycle;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WeeklyCycleRepository extends JpaRepository<WeeklyCycle, UUID> {

    Optional<WeeklyCycle> findByUserIdAndWeekStartDate(UUID userId, LocalDate weekStartDate);

    @EntityGraph(attributePaths = {"commits"})
    @Query("SELECT c FROM WeeklyCycle c WHERE c.id = :id")
    Optional<WeeklyCycle> findByIdWithCommits(UUID id);

    @EntityGraph(attributePaths = {"commits"})
    Page<WeeklyCycle> findByUserIdOrderByWeekStartDateDesc(UUID userId, Pageable pageable);

    @EntityGraph(attributePaths = {"commits"})
    @Query("SELECT c FROM WeeklyCycle c WHERE c.userId IN :userIds AND c.weekStartDate = :weekStartDate")
    List<WeeklyCycle> findByUserIdInAndWeekStartDate(List<UUID> userIds, LocalDate weekStartDate);
}
