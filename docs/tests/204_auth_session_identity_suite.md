# 204 Auth Session Identity Suite

## Purpose

Task `seq_204` publishes the repeatable Phase 2 auth/session hardening suite for callback replay, session rotation, logout invalidation, identity mismatch, wrong-patient hold, and same-shell recovery. The suite is grounded in the local Phase 2 trust model and runs now against repository-owned auth/session services, deterministic fixtures, and a browser-visible assurance lab.

## Mock-Now Execution

The current run is mock-backed now. It uses the repository mock authorisation service semantics, local auth transaction fixtures, local session-governor rules, and static browser proof in `docs/frontend/204_auth_session_assurance_lab.html`. It does not claim live NHS login provider evidence.

The mock-now lane proves:

- callback exact-once consumption and duplicate settlement collapse
- state, nonce, return-intent, logout, and superseded-tab fences
- session epoch creation, rotation, downgrade, idle expiry, absolute expiry, and cookie-key mismatch handling
- wrong-patient hold entry and release with PHI suppression
- same-shell continuity for request detail, recovery, logout, and claim step-up routes

## Live-Provider-Later Strategy

Live-provider-later work must keep the same transaction names, continuity tuples, route fences, session epoch semantics, and expected event vocabulary. If a real provider returns different callback timing or OIDC metadata, the adapter or provider-console configuration must be corrected. The local trust model must not be softened to match provider quirks.

## Design Research References

The lab borrows composition discipline, not branding, from these high-trust references:

- NHS Service Manual typography: `https://service-manual.nhs.uk/design-system/styles/typography`. Borrowed idea: clear hierarchy, measured line lengths, and restrained clinical copy keep trust work scannable.
- GOV.UK Design System type scale: `https://design-system.service.gov.uk/styles/type-scale/`. Borrowed idea: stable type scale and zoom resilience matter more than decorative dashboard chrome.
- IBM Carbon dashboards guidance: `https://v10.carbondesignsystem.com/data-visualization/dashboards/`. Borrowed idea: establish strong hierarchy, limit non-essential metrics, and use whitespace to reduce complexity.
- IBM Carbon status indicators pattern: `https://v10.carbondesignsystem.com/patterns/status-indicator-pattern/`. Borrowed idea: status labels must be textual and scannable, not color-only signals.

## Repository-Owned Defect Evidence

No 204-scoped repository-owned defect was found in the current auth/session boundary. The targeted service run passed:

```bash
pnpm --filter @vecells/command-api exec vitest run tests/auth-bridge.integration.test.js tests/session-governor.integration.test.js tests/identity-binding-authority.integration.test.js tests/authenticated-portal-projections.integration.test.js tests/identity-repair-chain.integration.test.js
```

Observed result: 5 test files passed, 27 tests passed, latest duration 521ms. A broader command-api run also executed unrelated Phase 1 intake suites and surfaced non-204 failures; those were excluded from the 204 defect verdict because they do not exercise callback replay, session expiry, identity mismatch, or logout invalidation.

## Deliverable Map

| Artifact                                                  | Role                                                             |
| --------------------------------------------------------- | ---------------------------------------------------------------- |
| `data/test/204_auth_replay_cases.csv`                     | Callback replay and callback-integrity fixtures                  |
| `data/test/204_session_rotation_and_expiry_cases.csv`     | Session fixation, rotation, expiry, and logout fixtures          |
| `data/test/204_identity_mismatch_cases.csv`               | Wrong-subject, wrong-patient, and same-shell continuity fixtures |
| `data/test/204_expected_events_and_settlements.json`      | Required counters, event names, and settlement rules             |
| `data/test/204_suite_results.json`                        | Machine-readable run verdict with status vocabulary              |
| `docs/frontend/204_auth_session_assurance_lab.html`       | Browser-visible `Auth_Session_Assurance_Lab`                     |
| `tests/playwright/204_auth_session_assurance_lab.spec.ts` | Playwright structural and browser proof                          |
| `tools/test/validate_phase2_auth_session_suite.py`        | Repository validator and chain guard                             |

## Commands

```bash
pnpm validate:phase2-auth-session-suite
pnpm exec tsx tests/playwright/204_auth_session_assurance_lab.spec.ts
pnpm exec tsx tests/playwright/204_auth_session_assurance_lab.spec.ts --run
```

The suite results file distinguishes `passed`, `failed`, `blocked_external`, and `not_applicable`. Live provider evidence is explicitly `not_applicable` for this mock-now run.
