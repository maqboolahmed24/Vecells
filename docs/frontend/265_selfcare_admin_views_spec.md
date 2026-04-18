# 265 Self-Care Admin Views Spec

## Task

- taskId: `par_265_phase3_track_Playwright_or_other_appropriate_tooling_frontend_build_self_care_advice_issue_and_admin_resolution_views`
- visual mode: `Bounded_Consequence_Studio`

## Core outcome

This slice adds a same-shell consequence studio for self-care issue and bounded admin-resolution work. The route keeps the legal and operational boundary explicit by showing:

- which `SelfCareBoundaryDecision` currently governs the case
- whether `AdviceRenderSettlement` still allows informational self-care issue
- whether `AdviceAdminDependencySet` blocks, clears, or reopens bounded admin work
- whether `AdminResolutionSettlement` is still waiting, completed, reopened, or stale-recoverable
- what the patient-facing expectation summary currently says on the same tuple

## Production components

- `SelfCareIssueStage`
- `SelfCarePreviewSummary`
- `AdminResolutionStage`
- `AdminDependencyPanel`
- `PatientExpectationPreview`
- `BoundaryDriftRecovery`

## Authoritative contracts consumed

- `SelfCareBoundaryDecision`
- `AdviceRenderSettlement`
- `AdviceAdminDependencySet`
- `AdminResolutionSettlement`
- `PatientExpectationTemplate`
- `WorkspaceFocusProtectionLease`
- `ProtectedCompositionState`
- `TaskWorkspaceProjection`

## Route coverage

- `/workspace/consequences`
- `/workspace/task/:taskId`

## Interaction laws

1. The top-level mode comes from `SelfCareBoundaryDecision`, never from copy phrasing or a channel label.
2. Informational self-care and bounded admin-resolution stay visually related, but they are never collapsed into one consequence path.
3. Dependency blockers stay dominant and visible. Waiting or blocked admin work may not hide inside metadata.
4. Boundary drift, dependency drift, or reopen posture preserve the last safe draft or subtype choice while freezing fresh mutation in place.
5. Patient expectation preview remains tuple-aligned with the staff-side consequence state.
6. Completion stays in-shell. There is no detached success receipt.

## Visual posture

`Bounded_Consequence_Studio` uses:

- a dense worklist for self-care and bounded admin consequence selection
- a boundary digest above the fold with tuple, decision epoch, and dominant meaning
- a calm self-care panel with bundle version, watch window, and patient-safe wording preview
- a bounded admin plane with subtype, waiting shape, completion artifact, and blocker visibility
- a side lane for dependency truth and patient expectation summary

Self-care stays calmer and more editorial. Admin stays crisp and bounded. Reopen and stale recovery stay visibly stricter than both.

## DOM contract

- `data-boundary-mode`
- `data-boundary-tuple`
- `data-admin-dependency-state`
- `data-advice-settlement`
- `data-admin-settlement`

## Responsive posture

- desktop: worklist plus primary consequence plane plus side lane
- tablet: primary plane stays first while dependency and expectation stack beneath
- mobile: one readable flow with the boundary digest, dominant stage, blockers, and expectation preview preserved in order

## Proof expectations

- Playwright proves same-shell self-care and admin selection on `/workspace/consequences`
- boundary drift and reopen posture freeze action while preserving visible context
- dependency blockers remain dominant and visible in the admin lane
- patient expectation preview remains tuple-aligned with the active consequence
- reload and browser history preserve the selected consequence row and last safe anchor when recoverable
