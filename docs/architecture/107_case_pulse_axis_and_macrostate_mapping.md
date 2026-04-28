# par_107 CasePulse Axis and Macrostate Mapping

## Core Mapping

`CasePulse` stays stable across same-shell morphs and exposes one top-level macrostate plus five quiet secondary axes.

| Macrostate | Default next-action posture | Patient tone | Professional tone |
| --- | --- | --- | --- |
| `received` | orient and reassure | calm acknowledgement | intake received |
| `in_review` | review-first | being reviewed | in review |
| `reviewing_next_steps` | one bounded next step | reviewing next steps | reviewing next steps |
| `awaiting_external` | quiet pending | waiting for confirmation | awaiting authoritative confirmation |
| `action_required` | one dominant action | action needed | action required |
| `settled` | summary-first | confirmed and safe to view | authoritative settlement recorded |
| `blocked` | recovery or escalation | action paused | blocked truth |
| `recovery_required` | recovery path only | recovery needed | recovery required |

## Required Axes

- `lifecycle`
- `ownership`
- `trust`
- `urgency`
- `interaction`

## Audience Bias

- Patient: quieter surface, one trust cue maximum, summary-first wording.
- Workspace and hub: tighter density, owner summary and current task cue remain prominent.
- Operations and governance: exact object context remains visible, but shell truth never becomes a second dashboard banner.
- Pharmacy: checkpoint and safety recovery posture stay explicit without turning the pulse into a warning stack.

## Assumptions

- `ASSUMPTION_CASE_PULSE_HUB_AXIS_V1`
  Hub `CasePulse` uses the same five axes as other shells, with origin-practice and option-window detail folded into ownership and urgency rather than inventing a sixth shell-level axis.
- `ASSUMPTION_CASE_PULSE_OPERATIONS_OBJECT_V1`
  Operations surfaces reuse `CasePulse` as an active focus object band, even when the object is a board slice rather than a traditional case.

## Source Refs

- `blueprint/platform-frontend-blueprint.md#1.2 CasePulse`
- `blueprint/staff-workspace-interface-architecture.md#3. Active task shell`
- `blueprint/phase-5-the-network-horizon.md#Hub shell`
- `blueprint/pharmacy-console-frontend-architecture.md#Checkpoint shell`
- `blueprint/governance-admin-console-frontend-blueprint.md#Core shell responsibilities`
