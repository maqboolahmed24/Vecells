# par_150 Rule Pack And Calibration Strategy

`par_150` publishes one authored, machine-readable rule-pack schema at `/Users/test/Code/V/data/contracts/150_safety_rule_pack_schema.json` and one concrete registry at `/Users/test/Code/V/data/contracts/150_safety_rule_pack_registry.json`.

The active runtime pack is `RFRP_142_PHASE1_SYNCHRONOUS_SAFETY_V1`.

## Source alignment

The runtime pack is frozen against:

- `/Users/test/Code/V/data/contracts/142_red_flag_decision_tables.yaml`
- `/Users/test/Code/V/blueprint/phase-1-the-red-flag-gate.md`
- `/Users/test/Code/V/blueprint/phase-0-the-foundation-protocol.md`

The upstream thresholds remain:

- `theta_U = 0.083333`
- `theta_R = 0.285714`
- `theta_conf = 0.55`
- `theta_miss = 0.6`

## Weight seeds

The pack resolves the missing numeric seeds transparently under `GAP_RESOLVED_PHASE1_SAFETY_WEIGHT_SEEDS_V1`.

- hard stops remain dominant and are not softened by calibration
- urgent, residual, and reachability contributors use explicit `logLikelihoodWeight` values
- dependency-group caps stop correlated contributors from double-counting past the authored ceiling

## Calibrator posture

Phase 1 uses `SCAL_150_IDENTITY_CALIBRATOR_V1`.

- `sigma(z)` produces the raw urgent or residual probability
- the identity calibrator returns that probability unchanged
- no learned calibrator may be used until adjudicated challenge volume is sufficient and governed

This is recorded as `GAP_RESOLVED_PHASE1_SAFETY_IDENTITY_CALIBRATOR_V1`, which closes the “prose only” calibration gap without pretending live adjudicated model governance already exists.
