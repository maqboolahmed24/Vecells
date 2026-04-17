# 92 Preview Environment And Seed Reset Design

`par_092` provisions governed preview environments as deterministic, synthetic-only runtime tuples instead of ad hoc branch deployments.

## Core decisions

- One preview environment binds one exact runtime tuple, one seed pack, one banner posture, and one reset controller.
- Preview environments remain non-production and synthetic-only even when they rehearse release-candidate flows.
- Reset covers the manifest tuple, domain store, FHIR store, projection state, event spine, cache plane, object storage, and browser banner markers.
- Drift is machine-readable. Missing tuple parity, mutated seed fixtures, missing banner markers, and TTL expiry all force a visibly degraded or expired posture.

## Environment families

- `pev_branch_patient_care`
- `pev_branch_support_replay`
- `pev_branch_clinical_hub`
- `pev_rc_pharmacy_dispatch`
- `pev_branch_ops_control`
- `pev_rc_governance_audit`

The branch previews bind to the `ci-preview` runtime ring. The release-candidate previews bind to `preprod` and preserve the same synthetic-only guardrails.

## Seed pack law

- `psp_patient_care_suite` covers intake, identity repair, telephony continuation, duplicate retry, and secure-link recovery.
- `psp_support_replay_suite` covers support replay restore, fallback review, and duplicate collision review.
- `psp_clinical_hub_suite` covers real hub ambiguity plus bounded clinical-workspace placeholder tuples.
- `psp_pharmacy_dispatch_suite` covers weak-match dispatch and preview publication rehearsal.
- `psp_control_plane_suite` provides structure-only operations and governance tuples pending later runtime-publication and wave-observation work.

The authoritative machine-readable outputs are:

- [preview_environment_manifest.json](/Users/test/Code/V/data/analysis/preview_environment_manifest.json)
- [preview_seed_pack_manifest.json](/Users/test/Code/V/data/analysis/preview_seed_pack_manifest.json)
- [preview_reset_matrix.csv](/Users/test/Code/V/data/analysis/preview_reset_matrix.csv)

## Reset controller

The local preview controller lives under [infra/preview-environments](/Users/test/Code/V/infra/preview-environments). Its scripts are:

- [bootstrap-preview-environment.mjs](/Users/test/Code/V/infra/preview-environments/local/bootstrap-preview-environment.mjs)
- [reset-preview-environment.mjs](/Users/test/Code/V/infra/preview-environments/local/reset-preview-environment.mjs)
- [detect-preview-drift.mjs](/Users/test/Code/V/infra/preview-environments/local/detect-preview-drift.mjs)
- [teardown-preview-environment.mjs](/Users/test/Code/V/infra/preview-environments/local/teardown-preview-environment.mjs)

These scripts do not truncate arbitrary state. They reapply canonical tuple hashes and substrate fixture hashes from the seed-pack manifest.

## Bounded gaps

- `PARALLEL_INTERFACE_GAP_092_CLINICAL_WORKSPACE_REFERENCE_CASE_PENDING`
- `PARALLEL_INTERFACE_GAP_092_CONTROL_PLANE_REFERENCE_CASE_PENDING`
- `FOLLOW_ON_DEPENDENCY_091_NONPROD_PROMOTION_ATTESTATION_PENDING`
- `FOLLOW_ON_DEPENDENCY_094_RUNTIME_PUBLICATION_BUNDLE_PENDING`
- `FOLLOW_ON_DEPENDENCY_097_WAVE_OBSERVATION_POLICY_PENDING`

Those gaps are explicit in the manifests so preview environments fail closed instead of pretending the missing runtime tuples already exist.
