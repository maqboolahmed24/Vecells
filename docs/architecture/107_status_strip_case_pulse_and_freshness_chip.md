# par_107 Status Strip, CasePulse, and FreshnessChip

## Intent

Task `par_107` publishes one reusable shell-truth layer for Vecells:

- `SharedStatusStrip` is the only shell-level sentence for save, sync, freshness, pending external work, review, and recovery.
- `AmbientStateRibbon` plus `FreshnessChip` stay visually fused on routine surfaces and promote to banner mode only for blocked or recovery-only truth.
- `CasePulse` is the stable identity band for the active object and stays visible while the shell morphs inside the same continuity key.

This implementation is deliberately separate from route-local timeline, booking, or pharmacy outcome work. Those later tasks must bind to the same primitives rather than fork status semantics.

## Shell Truth Law

1. `StatusStripAuthority` is the only shell-level owner for save, sync, freshness, pending, and recovery cues.
2. `ProjectionFreshnessEnvelope` is the only freshness authority for shell calmness and actionability.
3. `CasePulse`, the shared strip, and any current `DecisionDock` must consume the same macrostate, bundle version, and trust envelope.
4. Local acknowledgement, processing acceptance, pending external work, stale review, blocked truth, and authoritative settlement stay linguistically distinct.
5. Patient wording may calm the tone, but it may not overclaim what the authoritative settlement or freshness envelope has not yet proven.

## Implemented Families

- `CasePulse`
- `CasePulseMetaRow`
- `SharedStatusStrip`
- `AmbientStateRibbon`
- `FreshnessChip`
- `FreshnessActionabilityBadge`
- `StatusStripAuthorityInspector`
- audience wrappers for patient, workspace, hub, operations, governance, and pharmacy
- `StatusSentenceComposer` via `composeStatusSentence()`

## Gap Resolutions

- `GAP_RESOLUTION_STATUS_GRAMMAR_LOCAL_ACK_V1`
  The corpus required local acknowledgement to remain distinct from authoritative settlement but did not freeze one sentence pattern. The implementation standardizes on "captured locally" or "accepted for processing" language that never implies final success.
- `GAP_RESOLUTION_STATUS_GRAMMAR_PENDING_EXTERNAL_V1`
  The corpus required pending external confirmation to stay distinct from fresh writable truth. The implementation standardizes on quiet-pending copy that keeps the same shell calm while suppressing completion language.
- `GAP_RESOLUTION_STATUS_GRAMMAR_READ_ONLY_SUPPRESSION_V1`
  The corpus required read-only or recovery-only posture to preempt ordinary calm success language. The implementation always announces review, guard, or recovery before any settled wording can appear.

## Follow-on Dependencies

- `FOLLOW_ON_DEPENDENCY_STATUS_TRUTH_LOCAL_REGION_CUES_V1`
  Later route tasks may add localized region-level stale or blocker cues, but those cues must stay visibly subordinate to the shared strip and may not invent shell truth.

## Deliverables

- Analysis matrices:
  - [`status_strip_state_matrix.csv`](/Users/test/Code/V/data/analysis/status_strip_state_matrix.csv)
  - [`case_pulse_axis_matrix.csv`](/Users/test/Code/V/data/analysis/case_pulse_axis_matrix.csv)
  - [`freshness_envelope_examples.json`](/Users/test/Code/V/data/analysis/freshness_envelope_examples.json)
  - [`status_sentence_grammar_matrix.csv`](/Users/test/Code/V/data/analysis/status_sentence_grammar_matrix.csv)
- Lab:
  - [`107_status_component_lab.html`](/Users/test/Code/V/docs/architecture/107_status_component_lab.html)
- Package surface:
  - [`status-truth.tsx`](/Users/test/Code/V/packages/design-system/src/status-truth.tsx)

## Source Refs

- `blueprint/platform-frontend-blueprint.md#1.1F StatusStripAuthority`
- `blueprint/platform-frontend-blueprint.md#1.2 CasePulse`
- `blueprint/platform-frontend-blueprint.md#1.6 AmbientStateRibbon`
- `blueprint/platform-frontend-blueprint.md#1.7 FreshnessChip`
- `blueprint/platform-frontend-blueprint.md#1.7A ProjectionFreshnessEnvelope`
- `blueprint/ux-quiet-clarity-redesign.md#StatusStripAuthority`
- `blueprint/patient-account-and-communications-blueprint.md#Purpose`
- `blueprint/patient-portal-experience-architecture-blueprint.md#1A. Calm route posture and artifact delivery`
- `blueprint/staff-workspace-interface-architecture.md#3. Active task shell`
- `blueprint/pharmacy-console-frontend-architecture.md#Phase 0 shell law`
