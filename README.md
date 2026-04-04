# ST6v3 — Weekly Commits Planning System

A full-stack weekly planning application that replaces 15-Five by structurally connecting individual weekly commitments to organizational strategic goals through the RCDO hierarchy (Rally Cry → Defining Objective → Outcome).

## Architecture

```
┌──────────────────────────────────────────────────┐
│  React 18 + TypeScript + TailwindCSS (Vite)      │
│  Auth: httpOnly cookie session                    │
│  Role-guarded routes, typed error handling        │
└──────────────────────┬───────────────────────────┘
                       │ REST API (JSON)
                       │ withCredentials: true
┌──────────────────────┴───────────────────────────┐
│  Spring Boot 3.3 (Java 21)                       │
│                                                   │
│  Request flow:                                    │
│  CORS → Rate Limit → CSRF → JWT Cookie Extract   │
│  → Auth Filter → Input Sanitize → Controller     │
│                                                   │
│  Security: httpOnly JWT, Bucket4j, Jsoup          │
│  Data: Flyway migrations, @Version locking        │
│  Errors: RFC 7807 Problem Details                 │
└──────────────────────┬───────────────────────────┘
                       │ JPA / Hibernate
┌──────────────────────┴───────────────────────────┐
│  PostgreSQL 16                                    │
│  Schema managed by Flyway                         │
└──────────────────────────────────────────────────┘
```

## Quick Start

```bash
# 1. Clone and configure
git clone <repo-url> && cd st6v3
cp .env.example .env
# Edit .env — fill in POSTGRES_PASSWORD and JWT_SECRET

# 2. Run everything
docker compose up --build

# 3. Open the app
# Frontend: http://localhost:5173
# Backend:  http://localhost:8080
# Postgres: localhost:5432
```

### Dev login credentials (dev profile only)
| User           | Role    | Email              | Password    |
|----------------|---------|--------------------|-------------|
| Alice Chen     | MANAGER | alice@st6.example  | Password1!  |
| Bob Martinez   | MEMBER  | bob@st6.example    | Password1!  |
| Carol Nguyen   | MEMBER  | carol@st6.example  | Password1!  |
| Dave Kim       | ADMIN   | dave@st6.example   | Password1!  |

## Development

### Backend (standalone)
```bash
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

### Frontend (standalone)
```bash
cd frontend
npm install
npm run dev
```

### Run Tests
```bash
# Backend (includes integration tests with TestContainers)
cd backend && ./mvnw verify

# Frontend (Vitest + React Testing Library)
cd frontend && npm test
```

## Key Domain Concepts

### RCDO Hierarchy
```
Rally Cry → Defining Objective → Outcome
```
All weekly commits must link to a specific Outcome, ensuring individual work connects to organizational goals.

### Chess Layer Prioritization
| Piece  | Role                              | Limit      |
|--------|-----------------------------------|------------|
| KING   | Non-negotiable, must complete     | 1 per week |
| QUEEN  | High impact, flexible             | —          |
| ROOK   | Important, routine                | —          |
| BISHOP | Strategic, cross-functional       | —          |
| KNIGHT | Creative, unexpected value        | —          |
| PAWN   | Small tasks, quick wins           | —          |

### Weekly Lifecycle
```
DRAFT → LOCKED → RECONCILING → RECONCILED → [carry-forward]
```

## Security Measures

- JWT stored in **httpOnly + Secure + SameSite=Strict** cookies (not localStorage)
- Input sanitization via **Jsoup** on all text fields
- Rate limiting via **Bucket4j** (100 req/min/IP)
- CSRF protection enabled
- Optimistic locking with **@Version** on mutable entities
- Role-based access enforced at API and route level
- No hardcoded secrets — all config via environment variables

## Test Strategy

- **Domain logic:** JUnit 5 unit tests (state machine, validation, entities)
- **Services:** JUnit 5 + Mockito (business logic, edge cases)
- **API endpoints:** @SpringBootTest + TestContainers (full HTTP round-trip)
- **Security:** Integration tests for auth, roles, rate limiting, XSS
- **Components:** Vitest + React Testing Library
- **API client:** Vitest + MSW (retry, abort, error handling)
- **Accessibility:** jest-axe on all page components

Built with TDD — every feature's test was committed before its implementation.
