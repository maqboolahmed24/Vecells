# 83 Simulator Backplane Design

## Mission
`par_083` turns simulator seams into first-class runtime infrastructure for Phase 0. The local stack now exposes one deterministic control plane in `services/adapter-simulators/src/index.ts` and preserves provider-facing semantics through typed `AdapterDispatchAttempt` and `AdapterReceiptCheckpoint` ledgers instead of static fixture-only mocks.

## Runtime shape
- `nhs_login`: OIDC-like authorize, callback, replay, and token redemption with state, nonce, PKCE, and post-auth return intent preserved.
- `im1_gp`: capability search, slot hold, commit, reschedule, and cancel with explicit weak confirmation and `ExternalConfirmationGate` posture.
- `mesh`: mailbox dispatch, poll, and receipt handling with correlation digests, delayed acknowledgement, duplicate delivery, and dead-letter states.
- `telephony`: IVR and callback simulation with urgent-live, recording, transcript readiness, continuation eligibility, and webhook retry recovery.
- `notifications`: SMS and email dispatch with delivery evidence, disputes, repair, and `ReachabilityObservation` emission.

## Determinism rules
- Reset and reseed rebuild from the upstream analysis packs under `data/analysis/`.
- IDs and timestamps are derived from fixed counters and offsets so browser and package tests stay replay-safe.
- Control-plane actions never bypass the service runtime; the HTML deck talks to `/api/control/*` and family endpoints, not directly to local JSON state.

## Machine-readable contract pack
- Manifest: `data/analysis/simulator_contract_manifest.json`
- Casebook: `data/analysis/provider_behavior_casebook.json`
- Cutover checklist: `data/analysis/mock_to_live_cutover_checklist.csv`
- Validator: `tools/analysis/validate_simulator_backplanes.py`

## Orchestration
- Entrypoint: `services/adapter-simulators/src/index.ts`
- Compose manifest: `services/adapter-simulators/manifests/docker-compose.yaml`
- SDK stubs: `services/adapter-simulators/src/sdk-clients.ts`
- Contract tests: `services/adapter-simulators/tests/backplane.test.ts`

## Parallel boundary
`PARALLEL_INTERFACE_GAP_IM1_RECORD_LOOKUP_BOUNDARY` remains explicit. par_083 proves the bounded booking-adjacent IM1 seam now and does not invent a broader patient-record mutation contract ahead of the shared adapter profile work.

## Source refs
- `prompt/083.md`
- `prompt/shared_operating_contract_076_to_085.md`
- `phase-0-the-foundation-protocol.md#1.23B AdapterDispatchAttempt`
- `phase-0-the-foundation-protocol.md#1.23C AdapterReceiptCheckpoint`
- `phase-0-the-foundation-protocol.md#2.3A AuthBridge`
- `phase-0-the-foundation-protocol.md#2.4A ReachabilityGovernor`
- `phase-2-the-identity-and-echoes.md`
- `phase-4-the-booking-engine.md`
- `platform-runtime-and-release-blueprint.md`
