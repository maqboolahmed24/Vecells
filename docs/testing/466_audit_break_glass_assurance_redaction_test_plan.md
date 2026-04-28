# Task 466 Audit, Break-Glass, Assurance Pack, and Redaction Test Plan

Task: `par_466_phase9_Playwright_or_other_appropriate_tooling_testing_run_audit_break_glass_assurance_pack_and_redaction_suites`

## Scope

This suite hardens Phase 9 assurance-ledger surfaces that share investigation scope, WORM audit evidence, break-glass review, support replay restore settlement, assurance pack generation, governed export, and redaction controls.

The deterministic source fixture is `tests/fixtures/466_audit_assurance_synthetic_cases.json`; result evidence is `data/evidence/466_audit_break_glass_assurance_redaction_results.json`.

## Coverage

- WORM ledger append continuity, previous-hash chaining, tamper detection, and deterministic timeline ordering.
- Audit pivots for request, patient, task, appointment, pharmacy case, and actor; every pivot is required to rejoin `InvestigationScopeEnvelope`, `InvestigationTimelineReconstruction`, and WORM records.
- Investigation purpose, masking policy, selected anchor, question hash, scope hash, timeline hash, causality state, and graph state.
- Break-glass reason adequacy, visibility widening summary, expiry, object class coverage, follow-up burden, queue state, absent review, and expired review.
- Support replay restore settlement, checkpoint hash, masking policy, selected anchor, held-draft disposition, telemetry fence, and fail-closed replay exit.
- Assurance pack framework coverage for DSPT, DTAC, DCB0129, and DCB0160; pack hash inputs, reproduction hash, export manifest hash, export-ready settlement, and stale/blocked/denied/redaction-drift failure modes.
- Artifact presentation contract, artifact surface frame, artifact mode truth projection, outbound navigation grant, and disabled raw export URLs/unmanaged downloads.
- DOM, ARIA, telemetry, screenshot, and trace redaction checks using synthetic-only data.

## Commands

```bash
pnpm exec tsx ./tools/test/run_phase9_audit_break_glass_assurance_redaction.ts
pnpm exec vitest run tests/integration/466_worm_audit_integrity.test.ts tests/integration/466_pack_generation_determinism.test.ts tests/integration/466_artifact_presentation_redaction.test.ts
pnpm exec tsx tests/playwright/466_audit_explorer_and_replay.spec.ts --run
pnpm exec tsx tests/playwright/466_break_glass_review.spec.ts --run
pnpm exec tsx tests/playwright/466_assurance_pack_generation_export.spec.ts --run
pnpm exec tsx tests/playwright/466_redaction_dom_aria_telemetry.spec.ts --run
pnpm exec tsx ./tools/analysis/validate_466_phase9_audit_break_glass_assurance_redaction.ts
```

`pnpm run test:phase9:audit-break-glass-assurance-redaction` runs the generator, integration tests, and all four Playwright specs.

## Evidence Artifacts

- `tests/fixtures/466_audit_assurance_synthetic_cases.json`
- `data/evidence/466_audit_break_glass_assurance_redaction_results.json`
- `data/contracts/PHASE9_BATCH_458_472_INTERFACE_GAP_466_AUDIT_ASSURANCE_TEST_FIXTURE.json`
- `output/playwright/466-audit-assurance-redaction/*.png`
- `output/playwright/466-audit-assurance-redaction/*.aria.yml`
- `output/playwright/466-audit-assurance-redaction/*-trace.zip`

## Exit Gate

The suite passes only when exact, stale, blocked, denied, and export-ready states are all covered; when the required five gaps are closed; and when generated DOM/ARIA/telemetry evidence contains no raw identifiers, PHI markers, secrets, raw URLs, or unmanaged artifact links.
