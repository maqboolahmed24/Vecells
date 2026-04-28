# 356 Pharmacy Shell And Mission Frame

## Intent

Task `par_356` establishes one recognisable Phase 6 pharmacy shell family across the patient and workspace route families.

The implementation intentionally separates:

- patient pharmacy routes under `/pharmacy/:pharmacyCaseId/...`
- staff pharmacy routes under `/workspace/pharmacy...`

while keeping them visually related through the same `Pharmacy_Mission_Frame` token profile, continuity language, and one-dominant-action discipline.

## Shell Law

The shell obeys the local pharmacy-console laws:

1. same case, same shell
2. one medication decision at a time
3. no silent progression past a safety checkpoint
4. no inventory assumption without explicit freshness
5. no irreversible action without consequence preview
6. no blocker may be visually weaker than the action it blocks

The practical rendering law is:

`one case, one checkpoint, one dominant action, one promoted support region`

## Route Family

### Patient shell

`PharmacyPatientShell` owns:

- `/pharmacy/:pharmacyCaseId/choose`
- `/pharmacy/:pharmacyCaseId/instructions`
- `/pharmacy/:pharmacyCaseId/status`

The patient shell keeps:

- one chosen-provider anchor
- one request-lineage anchor
- one checkpoint rail
- one promoted support region
- one sticky `DecisionDock` host
- one recovery strip when calmness is not lawful

### Workspace shell

`PharmacyWorkspaceShell` and `PharmacyShellFrame` own:

- `/workspace/pharmacy`
- `/workspace/pharmacy/:pharmacyCaseId`
- `/workspace/pharmacy/:pharmacyCaseId/validate`
- `/workspace/pharmacy/:pharmacyCaseId/inventory`
- `/workspace/pharmacy/:pharmacyCaseId/resolve`
- `/workspace/pharmacy/:pharmacyCaseId/handoff`
- `/workspace/pharmacy/:pharmacyCaseId/assurance`

The workspace shell keeps:

- one queue spine
- one validation board
- one checkpoint rail
- one promoted support region
- one chosen-provider anchor
- one sticky `DecisionDock`
- one recovery strip when the current truth is stale, blocked, or reopened

## Host Regions

### Patient

- `PatientRequestLineageAnchor`
- `PharmacyChosenProviderAnchor`
- `PharmacyCheckpointRail`
- `PharmacySupportRegionHost`
- `PharmacyDecisionDockHost`
- `PharmacyRouteRecoveryFrame`

### Workspace

- `PharmacyQueueSpineHost`
- `PharmacyValidationBoardHost`
- `PharmacyCheckpointRail`
- `PharmacySupportRegionHost`
- `PharmacyCasePulseHost`
- `PharmacyDecisionDockHost`
- `PharmacyChosenProviderAnchor`
- `PharmacyRouteRecoveryFrame`

## Continuity Rules

- Queue row to case open remains same-shell and preserves the current case anchor.
- Child-route entry preserves active case, checkpoint, and line item.
- Refresh preserves shell posture when the route itself still identifies the same pharmacy case and child state.
- Browser back and forward reuse the same route family rather than bouncing through generic detail pages.
- `mission_stack` is a fold of the same shell, not a separate mobile workflow.

## Layout

### Workspace wide

- queue spine: `22rem` to `24rem`
- validation board: `minmax(48rem, 1fr)`
- support or decision rail: `22rem` to `28rem`
- shell gap: `16px` to `18px`

### Patient wide

- main column: `minmax(680px, 760px)`
- right anchor rail: up to `320px`

### Folded

Below `960px`, both shells switch to `mission_stack`:

- one-column reading order
- same route family
- same selected anchor
- same dominant action locus
- no detached mobile IA

## Posture

The shell never hides degraded truth behind neutral chrome.

- `live`: calm route chrome and writable or guided action posture
- `read_only`: current anchors remain visible, action wording becomes guarded
- `recovery_only`: the recovery strip promotes above the main regions
- `blocked`: the dominant action remains visible but cannot read as safe to execute

## Automation And Proof Markers

The shell publishes durable DOM markers for Playwright:

- root shell identity and visual mode
- layout topology and breakpoint class
- selected case anchor
- active checkpoint summary
- promoted support region
- dominant action state
- recovery posture
- route family

## Non-goals

This task does not own:

- provider-choice detail content
- dispatch-specific patient detail
- full patient instructions copy
- assurance evidence detail
- bounce-back recovery detail
- operations workbench data logic

Those later tasks mount into the 356 host regions without replacing the shell family.
