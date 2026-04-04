# ST6v3 Build Plan

Phased execution plan. Each phase is a feature branch. Follow TDD: write failing tests → implement → refactor. Commit after each step.

Reference: This plan resolves all 24 issues identified in the v2 audit (see ISSUES.md).

---

## Phase 1 — Project Scaffold

**Branch:** `feat/001-project-scaffold`

### Steps

1. Initialize a Maven project for the backend:
   - Java 21, Spring Boot 3.3+
   - Dependencies: spring-boot-starter-web, spring-boot-starter-data-jpa, spring-boot-starter-security, spring-boot-starter-validation, flyway-core, postgresql, jjwt (io.jsonwebtoken 0.12+), jsoup, bucket4j-core + bucket4j-spring-boot-starter, lombok, spring-boot-starter-test, testcontainers (postgresql module)
   - `application.yml` reads ALL config from environment variables — no hardcoded defaults for secrets
   - Create `application-dev.yml` and `application-prod.yml` profiles
   - Set `spring.jpa.hibernate.ddl-auto=validate` (Flyway handles schema)

2. Create Docker setup:
   - `docker-compose.yml` with postgres:16 and the backend service, both using `env_file: .env`
   - `.env.example` with documented variables (no real values)
   - `.env` in `.gitignore`

3. Create Flyway migration stubs:
   - `V1__create_users.sql` (empty, will fill in Phase 2)
   - Place in `src/main/resources/db/migration/`

4. Scaffold the React frontend:
   - Vite + React 18 + TypeScript (strict: true in tsconfig)
   - TailwindCSS configured with the project color palette
   - Vitest + React Testing Library + MSW configured
   - `vite.config.ts` with proxy to backend and env var for API URL

5. Create GitHub Actions CI:
   - `.github/workflows/ci.yml`
   - On push to any branch: run `mvnw test` and `npm test`
   - Use services block for PostgreSQL in CI

6. Create project documentation:
   - `README.md` with setup instructions, architecture overview, how to run tests

### Commits
```
chore: initialize maven project with spring boot 3.3 and java 21
chore: add docker-compose with postgres 16 and env-based config
chore: add flyway dependency and migration directory
chore: scaffold react 18 + vite + typescript frontend
chore: configure vitest, react testing library, and msw
ci: add github actions workflow for build and test
docs: add README with project setup and architecture
```

### Resolves: #18 (hardcoded URLs), #22 (no CI/CD or migrations)

---

## Phase 2 — Domain Models & Tests

**Branch:** `feat/002-domain-models`

### TDD Sequence

**Step 1 — Write enum and value object tests:**

```java
// ChessCategoryTest.java
@Test void king_is_limited_to_one_per_week() { ... }
@Test void all_six_categories_exist() { ... }

// CycleStateMachineTest.java
@Test void draft_can_transition_to_locked() { ... }
@Test void draft_to_locked_requires_minimum_3_commits() { ... }
@Test void draft_to_locked_requires_exactly_one_king() { ... }
@Test void draft_to_locked_requires_all_commits_linked_to_outcome() { ... }
@Test void locked_can_transition_to_reconciling() { ... }
@Test void reconciling_to_reconciled_requires_all_statuses_set() { ... }
@Test void draft_cannot_skip_to_reconciling() { ... }
@Test void locked_cannot_go_back_to_draft() { ... }
@Test void reconciled_is_terminal_state() { ... }

// WeeklyCommitValidationTest.java
@Test void title_cannot_be_blank() { ... }
@Test void title_cannot_exceed_200_chars() { ... }
@Test void planned_hours_must_be_between_0_and_80() { ... }
@Test void outcome_id_is_required() { ... }
@Test void chess_category_is_required() { ... }
```

**Step 2 — Implement entities to pass tests:**

- `CycleState` enum: DRAFT, LOCKED, RECONCILING, RECONCILED
- `CycleStateMachine` value object with `transition(from, to, context)` that validates rules
- `ChessCategory` enum: KING, QUEEN, ROOK, BISHOP, KNIGHT, PAWN
- `CompletionStatus` enum: NOT_STARTED, IN_PROGRESS, COMPLETED, CARRIED_FORWARD, DROPPED
- `Role` enum: MEMBER, MANAGER, ADMIN
- `User` entity with `@Version` field
- `RallyCry`, `DefiningObjective`, `Outcome` entities
- `WeeklyCycle` entity with `@Version` field and state machine validation
- `WeeklyCommit` entity with `@Version` field, bean validation, soft delete flag

**Step 3 — Write and apply Flyway migrations:**

```sql
-- V1__create_users.sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
    manager_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- V2__create_rcdo_hierarchy.sql
-- rally_cries, defining_objectives, outcomes tables

-- V3__create_weekly_cycles_and_commits.sql
-- weekly_cycles with version column, unique(user_id, week_start_date)
-- weekly_commits with version column, is_deleted flag

-- V4__create_audit_log.sql
-- audit_log with entity_type, entity_id, action, actor_id, details JSONB
```

### Commits
```
test: add chess category and cycle state machine tests (RED)
feat: implement enums and CycleStateMachine value object (GREEN)
test: add weekly commit validation tests (RED)
feat: implement domain entities with bean validation and @Version (GREEN)
feat: add flyway migrations V1 through V4
refactor: extract validation messages to constants
```

### Resolves: #9 (optimistic locking), #16 (validation), #19 (seed data → migrations)

---

## Phase 3 — Authentication & Security

**Branch:** `feat/003-auth-security`

### TDD Sequence

**Step 1 — JWT service tests:**
```java
// JwtServiceTest.java
@Test void generates_valid_token_with_claims() { ... }
@Test void extracts_username_from_token() { ... }
@Test void extracts_role_from_token() { ... }
@Test void rejects_expired_token() { ... }
@Test void rejects_tampered_token() { ... }
@Test void rejects_token_with_wrong_secret() { ... }
```

**Step 2 — Implement JwtService** reading secret from `${JWT_SECRET}` env var, no fallback.

**Step 3 — Input sanitizer tests:**
```java
// InputSanitizerTest.java
@Test void strips_script_tags() { ... }
@Test void strips_onclick_attributes() { ... }
@Test void strips_img_onerror_payload() { ... }
@Test void preserves_plain_text() { ... }
@Test void preserves_basic_punctuation() { ... }
@Test void handles_null_input_gracefully() { ... }
```

**Step 4 — Implement InputSanitizer** using Jsoup with `Safelist.NONE`.

**Step 5 — Auth controller integration tests:**
```java
// AuthControllerIT.java (with @SpringBootTest + TestContainers)
@Test void login_sets_httponly_cookie() { ... }
@Test void login_with_wrong_password_returns_401() { ... }
@Test void me_endpoint_reads_cookie_and_returns_user() { ... }
@Test void me_endpoint_without_cookie_returns_401() { ... }
@Test void logout_clears_cookie() { ... }
```

**Step 6 — Implement AuthController, SecurityConfig, JwtAuthFilter.**

**Step 7 — Rate limit tests:**
```java
// RateLimitTest.java
@Test void allows_requests_under_limit() { ... }
@Test void returns_429_when_limit_exceeded() { ... }
@Test void limit_resets_after_window() { ... }
```

**Step 8 — Implement Bucket4j rate limiting.**

**Step 9 — Role enforcement tests:**
```java
// SecurityRoleIT.java
@Test void member_cannot_access_manager_endpoints() { ... }
@Test void manager_can_access_manager_endpoints() { ... }
@Test void admin_can_access_admin_endpoints() { ... }
@Test void unauthenticated_gets_401_on_protected_endpoints() { ... }
```

### Key implementation: httpOnly cookie
```java
// On login — set cookie instead of returning token in body
ResponseCookie cookie = ResponseCookie.from("st6_token", jwt)
    .httpOnly(true)
    .secure(true)
    .sameSite("Strict")
    .path("/")
    .maxAge(Duration.ofHours(1))
    .build();
response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

// JwtAuthFilter — read token from cookie, not Authorization header
String token = WebUtils.getCookie(request, "st6_token")
    .map(Cookie::getValue)
    .orElse(null);
```

### Commits
```
test: add JWT service tests for generation, validation, expiry (RED)
feat: implement JwtService with env-based secret (GREEN)
test: add input sanitization tests for XSS payloads (RED)
feat: implement Jsoup InputSanitizer (GREEN)
test: add auth controller integration tests with TestContainers (RED)
feat: implement auth with httpOnly cookie JWT transport (GREEN)
test: add rate limiting tests (RED)
feat: implement Bucket4j rate limiting at 100 req/min/IP (GREEN)
test: add role-based access integration tests (RED)
feat: implement role enforcement in SecurityConfig (GREEN)
feat: enable CSRF protection for cookie-based auth
```

### Resolves: #1 (simplified auth), #2 (JWT in localStorage), #3 (hardcoded secret), #4 (CSRF), #5 (input sanitization), #6 (rate limiting)

---

## Phase 4 — Weekly Lifecycle API

**Branch:** `feat/004-weekly-lifecycle`

### TDD Sequence

**Step 1 — Service tests:**
```java
// CycleServiceTest.java (unit tests with Mockito)
@Test void getOrCreateCurrentCycle_creates_draft_if_none_exists() { ... }
@Test void getOrCreateCurrentCycle_returns_existing_if_present() { ... }
@Test void lockCycle_succeeds_with_valid_commits() { ... }
@Test void lockCycle_fails_without_king() { ... }
@Test void lockCycle_fails_with_fewer_than_3_commits() { ... }
@Test void lockCycle_fails_if_not_in_draft_state() { ... }
@Test void startReconciliation_succeeds_from_locked() { ... }
@Test void reconcile_succeeds_when_all_statuses_set() { ... }
@Test void reconcile_fails_when_any_status_missing() { ... }
@Test void getCycles_returns_paginated_results() { ... }
@Test void concurrent_update_throws_conflict() { ... }
```

**Step 2 — Implement CycleService.**

**Step 3 — Integration tests:**
```java
// CycleControllerIT.java (@SpringBootTest + TestContainers)
@Test void full_lifecycle_draft_to_reconciled() { ... }
@Test void lock_returns_validation_errors_as_problem_detail() { ... }
@Test void optimistic_lock_conflict_returns_409() { ... }
@Test void pagination_works_correctly() { ... }
@Test void member_can_only_see_own_cycles() { ... }
```

**Step 4 — Implement CycleController with pagination, proper error responses.**

**Step 5 — CarryForward tests:**
```java
// CarryForwardServiceTest.java
@Test void creates_new_draft_cycle_for_next_week() { ... }
@Test void copies_incomplete_commits_to_new_cycle() { ... }
@Test void does_not_copy_completed_or_dropped_commits() { ... }
@Test void sets_original_commit_status_to_carried_forward() { ... }
```

**Step 6 — Implement CarryForwardService.**

### Key implementation: @EntityGraph (replacing force-init)
```java
// WeeklyCycleRepository.java
@EntityGraph(attributePaths = {"commits", "commits.outcome",
    "commits.outcome.definingObjective", "commits.outcome.definingObjective.rallyCry"})
Optional<WeeklyCycle> findByIdWithCommits(UUID id);

@EntityGraph(attributePaths = {"commits"})
Page<WeeklyCycle> findByUserId(UUID userId, Pageable pageable);
```

### Key implementation: Optimistic locking conflict response
```java
// GlobalExceptionHandler.java
@ExceptionHandler(OptimisticLockingFailureException.class)
public ProblemDetail handleConflict(OptimisticLockingFailureException ex) {
    ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.CONFLICT);
    pd.setTitle("Conflict");
    pd.setDetail("This record was modified by another session. Please refresh and try again.");
    return pd;
}
```

### Commits
```
test: add CycleService unit tests for full lifecycle (RED)
feat: implement CycleService with state machine enforcement (GREEN)
test: add CycleController integration tests with TestContainers (RED)
feat: implement cycle REST endpoints with pagination (GREEN)
test: add carry-forward service tests (RED)
feat: implement CarryForwardService (GREEN)
test: add optimistic lock conflict test (RED)
feat: add conflict detection with 409 response (GREEN)
refactor: replace all lazy-load force-init with @EntityGraph
```

### Resolves: #7 (pagination), #9 (optimistic locking), #10 (force-init)

---

## Phase 5 — RCDO API

**Branch:** `feat/005-rcdo-api`

### TDD Sequence

**Step 1 — Service tests:**
```java
// RcdoServiceTest.java
@Test void fetchFullTree_returns_complete_hierarchy() { ... }
@Test void fetchFullTree_excludes_archived_rally_cries() { ... }
@Test void fetchFullTree_is_single_query() { ... } // verify with query count assertion
```

**Step 2 — Implement with JOIN FETCH (one query, not N+1):**
```java
@Query("""
    SELECT DISTINCT rc FROM RallyCry rc
    LEFT JOIN FETCH rc.definingObjectives do
    LEFT JOIN FETCH do.outcomes o
    WHERE rc.status = 'ACTIVE'
    ORDER BY rc.displayOrder
    """)
List<RallyCry> fetchFullTree();
```

**Step 3 — Integration tests + seed migration:**
```java
// RcdoControllerIT.java
@Test void tree_endpoint_returns_full_hierarchy() { ... }
@Test void create_rally_cry_requires_admin_role() { ... }
```

**Step 4 — Add `V5__seed_dev_data.sql`** (gated to dev profile via Spring config, not Flyway callbacks).

### Commits
```
test: add RCDO tree service tests with query count assertion (RED)
feat: implement RcdoService with JOIN FETCH tree query (GREEN)
test: add RCDO controller integration tests (RED)
feat: implement RCDO endpoints with admin role enforcement (GREEN)
feat: add Flyway V5 dev seed data migration
```

### Resolves: #8 (N+1 queries), #19 (hardcoded seed data)

---

## Phase 6 — Commit API

**Branch:** `feat/006-commit-api`

### TDD Sequence

**Step 1 — Service tests:**
```java
// CommitServiceTest.java
@Test void create_commit_in_draft_cycle_succeeds() { ... }
@Test void create_commit_in_locked_cycle_fails() { ... }
@Test void update_plan_fields_only_in_draft() { ... }
@Test void reconcile_fields_only_in_reconciling() { ... }
@Test void soft_delete_sets_flag_and_logs_audit() { ... }
@Test void second_king_in_same_week_fails() { ... }
@Test void title_sanitized_before_save() { ... }
@Test void planned_hours_validated_0_to_80() { ... }
```

**Step 2 — Implement CommitService with sanitization and validation.**

**Step 3 — Integration tests:**
```java
// CommitControllerIT.java
@Test void create_commit_returns_201_with_location() { ... }
@Test void validation_error_returns_422_with_field_details() { ... }
@Test void xss_payload_in_title_is_sanitized() { ... }
@Test void delete_is_soft_and_returns_204() { ... }
```

**Step 4 — Implement CommitController.**

### Key: RFC 7807 error response format
```json
{
  "type": "about:blank",
  "title": "Validation Failed",
  "status": 422,
  "violations": [
    { "field": "title", "message": "must not be blank" },
    { "field": "plannedHours", "message": "must be between 0 and 80" }
  ]
}
```

### Commits
```
test: add commit service tests with validation edge cases (RED)
feat: implement CommitService with sanitization and validation (GREEN)
test: add commit controller integration tests (RED)
feat: implement CommitController with RFC 7807 errors (GREEN)
test: add audit trail tests for commit operations (RED)
feat: implement AuditService with JSONB logging (GREEN)
```

### Resolves: #5 (sanitization), #12 (error handling), #16 (validation)

---

## Phase 7 — Frontend Shell

**Branch:** `feat/007-frontend-shell`

### TDD Sequence

**Step 1 — Auth context tests:**
```tsx
// AuthContext.test.tsx
test('provides null user when no cookie session', ...);
test('provides user after successful login', ...);
test('clears user on logout', ...);
test('redirects to login on 401 response', ...);
```

**Step 2 — Implement AuthContext** with httpOnly cookie (no token in state).

**Step 3 — Route guard tests:**
```tsx
// ProtectedRoute.test.tsx
test('renders children when user has required role', ...);
test('redirects to login when not authenticated', ...);
test('redirects to unauthorized when role insufficient', ...);
test('shows loading skeleton while auth is resolving', ...);
```

**Step 4 — Implement ProtectedRoute.**

**Step 5 — API client tests:**
```tsx
// client.test.ts
test('retries on 5xx with exponential backoff', ...);
test('does not retry on 4xx', ...);
test('aborts duplicate in-flight requests', ...);
test('includes credentials for cookie transport', ...);
```

**Step 6 — Implement Axios client** with:
- `withCredentials: true`
- Retry interceptor (3 retries, exponential backoff, 5xx only)
- AbortController for request deduplication
- Typed error normalization using `isAxiosError()`

**Step 7 — Build App shell:**
- Routing with ProtectedRoute guards on every path
- Sidebar with role-based nav items
- AppShell layout with responsive grid
- Global error boundary

### Commits
```
test: add auth context tests (RED)
feat: implement AuthContext with cookie-based auth (GREEN)
test: add protected route tests (RED)
feat: implement ProtectedRoute with role guards (GREEN)
test: add API client tests for retry and abort (RED)
feat: implement axios client with retry and AbortController (GREEN)
feat: add app shell with sidebar, routing, and layout
feat: add global error boundary
```

### Resolves: #11 (route guards), #12 (typed errors), #13 (state drift), #15 (fetch waterfall), #17 (no Framer Motion), #18 (env vars), #20 (retry logic)

---

## Phase 8 — Weekly Views

**Branch:** `feat/008-weekly-views`

### TDD Sequence

**Step 1 — CommitForm tests:**
```tsx
test('shows inline error when title is empty on submit', ...);
test('shows inline error when title exceeds 200 chars', ...);
test('shows inline error when planned hours > 80', ...);
test('requires outcome selection', ...);
test('requires chess category selection', ...);
test('submits valid form and calls API', ...);
test('chess piece picker has aria-label on each option', ...);
test('RCDO tree picker has role=tree and aria-expanded', ...);
```

**Step 2 — Implement CommitForm** with inline validation, accessible chess picker, RCDO tree.

**Step 3 — CommitList tests:**
```tsx
test('renders loading skeleton while fetching', ...);
test('renders empty state when no commits', ...);
test('renders commit cards with correct data', ...);
test('delete button shows confirmation dialog', ...);
test('confirmation dialog has cancel and confirm', ...);
```

**Step 4 — Implement CommitList, CommitCard** with CSS transitions (no Framer Motion).

**Step 5 — WeeklyPlannerPage tests:**
```tsx
test('displays current cycle state', ...);
test('lock button validates before transitioning', ...);
test('shows validation errors from lock attempt', ...);
```

**Step 6 — Implement WeeklyPlannerPage, ReconciliationPage.**

### Commits
```
test: add CommitForm tests with validation and a11y (RED)
feat: implement CommitForm with inline validation (GREEN)
test: add CommitList and CommitCard tests (RED)
feat: implement CommitList with CSS transitions (GREEN)
test: add ConfirmDialog tests (RED)
feat: implement shared ConfirmDialog for destructive actions (GREEN)
test: add WeeklyPlannerPage tests (RED)
feat: implement WeeklyPlannerPage and ReconciliationPage (GREEN)
```

### Resolves: #14 (confirmation dialogs), #16 (frontend validation), #17 (no Framer)

---

## Phase 9 — Manager Views

**Branch:** `feat/009-manager-views`

### TDD Sequence

**Step 1 — TeamGrid + TeamMemberCard tests.**
**Step 2 — Implement with paginated data loading.**
**Step 3 — ReviewPanel tests.**
**Step 4 — Implement with regression confirmation flow.**
**Step 5 — ManagerDashboardPage integration test.**

### Commits
```
test: add TeamGrid and TeamMemberCard tests (RED)
feat: implement manager team overview with pagination (GREEN)
test: add ReviewPanel tests with regression flow (RED)
feat: implement ReviewPanel with confirmation dialog (GREEN)
feat: implement ManagerDashboardPage
```

---

## Phase 10 — Accessibility & Observability

**Branch:** `feat/010-polish-a11y`

### Steps

1. **Accessibility audit** — run jest-axe on every page component:
```tsx
test('WeeklyPlannerPage has no a11y violations', async () => {
  const { container } = render(<WeeklyPlannerPage />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

2. **Fix all violations:**
   - `aria-label` on ChessPiecePicker buttons
   - `role="tree"` + `aria-expanded` on RCDO tree
   - `role="radiogroup"` on quiz/picker groups
   - Skip-to-content link
   - Focus management on route changes
   - Keyboard navigation for all interactive elements

3. **Structured logging:**
   - Add `logstash-logback-encoder` dependency
   - Configure JSON-format logs with request ID correlation
   - Log all state transitions and auth events

4. **Metrics:**
   - Enable Spring Boot Actuator (`/actuator/health`, `/actuator/metrics`)
   - Expose custom metrics for cycle transitions and error rates

5. **Final documentation:**
   - Update README with architecture diagram
   - Add testing guide
   - Ensure CLAUDE.md matches final implementation

### Commits
```
test: add accessibility tests with jest-axe on all pages (RED)
feat: add ARIA attributes, keyboard navigation, focus management (GREEN)
feat: add skip-to-content link
chore: add structured JSON logging with request ID correlation
chore: enable Spring Boot Actuator health and metrics
docs: update README with architecture and testing guide
docs: finalize CLAUDE.md
```

### Resolves: #21 (observability), #23 (accessibility), #24 (test coverage → resolved across ALL phases)

---

## Issue Resolution Checklist

After all phases, verify every issue is resolved:

- [ ] #1  — Auth foundation (SSO-ready)
- [ ] #2  — httpOnly cookie (no localStorage)
- [ ] #3  — Env-based JWT secret (no fallback)
- [ ] #4  — CSRF enabled
- [ ] #5  — Jsoup input sanitization
- [ ] #6  — Bucket4j rate limiting
- [ ] #7  — Pageable on all list endpoints
- [ ] #8  — JOIN FETCH tree query (no N+1)
- [ ] #9  — @Version optimistic locking + 409
- [ ] #10 — @EntityGraph (no force-init)
- [ ] #11 — ProtectedRoute with role guards
- [ ] #12 — Typed errors with isAxiosError()
- [ ] #13 — Stale data detection
- [ ] #14 — ConfirmDialog on destructive actions
- [ ] #15 — AbortController + request dedup
- [ ] #16 — Bean Validation + inline frontend validation
- [ ] #17 — CSS transitions (no Framer Motion)
- [ ] #18 — Environment variables throughout
- [ ] #19 — Flyway migrations + dev-profile seed data
- [ ] #20 — Exponential backoff retry
- [ ] #21 — Structured logging + Actuator metrics
- [ ] #22 — GitHub Actions CI + Flyway migrations
- [ ] #23 — ARIA, keyboard nav, jest-axe
- [ ] #24 — TDD throughout (comprehensive test suite)
