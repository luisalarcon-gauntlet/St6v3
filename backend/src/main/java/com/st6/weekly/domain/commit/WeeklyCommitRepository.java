package com.st6.weekly.domain.commit;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface WeeklyCommitRepository extends JpaRepository<WeeklyCommit, UUID> {

    List<WeeklyCommit> findByWeeklyCycleIdAndDeletedFalse(UUID cycleId);
}
