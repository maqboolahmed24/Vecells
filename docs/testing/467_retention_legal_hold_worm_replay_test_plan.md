# Task 467 Retention, Legal Hold, WORM, and Replay Dependency Test Plan

## Scope

This suite hardens Phase 9 records lifecycle coverage across the existing 442 retention lifecycle engine, 443 disposition execution engine, and 455 records governance UI projection.

## Test Layers

- Integration tests assert creation-time `RetentionLifecycleBinding`, artifact-class retention assignment, raw storage scan denial, legal hold and freeze blocking, WORM/hash-chain delete exclusion, archive manifest graph pinning, deletion certificate write-before-delete behavior, replay-critical archive-only protection, and idempotent disposition queue replay.
- Playwright tests exercise `/ops/governance/records`, `/ops/governance/records/holds`, and `/ops/governance/records/disposition` for exact, hold-active, freeze-active, dependency-blocked, archive-ready, delete-ready, archived, deleted, and permission-denied screenshots.
- The synthetic cross-suite fixture only fills classes not present in the 442/443 fixtures: incident bundle, recovery artifact, assistive final human artifact, transcript summary, and conformance artifact. All synthetic rows use explicit lifecycle bindings and hash-addressed refs.

## Mandatory Gap Checks

- Storage-scan deletion gap: raw storage scan candidates remain blocked and cannot become delete-ready.
- Dependency-light gap: transitive graph dependencies include assurance packs, investigations, CAPA, recovery artifacts, archive manifests, and deletion certificates.
- WORM exception gap: WORM/hash-chained records have no delete override path and no deletion certificate output.
- Certificate optimism gap: delete execution blocks when certificate write-before-delete fails.
- UI mismatch gap: records governance UI states reflect blocked, archive-only, delete-ready, stale, and denied backend postures.

## Privacy And Artifact Rules

Browser tests scan rendered DOM and ARIA snapshots for raw payload names, PHI markers, secret markers, and raw object-store URL patterns. Screenshots are generated only from synthetic records governance labels and summary-first artifact projections.
