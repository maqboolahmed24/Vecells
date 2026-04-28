# 345 Phase 6 Parallel Open Gate

Gate verdict: `wave_1_open_with_constraints`

## Decision

Phase 6 may start now, but only through the narrow first backend wave:

- `par_346` pharmacy case state machine and lineage linkage
- `par_347` eligibility engine and versioned policy-pack compiler

Everything else is held:

- `348` to `365`: `blocked`
- `366` and `367`: `deferred`
- `368` to `371`: `blocked`

## Why 345 fails closed

- package truth cannot start before real provider-choice and consent truth
- dispatch proof cannot start before immutable package truth
- outcome reconciliation cannot start before dispatch truth
- urgent return and reopen cannot start before outcome truth
- pharmacy UI cannot start before patient, practice, and console truth projections exist
- environment onboarding cannot overrule inherited manual-bridge and review-required boundaries

## Launch packets

- [345_track_launch_packet_346.json](/Users/test/Code/V/data/launchpacks/345_track_launch_packet_346.json)
- [345_track_launch_packet_347.json](/Users/test/Code/V/data/launchpacks/345_track_launch_packet_347.json)

## Machine-readable gate assets

- [345_phase6_track_readiness_registry.json](/Users/test/Code/V/data/contracts/345_phase6_track_readiness_registry.json)
- [345_phase6_dependency_interface_map.yaml](/Users/test/Code/V/data/contracts/345_phase6_dependency_interface_map.yaml)
- [345_phase6_parallel_gap_log.json](/Users/test/Code/V/data/analysis/345_phase6_parallel_gap_log.json)

## Explicit non-negotiables

- Do not let later tracks redefine `PharmacyCase`, `PharmacyRulePack`, `PharmacyDispatchTruthProjection`, `PharmacyOutcomeTruthProjection`, or `PharmacyBounceBackRecord`.
- Do not let frontend tracks infer truth vocabularies later.
- Do not let environment setup tasks overclaim readiness that still depends on operator-owned approvals.
- Do not reinterpret inherited Phase 5 blockers as resolved by narrative optimism.
