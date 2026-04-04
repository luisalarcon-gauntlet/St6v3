CREATE TABLE weekly_cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    week_start_date DATE NOT NULL,
    state VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    version BIGINT NOT NULL DEFAULT 0,
    locked_at TIMESTAMPTZ,
    reconciled_at TIMESTAMPTZ,
    reviewed_at TIMESTAMPTZ,
    reviewer_id UUID REFERENCES users(id),
    reviewer_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, week_start_date)
);

CREATE INDEX idx_weekly_cycles_user ON weekly_cycles(user_id);
CREATE INDEX idx_weekly_cycles_week ON weekly_cycles(week_start_date);

CREATE TABLE weekly_commits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    weekly_cycle_id UUID NOT NULL REFERENCES weekly_cycles(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    outcome_id UUID NOT NULL REFERENCES outcomes(id),
    chess_category VARCHAR(20) NOT NULL,
    priority_rank INT NOT NULL DEFAULT 0,
    planned_hours DECIMAL(5,2) NOT NULL CHECK (planned_hours >= 0 AND planned_hours <= 80),
    actual_hours DECIMAL(5,2) CHECK (actual_hours >= 0 AND actual_hours <= 80),
    completion_status VARCHAR(20),
    reconciliation_notes TEXT,
    version BIGINT NOT NULL DEFAULT 0,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_weekly_commits_cycle ON weekly_commits(weekly_cycle_id);
CREATE INDEX idx_weekly_commits_outcome ON weekly_commits(outcome_id);
CREATE INDEX idx_weekly_commits_not_deleted ON weekly_commits(weekly_cycle_id) WHERE is_deleted = FALSE;
