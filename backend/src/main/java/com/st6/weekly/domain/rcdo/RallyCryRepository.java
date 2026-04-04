package com.st6.weekly.domain.rcdo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface RallyCryRepository extends JpaRepository<RallyCry, UUID> {

    @Query("""
            SELECT DISTINCT rc FROM RallyCry rc
            LEFT JOIN FETCH rc.definingObjectives do
            LEFT JOIN FETCH do.outcomes o
            WHERE rc.status = 'ACTIVE'
            ORDER BY rc.displayOrder
            """)
    List<RallyCry> fetchFullTree();
}
