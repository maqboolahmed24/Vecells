# Task 466 Algorithm Alignment Notes

Reviewed at: 2026-04-28T00:00:00.000Z

## Source Blocks

- Phase 9 9C: `InvestigationScopeEnvelope` is the authority for audit search, break-glass review, support replay, data subject trace, and export preview.
- Phase 9 9C: `InvestigationTimelineReconstruction` must be ordered by `eventTime`, `sourceSequenceRef`, and `assuranceLedgerEntryId`, and is shared by audit detail, replay, diff, and export.
- Phase 9 9D: assurance pack generation requires current standards map, graph verdict, trust set, evidence set, continuity set, redaction policy, template hash, export manifest hash, and reproduction hash.
- Phase 9 9A and Phase 0: WORM audit evidence, artifact presentation, outbound navigation grants, command settlement, and `UITelemetryDisclosureFence` controls must fail closed when stale or blocked.
- Operations frontend blueprint: `/ops/audit` and `/ops/assurance` may show indexed summaries, but detail, replay, and export actions must pivot to scoped timeline and graph-backed proof.

## Implemented Test Mapping

- `tests/integration/466_worm_audit_integrity.test.ts` checks WORM append continuity, timeline order, tamper detection, search pivots, break-glass blockers, and support replay restore settlement.
- `tests/integration/466_pack_generation_determinism.test.ts` checks DSPT/DTAC/DCB framework coverage, pack hash determinism, reproduction exactness, export-ready settlement, and stale/blocked/denied failure modes.
- `tests/integration/466_artifact_presentation_redaction.test.ts` checks `ArtifactPresentationContract`, `ArtifactSurfaceFrame`, `ArtifactModeTruthProjection`, `OutboundNavigationGrant`, and redacted synthetic payloads.
- `tests/playwright/466_audit_explorer_and_replay.spec.ts` covers audit search, timeline, graph, support replay, bundle export, stale, degraded, blocked, denied, and settlement-pending states.
- `tests/playwright/466_break_glass_review.spec.ts` covers reason adequacy, visibility widening copy, expiry, follow-up burden, authorized visibility, and fail-closed blocked/permission states.
- `tests/playwright/466_assurance_pack_generation_export.spec.ts` covers pack preview, pack hashes, framework switching, export-ready settlement, and stale/degraded/blocked/denied pack states.
- `tests/playwright/466_redaction_dom_aria_telemetry.spec.ts` covers DOM, ARIA, telemetry log, reduced motion, mobile layout, and synthetic-only screenshot/trace artifacts.

## Mandatory Gap Closure

- Audit search index truth: closed by `searchPivotCases`, which mark `AccessEventIndex` as index authority only and require timeline/WORM truth authority.
- Break-glass UX: closed by Playwright assertions for not-required, pending review, expired, authorized visibility, reason adequacy, expiry, and reviewer burden.
- Pack export optimism: closed by export-ready settlement requiring current graph, pack version, grant, and redaction policy; stale/blocked/denied states cannot expose live export.
- Redaction leakage: closed by payload, DOM, ARIA, telemetry, screenshot, and trace-safe synthetic artifact checks.
- Replay exit: closed by `support-replay-restore:*` settlement, checkpoint hash, mask scope, and blocked/stale replay UI states.

## Fixture Notes

The source fixture is deliberately synthetic. It binds existing deterministic domain fixtures from tasks 439, 440, and 463 into a task 466 evidence envelope rather than introducing production-like patient identifiers. Appointment and pharmacy-case pivots are minimal synthetic pivots that prove the index-to-WORM-timeline contract without expanding PHI surface.
