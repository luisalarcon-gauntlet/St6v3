# ST6v2 Audit — 24 Issues to Resolve

This is the complete list of issues identified in the v2 codebase. Every issue in this list has a corresponding fix AND test in v3. See PLAN.md for which phase resolves each issue.

---

## Authentication & Security

1. **Simplified auth with no SSO** — Plain email/password with no OAuth/OIDC, SAML, or MFA.
2. **JWT stored in localStorage (XSS risk)** — Attacker can steal token via XSS.
3. **Hardcoded JWT secret fallback** — Default secret in docker-compose.
4. **No CSRF protection** — CSRF disabled entirely.
5. **No input sanitization** — Commit titles, descriptions, review notes passed straight through.
6. **No rate limiting** — Nothing prevents API abuse.

## Data & API Design

7. **No pagination** — All list endpoints return every result.
8. **N+1 query problem in RCDO** — 26 separate API calls for the tree.
9. **No optimistic locking** — No @Version field, last-write-wins.
10. **Force-init anti-pattern** — `cycle.getCommits().size()` to initialize lazy collections.

## Frontend Architecture

11. **No route guards by role** — Routes render for any user, API call just fails.
12. **Weak TypeScript error handling** — Manual `as` casting on errors.
13. **State drift between store and server** — No polling, WebSocket, or stale detection.
14. **No confirmation on destructive actions** — Single-click delete.
15. **fetchFullTree waterfall** — No caching, no debouncing, no AbortController.
16. **No form validation beyond empty checks** — No max length, no hour bounds.
17. **Framer Motion imported but barely used** — 30KB for two fade-ins.
18. **Hardcoded frontend URLs** — No environment variables.

## Infrastructure & DevOps

19. **Hardcoded seed data** — Alice, Bob, Carol, Dave with password123 on every boot.
20. **No retry logic** — No exponential backoff on transient failures.
21. **Missing observability** — No structured logging, metrics, or tracing.
22. **No CI/CD or migration strategy** — No GitHub Actions, no Flyway.

## Accessibility

23. **No accessibility support** — No ARIA attributes, no keyboard navigation.

## Testing

24. **Minimal test coverage** — Only 4 test files in the entire project.
