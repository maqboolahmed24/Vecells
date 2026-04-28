# 122 DSPT Evidence Plan

The evidence catalog lives in [dspt_evidence_catalog.json](../../data/assurance/dspt_evidence_catalog.json). This document summarizes how the evidence set is meant to evolve.

## Evidence Families

| Family | Current state | Key evidence refs |
| --- | --- | --- |
| architecture boundary | seeded in repo | `EVID_122_RUNTIME_BOUNDARY_MANIFEST` |
| secrets and technical security | seeded in repo | `EVID_122_SECRET_CLASS_AND_KMS_BASELINE`, `EVID_122_BUILD_PROVENANCE_AND_SBOM` |
| access control and break glass | partial with deployer placeholders | `EVID_122_ACCESS_SCOPE_AND_BREAK_GLASS_BOUNDARY`, `EVID_122_DEPLOYER_IG_EVIDENCE_REQUEST` |
| runtime publication and release control | seeded in repo | `EVID_122_RUNTIME_PUBLICATION_PARITY_PACK` |
| essential functions and restore mapping | seeded in repo | `EVID_122_ESSENTIAL_FUNCTION_MAP` |
| backup and restore proof | local rehearsal only so far | `EVID_122_BACKUP_MANIFEST_BASELINE`, `EVID_122_RESTORE_REHEARSAL_LOCAL` |
| incident response | plan exists and exercise output is pending | `EVID_122_INCIDENT_RESPONSE_RUNBOOK`, `EVID_122_INCIDENT_TABLETOP_PLAN` |
| supplier dependency governance | seeded around degradations and simulators | `EVID_122_DEPENDENCY_DEGRADATION_PROFILE_SET` |
| clinical safety dependency | blocked on task `121` | `EVID_122_DCB0129_SEED_PACK_DEPENDENCY` |

## Evidence Ownership Rules

- supplier or manufacturer evidence stays with Vecells engineering and assurance owners
- hosting evidence stays separate from supplier architecture evidence
- deployer evidence is explicitly requested and not silently assumed
- shared evidence rows require both sides and remain partial until both exist

## Evidence Transition Rules

1. Keep the evidence ref stable even when the artifact under it moves from mock or placeholder to live proof.
2. Replace placeholder content with executed evidence only when the owner and due trigger are satisfied.
3. Never let live deployer proof overwrite the fact that supplier architecture evidence still has its own owner and review cadence.

## Mock Now Execution

- Point each control row at a real evidence placeholder now.
- Allow placeholder states such as `open_dependency`, `placeholder_seeded`, and `blocked_on_parallel_task` where that is the truthful status.
- Keep simulator evidence visibly non submittable for supplier onboarding claims.

## Actual Production Strategy Later

- add deployer policy packs and incident outputs to the same evidence refs
- add preprod and production restore rehearsal packs next to the current local rehearsal
- replace `EVID_122_DCB0129_SEED_PACK_DEPENDENCY` with the real `par_121` outputs once available

## Evidence Coverage Expectations

Every evidence family in this pack must keep `owner_role`, `review_cycle`, `due_at`, and `reviewed_at` current. If any of those fields are missing then the pack has stopped being operationally useful.
