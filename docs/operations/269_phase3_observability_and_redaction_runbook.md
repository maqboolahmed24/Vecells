# 269 Phase 3 Observability And Redaction Runbook

## Purpose

This runbook governs the internal validation layer for workspace and support flows.

Use it when:

- a release candidate needs UI event and redaction proof
- the validation board shows route-contract drift
- support replay or restore chains stop joining settlement truth
- a reviewer needs to prove PHI stayed masked in emitted telemetry

## Core checks

1. Open `/workspace/validation?state=live`.
2. Confirm `ValidationNorthStarBand` shows:
   - settlement join rate
   - redaction pass rate
   - support integrity joins
3. Confirm `RouteContractDriftPanel` and `DefectAndRemediationLedger` do not contain unexpected failures.
4. Open the evidence links for:
   - event-chain trace
   - redaction trace
   - validation-board trace
5. Re-run the 269 Playwright suites if the board and code disagree.

## Redaction procedure

When the board reports `disclosure_fence_failure`:

1. inspect the affected event family in `269_ui_event_contract_catalog.json`
2. inspect the emitted route family and action family in the event-chain list
3. confirm the emitted fields only use approved wrappers from `@vecells/observability`
4. remove any raw identifier, free-text fragment, artifact excerpt, or unmasked route payload
5. re-run `269_ui_event_redaction.spec.ts`

## Contract drift procedure

When the board reports `stale_route_contract_mismatch`:

1. compare the route family and action family to `269_ui_event_contract_catalog.json`
2. verify the shell still publishes the correct automation anchor
3. verify the semantic coverage reference still matches the route family
4. update the runtime wiring, contract JSON, validator, and tests together

Do not patch the board to suppress the defect.

## Missing settlement joins

When the board reports `missing_settlement_join`:

1. confirm the UI action emitted an event
2. confirm the same interaction wrote a settlement record
3. confirm local acknowledgement and authoritative posture remain separate
4. rerun the event-chain proof to verify the join

## Support parity procedure

Support replay, history, knowledge, action, and restore flows must join the same validation spine as workspace routes.

Check:

- replay entry emits `support_replay`
- replay restore emits `support_restore`
- history widen emits `history_reveal`
- knowledge route emits `knowledge_reveal`
- support action route emits `callback_action` or `message_action`

## Release gate expectation

Expected calm release posture:

- settlement join rate at or near 100%
- redaction pass rate at or near 100%
- no unapproved route-contract drift
- support integrity joins present when support routes were exercised
- no blocked disclosure fences

Blocked release posture:

- any active PHI leak or mismatched disclosure fence
- route-contract drift without a paired contract update
- missing settlement joins on critical action families
