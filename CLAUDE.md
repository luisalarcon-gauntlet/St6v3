# ST6v3 — Weekly Commits Planning System

## What This Is

A full-stack weekly planning application that replaces 15-Five. It structurally connects individual weekly commitments to organizational strategic goals through the RCDO hierarchy (Rally Cry → Defining Objective → Outcome). Built for ST6, an Austin-based PE operating firm that standardizes tech stacks across portfolio companies.

## Stack

| Layer       | Technology                                                 |
|-------------|------------------------------------------------------------|
| Frontend    | React 18, TypeScript (strict), TailwindCSS, Vite          |
| Backend     | Java 21, Spring Boot 3.3+, Spring Data JPA, Maven         |
| Database    | PostgreSQL 16                                              |
| Migrations  | Flyway (NO JPA auto-DDL in production)                     |
| Auth        | JWT in httpOnly secure cookies (NOT localStorage)          |
| Containers  | Docker + docker-compose                                    |
| Testing     | JUnit 5 + TestContainers (back), Vitest + RTL + MSW (front) |
| CI          | GitHub Actions                                             |

---

## CRITICAL RULES — Read Before Writing Any Code

### 1. Test-Driven Development (TDD) Is Mandatory

Every feature follows RED → GREEN → REFACTOR:

1. **Write the test first.** The test must fail (RED).
2. **Write the minimum implementation** to make the test pass (GREEN).
3. **Refactor** if needed while keeping tests green.

Never write implementation code without a corresponding test that was committed first. This is the single most important rule of this project.

### 2. Security Is Not Optional

These are hard requirements, not suggestions:

- **JWT lives in httpOnly + Secure + SameSite=Strict cookies.** Never expose tokens to JavaScript. Never use localStorage for auth.
- **All text inputs are sanitized** with Jsoup (backend) before persistence. No raw user input stored in the database.
- **No hardcoded secrets anywhere.** JWT secret, DB password, and all credentials come from environment variables with no fallback defaults.
- **Rate limiting is active** via Bucket4j: 100 requests/minute per IP.
- **CSRF protection is enabled** (required because we use cookie-based auth).
- **All endpoints require authentication** except `POST /api/v1/auth/login` and `POST /api/v1/auth/register`.
- **Role-based access is enforced at both the route (frontend) and endpoint (backend) level.**

### 3. Git Commit Discipline

Use conventional commits. Every commit must be atomic and purposeful:

```
feat:     New feature
test:     Adding or updating tests
fix:      Bug fix
refactor: Code restructuring (no behavior change)
chore:    Build, config, dependency changes
docs:     Documentation only
ci:       CI/CD pipeline changes
```

**Branch strategy:** Feature branches named `feat/NNN-description`, squash-merged to `main`. Each merge commit references which issues from the 24-item audit it resolves (see PLAN.md).

**TDD commit pattern within a branch:**
```
test: add weekly cycle state machine tests          ← RED (tests fail)
feat: implement WeeklyCycle entity with transitions ← GREEN (tests pass)
refactor: extract CycleStateMachine value object    ← REFACTOR
```

### 4. No Shortcuts on Architecture

- **Flyway migrations** for all schema changes. Never rely on JPA auto-DDL.
- **`@EntityGraph`** or `JOIN FETCH` for eager loading. Never force-initialize lazy collections with `.size()`.
- **`@Version` fields** on `WeeklyCycle` and `WeeklyCommit` for optimistic locking. Return 409 on conflict.
- **Spring Data `Pageable`** on every list endpoint. No unbounded queries.
- **RFC 7807 Problem Details** for all error responses via `@ControllerAdvice`.
- **Bean Validation annotations** (`@NotBlank`, `@Size`, `@Min`, `@Max`) on all request DTOs.
- **Typed errors** on the frontend. Use `isAxiosError()`, never `as` casting on catch blocks.

---

## Domain Model

### RCDO Hierarchy

The organizational goal structure that all commits must link to:

```
Rally Cry (top-level strategic theme, set by leadership)
  └── Defining Objective (measurable sub-goal)
        └── Outcome (specific deliverable — this is what commits link to)
```

### Chess Layer Categorization

Work-type prioritization using chess piece metaphor:

| Piece    | Meaning                          | Constraint         |
|----------|----------------------------------|--------------------|
| KING     | Non-negotiable, must complete    | Max 1 per week     |
| QUEEN    | High impact, high flexibility    | No limit           |
| ROOK     | Important, structured/routine    | No limit           |
| BISHOP   | Strategic, cross-functional      | No limit           |
| KNIGHT   | Creative, unexpected value       | No limit           |
| PAWN     | Small tasks, quick wins          | No limit           |

### Weekly Lifecycle State Machine

```
DRAFT → LOCKED → RECONCILING → RECONCILED
                                    ↓
                            [carry-forward to next DRAFT]
```

| State         | Who Acts | What Happens                                               |
|---------------|----------|------------------------------------------------------------|
| DRAFT         | Member   | Add/edit/delete commits. Plan the week.                    |
| LOCKED        | System   | Plan is frozen. No edits to planned items.                 |
| RECONCILING   | Member   | End of week: report actual hours, completion, notes.       |
| RECONCILED    | System   | Week closed. Incomplete items carry forward to next DRAFT. |

**Transition rules:**
- DRAFT → LOCKED: Requires ≥3 commits, exactly 1 KING, all commits linked to an Outcome.
- LOCKED → RECONCILING: User-triggered (Friday) or system-triggered.
- RECONCILING → RECONCILED: All commits must have completion_status set.
- Manager review is async — can happen on any LOCKED, RECONCILING, or RECONCILED cycle.

### Core Entities

**`users`** — `id` (UUID), `email`, `display_name`, `password_hash`, `role` (MEMBER|MANAGER|ADMIN), `manager_id` (FK self-ref, nullable)

**`rally_cries`** — `id` (UUID), `title`, `description`, `status` (ACTIVE|ARCHIVED), `display_order`

**`defining_objectives`** — `id` (UUID), `rally_cry_id` (FK), `title`, `description`, `status`

**`outcomes`** — `id` (UUID), `defining_objective_id` (FK), `title`, `description`, `status`

**`weekly_cycles`** — `id` (UUID), `user_id` (FK), `week_start_date` (DATE), `state` (enum), `version` (optimistic lock), `locked_at`, `reconciled_at`, `reviewed_at`, `reviewer_id`, `reviewer_notes`. UNIQUE(user_id, week_start_date).

**`weekly_commits`** — `id` (UUID), `weekly_cycle_id` (FK), `title` (max 200 chars), `description`, `outcome_id` (FK, required), `chess_category` (enum), `priority_rank` (int), `planned_hours` (decimal, 0-80), `actual_hours` (decimal, 0-80, nullable), `completion_status` (NOT_STARTED|IN_PROGRESS|COMPLETED|CARRIED_FORWARD|DROPPED), `reconciliation_notes`, `version` (optimistic lock), `is_deleted` (soft delete)

**`audit_log`** — `id` (UUID), `entity_type`, `entity_id`, `action`, `actor_id`, `details` (JSONB), `created_at`

---

## API Endpoints

### Auth
```
POST   /api/v1/auth/login                          → Set httpOnly cookie, return user info
POST   /api/v1/auth/register                       → Create account (dev only, profile-gated)
POST   /api/v1/auth/logout                         → Clear cookie
GET    /api/v1/auth/me                              → Current user from cookie
```

### RCDO Hierarchy
```
GET    /api/v1/rcdo/tree                            → Full hierarchy in ONE query (JOIN FETCH)
POST   /api/v1/rally-cries                          → Create (ADMIN only)
POST   /api/v1/defining-objectives                  → Create (ADMIN only)
POST   /api/v1/outcomes                             → Create (ADMIN only)
```

### Weekly Cycles
```
GET    /api/v1/cycles/current                       → Get or create current week (auto-DRAFT)
GET    /api/v1/cycles/:id                           → Single cycle with commits
GET    /api/v1/cycles?page=0&size=20                → Paginated list
POST   /api/v1/cycles/:id/lock                      → DRAFT → LOCKED
POST   /api/v1/cycles/:id/start-reconciliation      → LOCKED → RECONCILING
POST   /api/v1/cycles/:id/reconcile                 → RECONCILING → RECONCILED
```

### Weekly Commits
```
POST   /api/v1/cycles/:cycleId/commits              → Create (DRAFT only)
PUT    /api/v1/commits/:id                           → Update (DRAFT only for plan fields)
DELETE /api/v1/commits/:id                           → Soft delete (DRAFT only)
PUT    /api/v1/commits/:id/reconcile                 → Update actuals (RECONCILING only)
PUT    /api/v1/commits/:id/reorder                   → Change priority_rank
```

### Manager
```
GET    /api/v1/manager/team?page=0&size=20          → Paginated team overview
GET    /api/v1/manager/team/:userId                  → Single member detail
POST   /api/v1/manager/reviews/:cycleId              → Submit review notes
GET    /api/v1/manager/alignment                     → RCDO alignment across team
```

---

## Project Structure

```
st6v3/
├── CLAUDE.md                      ← You are here
├── PLAN.md                        ← Phased build plan (reference during development)
├── .env.example                   ← Config template (committed)
├── .env                           ← Actual secrets (gitignored)
├── .github/
│   └── workflows/
│       └── ci.yml                 ← Build + test on push
├── docker-compose.yml
│
├── backend/
│   ├── pom.xml
│   ├── Dockerfile
│   └── src/
│       ├── main/
│       │   ├── java/com/st6/weekly/
│       │   │   ├── WeeklyApplication.java
│       │   │   ├── config/
│       │   │   │   ├── SecurityConfig.java
│       │   │   │   ├── CorsConfig.java
│       │   │   │   ├── RateLimitConfig.java
│       │   │   │   ├── RequestIdFilter.java
│       │   │   │   └── WebConfig.java
│       │   │   ├── security/
│       │   │   │   ├── JwtService.java
│       │   │   │   ├── JwtAuthFilter.java
│       │   │   │   ├── InputSanitizer.java
│       │   │   │   └── UserDetailsServiceImpl.java
│       │   │   ├── domain/
│       │   │   │   ├── user/
│       │   │   │   │   ├── User.java
│       │   │   │   │   ├── Role.java
│       │   │   │   │   └── UserRepository.java
│       │   │   │   ├── rcdo/
│       │   │   │   │   ├── RallyCry.java
│       │   │   │   │   ├── DefiningObjective.java
│       │   │   │   │   ├── Outcome.java
│       │   │   │   │   └── RcdoRepository.java
│       │   │   │   ├── cycle/
│       │   │   │   │   ├── WeeklyCycle.java
│       │   │   │   │   ├── CycleState.java
│       │   │   │   │   ├── CycleStateMachine.java
│       │   │   │   │   └── WeeklyCycleRepository.java
│       │   │   │   └── commit/
│       │   │   │       ├── WeeklyCommit.java
│       │   │   │       ├── ChessCategory.java
│       │   │   │       ├── CompletionStatus.java
│       │   │   │       └── WeeklyCommitRepository.java
│       │   │   ├── service/
│       │   │   │   ├── AuthService.java
│       │   │   │   ├── CycleService.java
│       │   │   │   ├── CommitService.java
│       │   │   │   ├── RcdoService.java
│       │   │   │   ├── CarryForwardService.java
│       │   │   │   ├── ManagerService.java
│       │   │   │   └── AuditService.java
│       │   │   ├── controller/
│       │   │   │   ├── AuthController.java
│       │   │   │   ├── CycleController.java
│       │   │   │   ├── CommitController.java
│       │   │   │   ├── RcdoController.java
│       │   │   │   └── ManagerController.java
│       │   │   ├── dto/
│       │   │   │   ├── request/
│       │   │   │   │   ├── LoginRequest.java
│       │   │   │   │   ├── CreateCommitRequest.java
│       │   │   │   │   ├── UpdateCommitRequest.java
│       │   │   │   │   ├── ReconcileCommitRequest.java
│       │   │   │   │   └── ReviewRequest.java
│       │   │   │   └── response/
│       │   │   │       ├── UserResponse.java
│       │   │   │       ├── CycleResponse.java
│       │   │   │       ├── CommitResponse.java
│       │   │   │       ├── RcdoTreeResponse.java
│       │   │   │       └── TeamOverviewResponse.java
│       │   │   └── exception/
│       │   │       ├── GlobalExceptionHandler.java
│       │   │       ├── InvalidStateTransitionException.java
│       │   │       ├── ResourceNotFoundException.java
│       │   │       └── ConflictException.java
│       │   └── resources/
│       │       ├── application.yml
│       │       ├── application-dev.yml
│       │       ├── application-prod.yml
│       │       ├── logback-spring.xml
│       │       └── db/migration/
│       │           ├── V1__create_users.sql
│       │           ├── V2__create_rcdo_hierarchy.sql
│       │           ├── V3__create_weekly_cycles_and_commits.sql
│       │           ├── V4__create_audit_log.sql
│       │           └── V5__seed_dev_data.sql  (dev profile only)
│       └── test/
│           └── java/com/st6/weekly/
│               ├── domain/
│               │   ├── CycleStateMachineTest.java
│               │   ├── WeeklyCommitValidationTest.java
│               │   └── ChessCategoryTest.java
│               ├── service/
│               │   ├── CycleServiceTest.java
│               │   ├── CommitServiceTest.java
│               │   ├── CarryForwardServiceTest.java
│               │   └── RcdoServiceTest.java
│               ├── security/
│               │   ├── JwtServiceTest.java
│               │   ├── InputSanitizerTest.java
│               │   └── RateLimitTest.java
│               └── controller/
│                   ├── AuthControllerIT.java
│                   ├── CycleControllerIT.java
│                   ├── CommitControllerIT.java
│                   └── ManagerControllerIT.java
│
├── frontend/
│   ├── package.json
│   ├── tsconfig.json               (strict: true)
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── index.html
│   ├── vitest.config.ts
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── api/
│       │   ├── client.ts            (axios + httpOnly cookie + retry + abort)
│       │   ├── cycles.ts
│       │   ├── commits.ts
│       │   ├── rcdo.ts
│       │   └── manager.ts
│       ├── types/
│       │   ├── domain.ts            (all domain types)
│       │   ├── api.ts               (request/response types)
│       │   └── errors.ts            (typed error handling)
│       ├── context/
│       │   └── AuthContext.tsx
│       ├── hooks/
│       │   ├── useCycle.ts
│       │   ├── useCommits.ts
│       │   ├── useRcdoTree.ts
│       │   └── useManager.ts
│       ├── pages/
│       │   ├── LoginPage.tsx
│       │   ├── WeeklyPlannerPage.tsx
│       │   ├── ReconciliationPage.tsx
│       │   ├── ManagerDashboardPage.tsx
│       │   ├── HistoryPage.tsx
│       │   └── UnauthorizedPage.tsx
│       ├── components/
│       │   ├── layout/
│       │   │   ├── AppShell.tsx
│       │   │   ├── Sidebar.tsx
│       │   │   └── ProtectedRoute.tsx
│       │   ├── commits/
│       │   │   ├── CommitCard.tsx
│       │   │   ├── CommitForm.tsx
│       │   │   └── CommitList.tsx
│       │   ├── chess/
│       │   │   ├── ChessPiecePicker.tsx
│       │   │   └── ChessPieceIcon.tsx
│       │   ├── rcdo/
│       │   │   └── RCDOTreePicker.tsx
│       │   ├── lifecycle/
│       │   │   ├── WeekStateBar.tsx
│       │   │   └── StateTransitionButton.tsx
│       │   ├── manager/
│       │   │   ├── TeamGrid.tsx
│       │   │   ├── TeamMemberCard.tsx
│       │   │   └── ReviewPanel.tsx
│       │   └── shared/
│       │       ├── ConfirmDialog.tsx
│       │       └── LoadingSkeleton.tsx
│       ├── styles/
│       │   └── globals.css
│       └── __tests__/
│           ├── setup.ts
│           ├── mocks/
│           │   └── handlers.ts       (MSW mock API handlers)
│           ├── a11y/
│           │   └── pages.a11y.test.tsx (axe-core accessibility audits)
│           ├── components/
│           │   ├── CommitForm.test.tsx
│           │   ├── CommitList.test.tsx
│           │   ├── ChessPiecePicker.test.tsx
│           │   ├── RCDOTreePicker.test.tsx
│           │   ├── ProtectedRoute.test.tsx
│           │   └── ConfirmDialog.test.tsx
│           └── pages/
│               ├── WeeklyPlannerPage.test.tsx
│               ├── ReconciliationPage.test.tsx
│               └── ManagerDashboardPage.test.tsx
```

---

## Design Direction

**Aesthetic: "Strategic Command Center"** — Clean, structured, confident. Dark theme.

- **Typography**: JetBrains Mono for data/code labels, Plus Jakarta Sans for headings/body
- **Colors**:
  - Background: `#0B0E14` / Surface: `#151922` / Border: `#1E2533`
  - Primary: `#3B82F6` (blue) / Success: `#10B981` (emerald) / Warning: `#F59E0B` (amber) / Danger: `#EF4444`
- **Layout**: CSS Grid dashboard, subtle glassmorphism on cards
- **Animations**: CSS transitions only (no Framer Motion dependency)

---

## Build & Run

### Full stack (Docker)
```bash
cp .env.example .env       # fill in secrets
docker compose up --build
```
- Frontend: http://localhost:5173
- Backend: http://localhost:8080
- PostgreSQL: localhost:5432

### Backend standalone
```bash
cd backend && ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

### Frontend standalone
```bash
cd frontend && npm install && npm run dev
```

### Run tests
```bash
cd backend && ./mvnw test
cd frontend && npm test
```

---

## Seed Data (dev profile only)

Loaded via Flyway migration `V5__seed_dev_data.sql`, gated by Spring profile `dev`.

**Users:** Alice Chen (MANAGER, manages Bob & Carol), Bob Martinez (MEMBER), Carol Nguyen (MEMBER), Dave Kim (ADMIN). All passwords: `Password1!` (BCrypt hashed in migration).

**RCDO Hierarchy:**
- "Accelerate Enterprise Adoption" → "Reduce onboarding time by 50%" → "Self-serve onboarding flow live", "Onboarding docs revamp complete"
- "Accelerate Enterprise Adoption" → "Land 10 enterprise logos in Q1" → "Enterprise pricing page shipped", "SOC2 compliance achieved"
- "Build World-Class Engineering Culture" → "Achieve 95% sprint completion rate" → "Automated deployment pipeline", "Test coverage > 80%"
- "Build World-Class Engineering Culture" → "Zero critical bugs in production" → "Error monitoring dashboard live", "Incident response playbook published"
- "Delight Users with Product Quality" → "NPS score > 70" → "User feedback system launched", "Top 5 pain points resolved"
- "Delight Users with Product Quality" → "Page load < 2 seconds" → "CDN migration complete", "Frontend bundle optimization"

**Sample weeks:** 4 weeks of historical data for Bob and Carol with varying states and completion rates. Current week in DRAFT.

---

## Design Context

### Users
Weekly planning tool for ST6 team members (individual contributors, managers, and admins) at an Austin-based PE operating firm. Users open it Monday morning to plan weekly commitments, linking individual work to organizational strategic goals via the RCDO hierarchy. End-of-week reconciliation closes the loop. Managers review team alignment asynchronously.

### Brand Personality
**Bold, Strategic, Elite** — High-stakes war room energy with strong contrast, decisive color use, and a leadership tone. This is a tool for people who operate at the top of their game.

### Emotional Goal
**Clarity and focus** — "I know exactly what to do this week." The interface should reduce cognitive load, surface priorities immediately, and make the planning ritual feel decisive rather than administrative.

### Accessibility
Practical best-effort: keyboard navigable, screen reader friendly, reasonable contrast ratios. Continue existing patterns (skip-to-content, aria labels, focus management, axe-core tests) without targeting formal WCAG certification.

### Design Principles
1. **Hierarchy is king** — Use weight, color, and spacing to make the most important information unmissable. The KING commit should visually dominate; a PAWN should recede.
2. **Data density over decoration** — Show more, decorate less. Monospace labels, tight grids, information-rich cards. No empty states that waste screen real estate.
3. **Color with intent** — Every color signals state or priority. No decorative color. The palette is small and each hue has a job.
4. **Decisive interactions** — Buttons, transitions, and states should feel instant and certain. No ambiguous loading states, no soft maybe-states. The UI commits (pun intended).
5. **Earned complexity** — Start simple, reveal depth. The chess metaphor, RCDO tree, and lifecycle states are complex — surface them progressively, not all at once.
