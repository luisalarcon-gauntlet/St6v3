package com.st6.weekly.domain;

import com.st6.weekly.domain.commit.ChessCategory;
import com.st6.weekly.domain.commit.WeeklyCommit;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class WeeklyCommitValidationTest {

    private static Validator validator;

    @BeforeAll
    static void setUpValidator() {
        try (ValidatorFactory factory = Validation.buildDefaultValidatorFactory()) {
            validator = factory.getValidator();
        }
    }

    @Test
    void valid_commit_has_no_violations() {
        WeeklyCommit commit = validCommit();
        Set<ConstraintViolation<WeeklyCommit>> violations = validator.validate(commit);
        assertThat(violations).isEmpty();
    }

    @Test
    void title_cannot_be_blank() {
        WeeklyCommit commit = validCommit();
        commit.setTitle("");
        Set<ConstraintViolation<WeeklyCommit>> violations = validator.validate(commit);
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("title"));
    }

    @Test
    void title_cannot_be_null() {
        WeeklyCommit commit = validCommit();
        commit.setTitle(null);
        Set<ConstraintViolation<WeeklyCommit>> violations = validator.validate(commit);
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("title"));
    }

    @Test
    void title_cannot_exceed_200_chars() {
        WeeklyCommit commit = validCommit();
        commit.setTitle("x".repeat(201));
        Set<ConstraintViolation<WeeklyCommit>> violations = validator.validate(commit);
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("title"));
    }

    @Test
    void title_at_200_chars_is_valid() {
        WeeklyCommit commit = validCommit();
        commit.setTitle("x".repeat(200));
        Set<ConstraintViolation<WeeklyCommit>> violations = validator.validate(commit);
        assertThat(violations).isEmpty();
    }

    @Test
    void planned_hours_must_be_between_0_and_80() {
        WeeklyCommit commit = validCommit();

        commit.setPlannedHours(new BigDecimal("-1"));
        Set<ConstraintViolation<WeeklyCommit>> violations = validator.validate(commit);
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("plannedHours"));

        commit.setPlannedHours(new BigDecimal("81"));
        violations = validator.validate(commit);
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("plannedHours"));
    }

    @Test
    void planned_hours_at_boundaries_are_valid() {
        WeeklyCommit commit = validCommit();

        commit.setPlannedHours(BigDecimal.ZERO);
        assertThat(validator.validate(commit)).isEmpty();

        commit.setPlannedHours(new BigDecimal("80"));
        assertThat(validator.validate(commit)).isEmpty();
    }

    @Test
    void outcome_id_is_required() {
        WeeklyCommit commit = validCommit();
        commit.setOutcomeId(null);
        Set<ConstraintViolation<WeeklyCommit>> violations = validator.validate(commit);
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("outcomeId"));
    }

    @Test
    void chess_category_is_required() {
        WeeklyCommit commit = validCommit();
        commit.setChessCategory(null);
        Set<ConstraintViolation<WeeklyCommit>> violations = validator.validate(commit);
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("chessCategory"));
    }

    @Test
    void actual_hours_when_set_must_be_between_0_and_80() {
        WeeklyCommit commit = validCommit();

        commit.setActualHours(new BigDecimal("-1"));
        Set<ConstraintViolation<WeeklyCommit>> violations = validator.validate(commit);
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("actualHours"));

        commit.setActualHours(new BigDecimal("81"));
        violations = validator.validate(commit);
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("actualHours"));
    }

    // --- Helper ---

    private WeeklyCommit validCommit() {
        WeeklyCommit commit = new WeeklyCommit();
        commit.setTitle("Implement feature X");
        commit.setOutcomeId(UUID.randomUUID());
        commit.setChessCategory(ChessCategory.QUEEN);
        commit.setPlannedHours(new BigDecimal("8"));
        commit.setPriorityRank(1);
        return commit;
    }
}
