# 102 Non-Production Canary And Rollback Harness

## Mission

`par_102` turns non-production release-wave posture into executable runtime truth. The harness binds `ReleaseWatchTuple`, `WaveObservationPolicy`, `WaveGuardrailSnapshot`, `WaveActionImpactPreview`, `WaveActionExecutionReceipt`, `WaveActionRecord`, `WaveActionSettlement`, `ReleaseWatchEvidenceCockpit`, and `ReleaseRecoveryDisposition` into one rehearsal path for canary start, widen, pause, rollback, rollforward, and kill-switch.

The implementation lives in:

- `packages/release-controls/src/canary-rollback-harness.ts`
- `tools/runtime-canary-rollback/shared.ts`
- `tools/runtime-canary-rollback/run-canary-rollback-rehearsal.ts`
- `tools/runtime-canary-rollback/verify-canary-rollback.ts`
- `data/analysis/canary_scenario_catalog.json`
- `docs/architecture/102_canary_and_rollback_cockpit.html`

## Authoritative Inputs

- `prompt/102.md`
- `prompt/shared_operating_contract_096_to_105.md`
- `data/analysis/runtime_publication_bundles.json`
- `data/analysis/release_publication_parity_records.json`
- `data/analysis/release_watch_pipeline_catalog.json`
- `data/analysis/resilience_baseline_catalog.json`
- `data/analysis/build_provenance_manifest.json`
- `data/analysis/gateway_surface_manifest.json`

## Rehearsal Surfaces

The canonical scenario catalog publishes six bounded rehearsal paths:

1. `LOCAL_CANARY_START_HAPPY_PATH`
2. `LOCAL_WIDEN_AFTER_SATISFIED_OBSERVATION`
3. `CI_PREVIEW_PAUSE_CONSTRAINED_GUARDRAIL`
4. `INTEGRATION_ROLLBACK_ON_TRIGGER_BREACH`
5. `PREPROD_KILL_SWITCH_ON_TRUST_OR_PARITY_FAILURE`
6. `LOCAL_ROLLFORWARD_AFTER_SUPERSEDED_TUPLE`

Each path writes deterministic records for:

- guardrail snapshot
- impact preview
- action record
- execution receipt
- observation window
- settlement
- watch evidence cockpit
- append-only audit trail

## Runtime Guarantees

- Rollback is accepted only when an explicit target bundle, runbook binding, and recovery evidence pack are bound to the same action.
- Widen and rollforward require a fresh readiness snapshot and a current satisfied watch tuple.
- Pause remains executable under constrained posture so operators can arrest exposure without manufacturing rollback proof.
- Kill-switch remains a first-class action when trust or parity failure freezes the guardrail.
- Superseded tuples are published as separate preview artifacts; the harness never mutates an existing tuple or action in place.

## Gap Resolutions

- `GAP_RESOLUTION_CANARY_RING_NONPROD`: the rehearsal ring set is fixed to `local`, `ci-preview`, `integration`, and `preprod` until later live cohort logic is published.
- `GAP_RECOVERY_DISPOSITION_READ_ONLY_OR_RECOVERY_ONLY`: where richer recovery dispositions are not yet authored, the harness narrows posture to `read_only` or `recovery_only` and still requires explicit rollback evidence before action execution.

## Follow-On Dependencies

- `FOLLOW_ON_DEPENDENCY_WAVE_GOVERNANCE_APPROVALS`: later governance approval flows may strengthen operator authorization without changing the meaning of preview, receipt, observation, or settlement records.
- `FOLLOW_ON_DEPENDENCY_103_SHELL_ROLLOUT_SURFACE_BINDING`: later shell-facing rollout surfaces must consume the same published canary catalog instead of reconstructing wave truth from logs or dashboards.
