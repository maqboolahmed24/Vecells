# 83 Mock-Now vs Actual-Provider Cutover Strategy

## Mock now
Phase 0 ships against the simulator backplane as if it were a real external perimeter:
- the same route-family bindings, effect digests, replay classes, callback timing classes, and ambiguity states are published now
- browser, API, callback, and webhook tests all drive the runtime through `services/adapter-simulators/src/index.ts`
- notification repair emits `ReachabilityObservation` shapes directly instead of simulator-only placeholders

## Actual later
Live onboarding is constrained to adapter swap work only:
1. Add provider credentials, mailbox ownership, webhook secrets, and environment evidence.
2. Bind the live provider to the existing adapter contract profile.
3. Re-run the same replay, ambiguity, and callback timing tests against the live-bound adapter.

## Non-negotiable invariants
- Auth success still does not imply writable identity, grants, or ownership.
- IM1 acceptance still does not imply confirmed booking while weak confirmation is open.
- Transport acceptance still does not imply downstream acknowledgement or patient-safe calmness.
- Telephony and notification callbacks still stay adapter evidence until canonical settlement or repair clears them.

## Family-by-family swap boundary
- `nhs_login`: replace redirect inventory and client credentials only.
- `im1_gp`: replace supplier endpoint bindings, licences, and pairing evidence only.
- `mesh`: replace mailbox ownership and transport credentials only.
- `telephony`: replace number inventory, recording vendor credentials, and webhook material only.
- `notifications`: replace channel project IDs, sender identities, and webhook secrets only.

## Operational artifact
The detailed cutover rows live in `data/analysis/mock_to_live_cutover_checklist.csv`.

## Source refs
- `prompt/083.md`
- `data/analysis/simulator_contract_manifest.json`
- `data/analysis/mock_to_live_cutover_checklist.csv`
- `data/analysis/adapter_simulator_contract_manifest.json`
- `docs/external/38_simulator_fidelity_policy.md`
