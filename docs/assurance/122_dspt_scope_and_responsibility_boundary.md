# 122 DSPT Scope And Responsibility Boundary

This pack turns DSPT readiness into a source-traceable engineering artifact. The authoritative machine-readable sources are:

- [dspt_control_matrix.csv](../../data/assurance/dspt_control_matrix.csv)
- [dspt_gap_register.json](../../data/assurance/dspt_gap_register.json)
- [dspt_evidence_catalog.json](../../data/assurance/dspt_evidence_catalog.json)
- [essential_function_dependency_map.json](../../data/assurance/essential_function_dependency_map.json)
- [dspt_owner_raci.csv](../../data/assurance/dspt_owner_raci.csv)

## Standards Baseline

- DSPT working baseline: `CAF_ALIGNED_DSPT_WORKING_BASELINE_2026-04-14`
- CAF response and recovery emphasis: `CAF_RESPONSE_AND_RECOVERY_FOCUS_WORKING_BASELINE_2026-04-14`
- DTAC context only: `DTAC_REFERENCE_CONTEXT_2026-03`
- Clinical safety dependency: `PENDING_TASK_121_DCB0129_SEED_PACK`

These values are versioned on purpose. The pack is not pretending to be one eternal questionnaire snapshot.

## Responsibility Boundary

| Boundary | What Vecells owns now | What remains outside Vecells for now |
| --- | --- | --- |
| `supplier_manufacturer` | architecture controls, release tuples, secrets, masking, observability, dependency degradation, simulator-backed evidence, recovery schemas | deployer policy signoff and live operational proof |
| `hosting_operator` | non production topology, preview reset, restore tuple design, local rehearsal outputs | managed hosting attestations, preprod and production restore witness evidence |
| `end_user_org_deployer` | explicit evidence request placeholders and RACI rows | named SIRO, Caldicott, incident contacts, break-glass approvers, local policy approvals |
| `shared_joint_evidence` | control matrix rows where supplier and deployer must both contribute evidence | any attempt to collapse joint proof into one supplier artifact |
| `deployer_detail_pending` | open boundary marker only | false certainty about a deployer that does not yet exist |

## Scope Notes

- The current supplier side is Vecells as manufacturer plus the repo-owned runtime foundation.
- The current hosting side is still a modeled operator boundary. It is intentionally not treated as complete because live hosting attestation does not exist yet.
- The current deployer side is explicitly unresolved. `deployer_detail_pending` is a required gap marker and not a soft note.
- `PREREQUISITE_GAP_121_DCB0129_SEED_PACK_PENDING` is open because task `121` is still in progress. This pack keeps the dependency visible instead of assuming the clinical safety seed already exists.

## Mock Now Execution

- Use the repo's current topology, secrets, publication, observability, backup, restore, and degradation artifacts as real supplier-side readiness evidence.
- Publish explicit placeholder evidence rows for deployer-owned policy, incident, and break-glass artifacts.
- Keep all missing live proof in [dspt_gap_register.json](../../data/assurance/dspt_gap_register.json) so engineering can build on a truthful scaffold.

## Actual Production Strategy Later

- Preserve the same control codes, evidence refs, essential-function refs, and RACI rows.
- Replace placeholder deployer rows with named organisations, hosting contracts, and signed operational evidence.
- Replace mock-only or simulator-backed evidence with live onboarding evidence where required without changing the underlying pack shape.

## Boundary Decision

The pack does not allow supplier evidence to masquerade as deployer proof. The control matrix and evidence catalog deliberately keep those obligations separate so later DSPT completion fills this structure in rather than rebuilding it from scratch.
