package com.st6.weekly.domain.commit;

import com.st6.weekly.domain.cycle.WeeklyCycle;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "weekly_commits")
@Getter
@Setter
public class WeeklyCommit {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "weekly_cycle_id")
    private WeeklyCycle weeklyCycle;

    @NotBlank
    @Size(max = 200)
    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @NotNull
    @Column(name = "outcome_id", nullable = false)
    private UUID outcomeId;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "chess_category", nullable = false, length = 20)
    private ChessCategory chessCategory;

    @Column(name = "priority_rank")
    private int priorityRank;

    @NotNull
    @DecimalMin("0")
    @DecimalMax("80")
    @Column(name = "planned_hours", nullable = false, precision = 5, scale = 2)
    private BigDecimal plannedHours;

    @DecimalMin("0")
    @DecimalMax("80")
    @Column(name = "actual_hours", precision = 5, scale = 2)
    private BigDecimal actualHours;

    @Enumerated(EnumType.STRING)
    @Column(name = "completion_status", length = 20)
    private CompletionStatus completionStatus;

    @Column(name = "reconciliation_notes", columnDefinition = "TEXT")
    private String reconciliationNotes;

    @Version
    private Long version;

    @Column(name = "is_deleted", nullable = false)
    private boolean deleted = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();
}
