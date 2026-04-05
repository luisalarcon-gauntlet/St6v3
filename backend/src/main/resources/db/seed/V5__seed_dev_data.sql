-- V5__seed_dev_data.sql
-- Dev-only seed data. Gated by Spring profile via flyway.locations config.
-- This migration should only run when the 'dev' profile is active.
-- See application-dev.yml: flyway.locations includes classpath:db/seed

-- =============================================
-- USERS
-- All passwords: Password1! (BCrypt hash)
-- =============================================
INSERT INTO users (id, email, display_name, password_hash, role, manager_id) VALUES
    ('a1000000-0000-0000-0000-000000000001', 'alice@st6.example', 'Alice Chen',
     '$2a$10$ygMJqwc9mIRW2Ya.oLaY1egWwGy2dsEtPsbNt7/sEl64o3Ngy3PiW', 'MANAGER', NULL),
    ('b2000000-0000-0000-0000-000000000002', 'bob@st6.example', 'Bob Martinez',
     '$2a$10$ygMJqwc9mIRW2Ya.oLaY1egWwGy2dsEtPsbNt7/sEl64o3Ngy3PiW', 'MEMBER',
     'a1000000-0000-0000-0000-000000000001'),
    ('c3000000-0000-0000-0000-000000000003', 'carol@st6.example', 'Carol Nguyen',
     '$2a$10$ygMJqwc9mIRW2Ya.oLaY1egWwGy2dsEtPsbNt7/sEl64o3Ngy3PiW', 'MEMBER',
     'a1000000-0000-0000-0000-000000000001'),
    ('d4000000-0000-0000-0000-000000000004', 'dave@st6.example', 'Dave Kim',
     '$2a$10$ygMJqwc9mIRW2Ya.oLaY1egWwGy2dsEtPsbNt7/sEl64o3Ngy3PiW', 'ADMIN', NULL);

-- =============================================
-- RCDO HIERARCHY
-- =============================================

-- Rally Cry 1: Accelerate Enterprise Adoption
INSERT INTO rally_cries (id, title, description, status, display_order) VALUES
    ('10100000-0000-0000-0000-000000000001', 'Accelerate Enterprise Adoption',
     'Drive enterprise customer growth and reduce barriers to adoption', 'ACTIVE', 1);

INSERT INTO defining_objectives (id, rally_cry_id, title, description, status) VALUES
    ('20100000-0000-0000-0000-000000000001', '10100000-0000-0000-0000-000000000001',
     'Reduce onboarding time by 50%', 'Streamline the new customer onboarding experience', 'ACTIVE'),
    ('20100000-0000-0000-0000-000000000002', '10100000-0000-0000-0000-000000000001',
     'Land 10 enterprise logos in Q1', 'Targeted enterprise sales and marketing push', 'ACTIVE');

INSERT INTO outcomes (id, defining_objective_id, title, description, status) VALUES
    ('30100000-0000-0000-0000-000000000001', '20100000-0000-0000-0000-000000000001',
     'Self-serve onboarding flow live', 'Users can complete onboarding without CS involvement', 'ACTIVE'),
    ('30100000-0000-0000-0000-000000000002', '20100000-0000-0000-0000-000000000001',
     'Onboarding docs revamp complete', 'Updated documentation covering all onboarding scenarios', 'ACTIVE'),
    ('30100000-0000-0000-0000-000000000003', '20100000-0000-0000-0000-000000000002',
     'Enterprise pricing page shipped', 'Public pricing page with enterprise tier details', 'ACTIVE'),
    ('30100000-0000-0000-0000-000000000004', '20100000-0000-0000-0000-000000000002',
     'SOC2 compliance achieved', 'SOC2 Type II certification obtained', 'ACTIVE');

-- Rally Cry 2: Build World-Class Engineering Culture
INSERT INTO rally_cries (id, title, description, status, display_order) VALUES
    ('10200000-0000-0000-0000-000000000002', 'Build World-Class Engineering Culture',
     'Invest in engineering excellence and team productivity', 'ACTIVE', 2);

INSERT INTO defining_objectives (id, rally_cry_id, title, description, status) VALUES
    ('20200000-0000-0000-0000-000000000003', '10200000-0000-0000-0000-000000000002',
     'Achieve 95% sprint completion rate', 'Improve estimation and delivery predictability', 'ACTIVE'),
    ('20200000-0000-0000-0000-000000000004', '10200000-0000-0000-0000-000000000002',
     'Zero critical bugs in production', 'Eliminate severity-1 incidents through proactive quality', 'ACTIVE');

INSERT INTO outcomes (id, defining_objective_id, title, description, status) VALUES
    ('30200000-0000-0000-0000-000000000005', '20200000-0000-0000-0000-000000000003',
     'Automated deployment pipeline', 'CI/CD pipeline with zero-downtime deploys', 'ACTIVE'),
    ('30200000-0000-0000-0000-000000000006', '20200000-0000-0000-0000-000000000003',
     'Test coverage > 80%', 'All repos maintain 80%+ code coverage', 'ACTIVE'),
    ('30200000-0000-0000-0000-000000000007', '20200000-0000-0000-0000-000000000004',
     'Error monitoring dashboard live', 'Real-time error tracking and alerting dashboard', 'ACTIVE'),
    ('30200000-0000-0000-0000-000000000008', '20200000-0000-0000-0000-000000000004',
     'Incident response playbook published', 'Documented runbook for all severity levels', 'ACTIVE');

-- Rally Cry 3: Delight Users with Product Quality
INSERT INTO rally_cries (id, title, description, status, display_order) VALUES
    ('10300000-0000-0000-0000-000000000003', 'Delight Users with Product Quality',
     'Focus on user experience and product reliability', 'ACTIVE', 3);

INSERT INTO defining_objectives (id, rally_cry_id, title, description, status) VALUES
    ('20300000-0000-0000-0000-000000000005', '10300000-0000-0000-0000-000000000003',
     'NPS score > 70', 'Achieve best-in-class customer satisfaction', 'ACTIVE'),
    ('20300000-0000-0000-0000-000000000006', '10300000-0000-0000-0000-000000000003',
     'Page load < 2 seconds', 'Optimize frontend performance for all pages', 'ACTIVE');

INSERT INTO outcomes (id, defining_objective_id, title, description, status) VALUES
    ('30300000-0000-0000-0000-000000000009', '20300000-0000-0000-0000-000000000005',
     'User feedback system launched', 'In-app feedback collection and triage workflow', 'ACTIVE'),
    ('30300000-0000-0000-0000-000000000010', '20300000-0000-0000-0000-000000000005',
     'Top 5 pain points resolved', 'Address the five most-reported user frustrations', 'ACTIVE'),
    ('30300000-0000-0000-0000-000000000011', '20300000-0000-0000-0000-000000000006',
     'CDN migration complete', 'All static assets served via CDN', 'ACTIVE'),
    ('30300000-0000-0000-0000-000000000012', '20300000-0000-0000-0000-000000000006',
     'Frontend bundle optimization', 'Bundle size reduced by 40% with code splitting', 'ACTIVE');

-- =============================================
-- SAMPLE WEEKLY CYCLES FOR BOB (4 weeks + current)
-- =============================================

-- Week 1 (4 weeks ago) - RECONCILED
INSERT INTO weekly_cycles (id, user_id, week_start_date, state, locked_at, reconciled_at, version) VALUES
    ('40100000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000002',
     CURRENT_DATE - INTERVAL '28 days' - (EXTRACT(DOW FROM CURRENT_DATE)::int - 1) * INTERVAL '1 day',
     'RECONCILED', now() - INTERVAL '25 days', now() - INTERVAL '22 days', 0);

INSERT INTO weekly_commits (id, weekly_cycle_id, title, outcome_id, chess_category, priority_rank,
    planned_hours, actual_hours, completion_status, version) VALUES
    (gen_random_uuid(), '40100000-0000-0000-0000-000000000001', 'Set up CI/CD pipeline',
     '30200000-0000-0000-0000-000000000005', 'KING', 1, 16, 18, 'COMPLETED', 0),
    (gen_random_uuid(), '40100000-0000-0000-0000-000000000001', 'Write onboarding docs draft',
     '30100000-0000-0000-0000-000000000002', 'QUEEN', 2, 8, 6, 'COMPLETED', 0),
    (gen_random_uuid(), '40100000-0000-0000-0000-000000000001', 'Review error monitoring tools',
     '30200000-0000-0000-0000-000000000007', 'ROOK', 3, 4, 5, 'COMPLETED', 0);

-- Week 2 (3 weeks ago) - RECONCILED
INSERT INTO weekly_cycles (id, user_id, week_start_date, state, locked_at, reconciled_at, version) VALUES
    ('40100000-0000-0000-0000-000000000002', 'b2000000-0000-0000-0000-000000000002',
     CURRENT_DATE - INTERVAL '21 days' - (EXTRACT(DOW FROM CURRENT_DATE)::int - 1) * INTERVAL '1 day',
     'RECONCILED', now() - INTERVAL '18 days', now() - INTERVAL '15 days', 0);

INSERT INTO weekly_commits (id, weekly_cycle_id, title, outcome_id, chess_category, priority_rank,
    planned_hours, actual_hours, completion_status, version) VALUES
    (gen_random_uuid(), '40100000-0000-0000-0000-000000000002', 'Deploy staging pipeline',
     '30200000-0000-0000-0000-000000000005', 'KING', 1, 12, 14, 'COMPLETED', 0),
    (gen_random_uuid(), '40100000-0000-0000-0000-000000000002', 'Enterprise pricing research',
     '30100000-0000-0000-0000-000000000003', 'QUEEN', 2, 8, 4, 'IN_PROGRESS', 0),
    (gen_random_uuid(), '40100000-0000-0000-0000-000000000002', 'Set up Sentry integration',
     '30200000-0000-0000-0000-000000000007', 'ROOK', 3, 6, 6, 'COMPLETED', 0),
    (gen_random_uuid(), '40100000-0000-0000-0000-000000000002', 'Update test fixtures',
     '30200000-0000-0000-0000-000000000006', 'PAWN', 4, 2, 2, 'COMPLETED', 0);

-- Week 3 (2 weeks ago) - RECONCILED
INSERT INTO weekly_cycles (id, user_id, week_start_date, state, locked_at, reconciled_at, version) VALUES
    ('40100000-0000-0000-0000-000000000003', 'b2000000-0000-0000-0000-000000000002',
     CURRENT_DATE - INTERVAL '14 days' - (EXTRACT(DOW FROM CURRENT_DATE)::int - 1) * INTERVAL '1 day',
     'RECONCILED', now() - INTERVAL '11 days', now() - INTERVAL '8 days', 0);

INSERT INTO weekly_commits (id, weekly_cycle_id, title, outcome_id, chess_category, priority_rank,
    planned_hours, actual_hours, completion_status, version) VALUES
    (gen_random_uuid(), '40100000-0000-0000-0000-000000000003', 'Build self-serve onboarding prototype',
     '30100000-0000-0000-0000-000000000001', 'KING', 1, 20, 22, 'COMPLETED', 0),
    (gen_random_uuid(), '40100000-0000-0000-0000-000000000003', 'Finish enterprise pricing page',
     '30100000-0000-0000-0000-000000000003', 'QUEEN', 2, 10, 8, 'COMPLETED', 0),
    (gen_random_uuid(), '40100000-0000-0000-0000-000000000003', 'Write unit tests for auth module',
     '30200000-0000-0000-0000-000000000006', 'ROOK', 3, 6, 7, 'COMPLETED', 0);

-- Week 4 (last week) - RECONCILED
INSERT INTO weekly_cycles (id, user_id, week_start_date, state, locked_at, reconciled_at, version) VALUES
    ('40100000-0000-0000-0000-000000000004', 'b2000000-0000-0000-0000-000000000002',
     CURRENT_DATE - INTERVAL '7 days' - (EXTRACT(DOW FROM CURRENT_DATE)::int - 1) * INTERVAL '1 day',
     'RECONCILED', now() - INTERVAL '4 days', now() - INTERVAL '1 day', 0);

INSERT INTO weekly_commits (id, weekly_cycle_id, title, outcome_id, chess_category, priority_rank,
    planned_hours, actual_hours, completion_status, version) VALUES
    (gen_random_uuid(), '40100000-0000-0000-0000-000000000004', 'Launch error monitoring dashboard',
     '30200000-0000-0000-0000-000000000007', 'KING', 1, 16, 15, 'COMPLETED', 0),
    (gen_random_uuid(), '40100000-0000-0000-0000-000000000004', 'CDN migration plan',
     '30300000-0000-0000-0000-000000000011', 'QUEEN', 2, 8, 6, 'IN_PROGRESS', 0),
    (gen_random_uuid(), '40100000-0000-0000-0000-000000000004', 'Draft incident response playbook',
     '30200000-0000-0000-0000-000000000008', 'BISHOP', 3, 6, 5, 'COMPLETED', 0),
    (gen_random_uuid(), '40100000-0000-0000-0000-000000000004', 'Collect user feedback on onboarding',
     '30300000-0000-0000-0000-000000000009', 'PAWN', 4, 3, 2, 'DROPPED', 0);

-- Current week - DRAFT (Bob)
INSERT INTO weekly_cycles (id, user_id, week_start_date, state, version) VALUES
    ('40100000-0000-0000-0000-000000000005', 'b2000000-0000-0000-0000-000000000002',
     CURRENT_DATE - (EXTRACT(DOW FROM CURRENT_DATE)::int - 1) * INTERVAL '1 day',
     'DRAFT', 0);

-- =============================================
-- SAMPLE WEEKLY CYCLES FOR CAROL (4 weeks + current)
-- =============================================

-- Week 1 (4 weeks ago) - RECONCILED
INSERT INTO weekly_cycles (id, user_id, week_start_date, state, locked_at, reconciled_at, version) VALUES
    ('40200000-0000-0000-0000-000000000001', 'c3000000-0000-0000-0000-000000000003',
     CURRENT_DATE - INTERVAL '28 days' - (EXTRACT(DOW FROM CURRENT_DATE)::int - 1) * INTERVAL '1 day',
     'RECONCILED', now() - INTERVAL '25 days', now() - INTERVAL '22 days', 0);

INSERT INTO weekly_commits (id, weekly_cycle_id, title, outcome_id, chess_category, priority_rank,
    planned_hours, actual_hours, completion_status, version) VALUES
    (gen_random_uuid(), '40200000-0000-0000-0000-000000000001', 'Design feedback collection UI',
     '30300000-0000-0000-0000-000000000009', 'KING', 1, 16, 14, 'COMPLETED', 0),
    (gen_random_uuid(), '40200000-0000-0000-0000-000000000001', 'Research CDN providers',
     '30300000-0000-0000-0000-000000000011', 'QUEEN', 2, 8, 10, 'COMPLETED', 0),
    (gen_random_uuid(), '40200000-0000-0000-0000-000000000001', 'Fix top 2 user pain points',
     '30300000-0000-0000-0000-000000000010', 'ROOK', 3, 12, 10, 'IN_PROGRESS', 0);

-- Week 2 (3 weeks ago) - RECONCILED
INSERT INTO weekly_cycles (id, user_id, week_start_date, state, locked_at, reconciled_at, version) VALUES
    ('40200000-0000-0000-0000-000000000002', 'c3000000-0000-0000-0000-000000000003',
     CURRENT_DATE - INTERVAL '21 days' - (EXTRACT(DOW FROM CURRENT_DATE)::int - 1) * INTERVAL '1 day',
     'RECONCILED', now() - INTERVAL '18 days', now() - INTERVAL '15 days', 0);

INSERT INTO weekly_commits (id, weekly_cycle_id, title, outcome_id, chess_category, priority_rank,
    planned_hours, actual_hours, completion_status, version) VALUES
    (gen_random_uuid(), '40200000-0000-0000-0000-000000000002', 'Implement feedback widget',
     '30300000-0000-0000-0000-000000000009', 'KING', 1, 20, 18, 'COMPLETED', 0),
    (gen_random_uuid(), '40200000-0000-0000-0000-000000000002', 'Continue pain point fixes',
     '30300000-0000-0000-0000-000000000010', 'QUEEN', 2, 10, 12, 'COMPLETED', 0),
    (gen_random_uuid(), '40200000-0000-0000-0000-000000000002', 'Bundle size audit',
     '30300000-0000-0000-0000-000000000012', 'ROOK', 3, 4, 4, 'COMPLETED', 0);

-- Week 3 (2 weeks ago) - RECONCILED
INSERT INTO weekly_cycles (id, user_id, week_start_date, state, locked_at, reconciled_at, version) VALUES
    ('40200000-0000-0000-0000-000000000003', 'c3000000-0000-0000-0000-000000000003',
     CURRENT_DATE - INTERVAL '14 days' - (EXTRACT(DOW FROM CURRENT_DATE)::int - 1) * INTERVAL '1 day',
     'RECONCILED', now() - INTERVAL '11 days', now() - INTERVAL '8 days', 0);

INSERT INTO weekly_commits (id, weekly_cycle_id, title, outcome_id, chess_category, priority_rank,
    planned_hours, actual_hours, completion_status, version) VALUES
    (gen_random_uuid(), '40200000-0000-0000-0000-000000000003', 'SOC2 gap analysis',
     '30100000-0000-0000-0000-000000000004', 'KING', 1, 16, 20, 'COMPLETED', 0),
    (gen_random_uuid(), '40200000-0000-0000-0000-000000000003', 'Implement code splitting',
     '30300000-0000-0000-0000-000000000012', 'QUEEN', 2, 12, 10, 'COMPLETED', 0),
    (gen_random_uuid(), '40200000-0000-0000-0000-000000000003', 'Fix remaining pain points',
     '30300000-0000-0000-0000-000000000010', 'ROOK', 3, 8, 6, 'IN_PROGRESS', 0);

-- Week 4 (last week) - RECONCILED
INSERT INTO weekly_cycles (id, user_id, week_start_date, state, locked_at, reconciled_at, version) VALUES
    ('40200000-0000-0000-0000-000000000004', 'c3000000-0000-0000-0000-000000000003',
     CURRENT_DATE - INTERVAL '7 days' - (EXTRACT(DOW FROM CURRENT_DATE)::int - 1) * INTERVAL '1 day',
     'RECONCILED', now() - INTERVAL '4 days', now() - INTERVAL '1 day', 0);

INSERT INTO weekly_commits (id, weekly_cycle_id, title, outcome_id, chess_category, priority_rank,
    planned_hours, actual_hours, completion_status, version) VALUES
    (gen_random_uuid(), '40200000-0000-0000-0000-000000000004', 'CDN migration execution',
     '30300000-0000-0000-0000-000000000011', 'KING', 1, 20, 22, 'COMPLETED', 0),
    (gen_random_uuid(), '40200000-0000-0000-0000-000000000004', 'SOC2 evidence collection',
     '30100000-0000-0000-0000-000000000004', 'QUEEN', 2, 10, 8, 'COMPLETED', 0),
    (gen_random_uuid(), '40200000-0000-0000-0000-000000000004', 'Onboarding flow QA testing',
     '30100000-0000-0000-0000-000000000001', 'KNIGHT', 3, 6, 5, 'COMPLETED', 0);

-- Current week - DRAFT (Carol)
INSERT INTO weekly_cycles (id, user_id, week_start_date, state, version) VALUES
    ('40200000-0000-0000-0000-000000000005', 'c3000000-0000-0000-0000-000000000003',
     CURRENT_DATE - (EXTRACT(DOW FROM CURRENT_DATE)::int - 1) * INTERVAL '1 day',
     'DRAFT', 0);
