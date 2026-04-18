# 254 Admin Settlement And Re-entry Controls

## Security posture

`254` makes bounded admin settlement fail closed.

Local acknowledgement is not authority.
Queue state is not authority.
Worker optimism is not authority.
Only the canonical `AdminResolutionSettlement` chain can advance patient or staff consequence posture.

## Required controls

### Stale tuple control

The kernel evaluates:

- presented boundary tuple hash
- presented decision epoch
- presented dependency set
- presented completion artifact
- presented lineage fence

against the live tuple and the current case tuple.

When drift is detected, the mutation settles `stale_recoverable`.
It does not silently upgrade the old command to the newest case state.

### Completion control

`completed` is blocked unless all completion guards pass:

- current tuple remains bounded admin only
- current dependency posture still permits the consequence
- `AdminResolutionCompletionArtifact` exists
- patient expectation template binding exists
- no current decision supersession record is active

This closes the gap where an internal action success could be misread as patient-facing completion.

### Waiting and notification control

`patient_notified` and `waiting_dependency` remain semantically distinct from `completed`.

That means:

- waiting never unlocks calm completion
- notification never implies administrative closure
- any reopen or blocker can still dominate the current outcome

### Re-entry control

When bounded admin work becomes unsafe or illegal, the system must create or reuse a governed artifact through canonical backend seams.

Allowed destinations are constrained and typed.
The system does not solve re-entry with a route redirect alone.

### Projection control

`AdminResolutionExperienceProjection` consumes the settlement chain.
It never infers completion from local transport acknowledgement or a front-end badge.

When re-entry or safety blocking happens:

- admin mutation authority becomes frozen
- dominant next action changes to the governed recovery route
- trust and continuity posture degrade visibly

## Audit trail

The authoritative audit trail is append-only:

- `AdminResolutionActionRecord` preserves mutation intent and lease context
- `AdminResolutionSettlement` preserves authoritative outcome
- `AdminResolutionCrossDomainReentry` preserves the causal lineage for review relaunch or repair routing

Chronology remains readable even when a stale attempt is followed by a valid retry.
