# 122 DSPT Gap Assessment

The gap assessment is derived from [dspt_control_matrix.csv](../../data/assurance/dspt_control_matrix.csv) and [dspt_gap_register.json](../../data/assurance/dspt_gap_register.json).

## Current Posture

- Control rows: `14`
- `seeded_in_repo`: `4`
- `partial`: `8`
- `blocked_on_parallel_task`: `1`
- `open_evidence_request`: `1`

The important point is that this is not a green dashboard. The pack already distinguishes architecture-backed controls from deployer-owned proof and from blocked prerequisites.

## Highest Priority Gaps

| Gap id | Why it matters now | Next action |
| --- | --- | --- |
| `PREREQUISITE_GAP_121_DCB0129_SEED_PACK_PENDING` | urgent-diversion and clinician-facing safety controls cannot be presented as fully mapped without the clinical safety seed pack | consume task `121` outputs as soon as they exist |
| `GAP_122_DEPLOYER_BOUNDARY_DETAIL_PENDING` | supplier evidence alone is not enough for CAF-aligned DSPT posture | bind the first deployer and hosting operator into the matrix |
| `GAP_122_INCIDENT_TABLETOP_EXERCISE_PENDING` | incident response is only a plan until exercised | run the tabletop and publish the output pack |
| `GAP_122_PREPROD_RESTORE_REHEARSAL_PENDING` | local restore proof is useful but not release-grade | repeat the rehearsal in preprod against the current runtime tuple |
| `GAP_122_BREAK_GLASS_APPROVER_ROSTER_PENDING` | the access model is incomplete until named approvers exist | replace placeholder approvers during pilot deployer onboarding |

## Remediation Queue

1. Close the `par_121` dependency so clinical safety control mappings stop relying on a placeholder evidence row.
2. Name the first deployer organisation and hosting operator so `deployer_detail_pending` can be retired from the high-severity boundary rows.
3. Execute the incident tabletop and publish its output under the existing evidence refs.
4. Execute a preprod restore rehearsal tied to the active runtime publication tuple.
5. Convert simulator-backed supplier assumptions into provider-specific onboarding evidence as tasks `123` and `124` mature.

## Mock Now Execution

- The matrix uses real repo artifacts for supplier-side architecture proof.
- Missing live operational proof is carried as explicit open gaps with owners and dates.
- No control is marked complete just because a design exists.

## Actual Production Strategy Later

- Use the same control rows and evidence refs for the real DSPT submission journey.
- Replace placeholder evidence states with executed exercises, signed policies, and deployer-owned approvals.
- Keep old gap history in the register rather than deleting it so assurance drift stays auditable.
