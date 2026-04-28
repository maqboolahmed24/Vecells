# 97 Wave Observation Probe And Trigger Model

The probe catalog is published in [wave_observation_probe_catalog.json](/Users/test/Code/V/data/analysis/wave_observation_probe_catalog.json). It covers every probe class required by the prompt:

- `publication_parity`
- `provenance_verification`
- `continuity_evidence`
- `route_recovery_posture`
- `assurance_slice_trust`
- `synthetic_user_journey`

Every observation policy binds probe classes and rollback triggers directly in data. The generated rollback matrix in [rollback_trigger_matrix.csv](/Users/test/Code/V/data/analysis/rollback_trigger_matrix.csv) shows which triggers are merely armed and which ones fired during rehearsal.

Rollback trigger classes implemented in `par_097`:

- `hard_parity_drift`
- `trust_freeze_or_assurance_block`
- `continuity_control_regression`
- `critical_synthetic_journey_failure`
- `route_publication_or_recovery_disposition_drift`
- `manual_operator_approved`

Observation semantics:

- accepted control intent is not convergence
- satisfied observation requires dwell, sample count, fresh probes, exact continuity evidence, exact parity, converged route posture, and verified provenance
- blocked observation is used for incomplete or expired dwell proof
- stale watch posture is used for tuple drift across bound runtime truth
- rollback-required posture is reserved for armed triggers

The current readiness seam is intentionally explicit rather than hidden:

- `FOLLOW_ON_DEPENDENCY_READINESS_101_OPERATIONAL_READINESS_SNAPSHOT`

The current bounded defaults are also explicit rather than hidden constants:

- `GAP_RESOLUTION_WAVE_POLICY_MINIMUM_SAMPLE_COUNT`
- `GAP_RESOLUTION_WAVE_POLICY_PROBE_STALENESS_BUDGET`
