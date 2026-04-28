# Task 468 Restore, Failover, Chaos, And Slice Quarantine Test Plan

## Scope

This suite hardens Phase 9 resilience proof across the domain contracts and the `/ops/resilience` Resilience Board. It covers essential-function recovery maps, backup freshness, restore runs, failover runs, chaos runs, recovery artifacts, report channels, stale tuple invalidation, and projection slice quarantine.

## Integration Coverage

- `468_restore_run_contract.test.ts` checks essential-function and recovery-tier completeness, current/stale/missing/withdrawn backup manifests, clean-room restore authority, dependency order blocking, journey proof completeness, and the data-restore-only gap.
- `468_failover_run_contract.test.ts` checks scenario approval, activation, validation, stand-down, stale tuple settlement, and log-completion authority.
- `468_chaos_run_contract.test.ts` checks schedule, start, halt, complete, guardrail-blocked, and blast-radius cases.
- `468_recovery_evidence_pack.test.ts` checks pack admissibility, graph writeback, ArtifactPresentationContract refs, outbound grants, report channel delivery, and raw link rejection.
- `468_assurance_slice_quarantine.test.ts` checks projection mismatch, exact replay divergence, slice-bounded quarantine, degraded attestation, unaffected slice trust, and release writeback.

## Playwright Coverage

- `468_resilience_board_restore_failover_chaos.spec.ts` captures exact, stale, blocked, recovery-only, guardrail-constrained, and quarantined Resilience Board states.
- `468_resilience_artifact_presentation.spec.ts` verifies recovery evidence artifact presentation, outbound grant identifiers, report channel coverage, accessibility snapshots, and raw-link redaction.
- `468_slice_quarantine_ui.spec.ts` verifies blocked selected-slice controls, unaffected current-tuple rows, keyboard operation, and summary-only quarantine presentation.

## Safety Gates

Browser assertions reject raw object-store URLs, PHI markers, secret refs, access tokens, and production/pre-production/staging environment identifiers in DOM text and ARIA snapshots. The task does not persist Playwright traces.
