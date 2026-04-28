# 106 Persistent Shell Framework

Task: `par_106`

## Outcome

Phase 0 now has one reusable `PersistentShell` framework in `packages/persistent-shell` that all major audience shells can consume directly:

- patient
- staff workspace
- operations
- hub coordination
- governance
- pharmacy

The repository also keeps the already-scaffolded `support-workspace` on the same framework so the shipped app surface does not fracture while later route tasks land.

## Shared Runtime Surface

The framework centralizes:

- `ShellFamilyOwnershipContract`
- typed route-residency claims
- `ContinuityTransitionCheckpoint`
- `ShellBoundaryDecision`
- `ContinuityCarryForwardPlan`
- `ContinuityRestorePlan`
- `MissionStackFoldPlan` behavior through shell-local fold state
- shell-level status strip, `CasePulse`, `DecisionDock`, and promoted support-region slots
- browser-authority posture binding through the existing release-controls browser runtime governor

## Shell Inventory

| Shell | Family | Default topology | Primary proof |
| --- | --- | --- | --- |
| `patient-web` | patient | `focus_frame` | five-section calm portal with bounded recovery |
| `clinical-workspace` | staff | `two_plane` | queue continuity plus sticky decision dock |
| `ops-console` | operations | `two_plane` | north-star band plus table-first intervention canvas |
| `hub-desk` | hub | `two_plane` | ranked-option center plane with pinned selection |
| `governance-console` | governance | `three_plane` | analytical diff and guardrail review |
| `pharmacy-console` | pharmacy | `two_plane` | checkpoint board with safety-aware validation rail |
| `support-workspace` | support | `two_plane` | replay-safe extension kept on the same shell substrate |

## Runtime Law

1. Same `shellContinuityKey` plus live browser posture keeps the existing shell and morphs the child surface in place.
2. `read_only` posture preserves the shell, the selected anchor, and the dock state, but suppresses writable calm.
3. `recovery_only` or `blocked` posture keeps the shell and freezes the current context into bounded recovery rather than silently redirecting away.
4. A shell replacement is explicit and happens only when shell-family ownership actually changes.
5. `mission_stack` is a fold of the same shell, with persisted fold state and persisted selected anchor.

## Unresolved But Explicit

- `FOLLOW_ON_DEPENDENCY_PATIENT_HOME_SUMMARY_PROJECTIONS`
- `FOLLOW_ON_DEPENDENCY_PATIENT_SUPPORT_REGION`
- `FOLLOW_ON_DEPENDENCY_PATIENT_REQUEST_CHILD_ROUTES`
- `FOLLOW_ON_DEPENDENCY_PATIENT_APPOINTMENT_ROUTES`
- `FOLLOW_ON_DEPENDENCY_PATIENT_ARTIFACT_ROUTES`
- `FOLLOW_ON_DEPENDENCY_PATIENT_MESSAGING_ROUTES`
- `FOLLOW_ON_DEPENDENCY_PATIENT_SEED_ROUTES_TASK_115`
- `FOLLOW_ON_DEPENDENCY_STAFF_SUPPORT_REGION`
- `GAP_RESOLUTION_HUB_SHELL_LAYOUT_DERIVED_FROM_PHASE_5_AND_GENERAL_SHELL_LAW`

## Traceability

- `blueprint/platform-frontend-blueprint.md#ContinuityTransitionCheckpoint`
- `blueprint/platform-frontend-blueprint.md#ShellBoundaryDecision`
- `blueprint/platform-frontend-blueprint.md#ContinuityCarryForwardPlan`
- `blueprint/platform-frontend-blueprint.md#1.1 PersistentShell`
- `blueprint/platform-frontend-blueprint.md#1.1I ContinuityRestorePlan`
- `blueprint/platform-frontend-blueprint.md#1.1J MissionStackFoldPlan`
- `blueprint/platform-frontend-blueprint.md#ShellFamilyOwnershipContract`
- `blueprint/design-token-foundation.md`
- `blueprint/canonical-ui-contract-kernel.md`
- `blueprint/ux-quiet-clarity-redesign.md`
- `blueprint/forensic-audit-findings.md#Finding 86`
- `blueprint/forensic-audit-findings.md#Finding 92`
- `blueprint/forensic-audit-findings.md#Finding 95`
- `blueprint/forensic-audit-findings.md#Finding 96`
- `blueprint/forensic-audit-findings.md#Finding 120`
