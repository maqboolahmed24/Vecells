# 252 Dependency Evaluation And Reopen Controls

## Control posture

Generic blocked booleans are forbidden. `252` publishes typed dependency state, typed trigger refs, typed blocker refs, and one dominant recovery route.

## Required fail-closed rules

- Transport acceptance or a quiet queue row does not prove contact or consent health.
- UI flags, comments, or local support notes cannot decide dependency legality.
- Stale tuple writes must return `stale_recoverable`.
- Advice and bounded admin consequence must fail closed when `reopenState != stable`.
- Repair blockers, reopen triggers, and clinical reentry triggers must not collapse into one generic bucket.

## Source-of-truth controls

Operational dependency truth comes only from canonical upstream facts:

- reachability and repair from `245`
- callback and message dispute posture from `244`, `245`, and `247`
- content invalidation and render posture from `250`
- bounded admin waiting and continuity posture from `251`
- request evidence and safety refs from the control-plane request snapshot

## Dominant blocker precedence

The dominant next action is deterministic:

1. clinician reentry
2. identity repair
3. consent renewal
4. route repair
5. delivery dispute review
6. external dependency follow-up

This precedence is fixed so downstream UI and analytics do not reconstruct it independently.

## Explicit accepted gaps

- request-scoped identity hold truth is still injected through a narrow port rather than a shared live identity-access query surface
- cross-package source manifests still need a later ownership reconciliation for `AdviceAdminDependencySet`
