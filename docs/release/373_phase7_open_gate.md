# 373 Phase 7 Open Gate

## Verdict

`open_phase7_with_constraints`

The first NHS App deferred-channel wave may start now for `374` to `379`.

## Not Approved

This verdict does not approve:

- NHS App go-live
- limited release or full release
- Sandpit or AOS sign-off
- SCAL or clinical-safety sign-off
- public NHS App route exposure
- live pharmacy partner onboarding
- manual assistive technology completion
- rollback rehearsal completion

## Launch Conditions

- `LC373_001`: `374` must freeze manifest truth before any route exposure work.
- `LC373_002`: `375` must freeze trusted embedded context and SSO contracts before context or auth runtime work.
- `LC373_003`: `376` must freeze artifact, accessibility, telemetry, SCAL, and release guardrails before later UI or environment tracks.
- `LC373_004`: `377` to `379` may implement only against the launch packets produced by this gate.
- `LC373_005`: `380` to `397` remain blocked until their upstream freeze and runtime owners finish.
- `LC373_006`: `398` to `402` remain deferred until executable evidence and external release evidence exist.

## Carry Forward From Phase 6

The gate keeps `CF372_001` through `CF372_006` visible. These are not repository-owned blockers for starting Phase 7, but they are live-release blockers.

## Evidence

- `data/contracts/372_phase6_exit_verdict.json`
- `data/contracts/372_phase6_to_phase7_handoff_contract.json`
- `data/contracts/373_phase7_track_readiness_registry.json`
- `data/contracts/373_phase7_dependency_interface_map.yaml`
- `data/contracts/373_parallel_assistive_assurance_preconditions.json`
- `data/contracts/373_future_phase_dependency_reserve.json`
- `data/analysis/373_phase7_track_owner_matrix.csv`
- `data/analysis/373_phase7_parallel_gap_log.csv`

## Review Command

```bash
pnpm validate:373-phase7-parallel-gate
pnpm exec tsx tests/playwright/373_phase7_parallel_tracks_gate_board.spec.ts --run
```
