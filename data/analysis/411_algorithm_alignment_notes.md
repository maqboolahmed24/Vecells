# 411 Algorithm Alignment Notes

## Local Sources Applied

- `blueprint/phase-8-the-assistive-layer.md`: applied the Phase 8A object definitions for `AssistiveSurfaceBinding`, `AssistivePresentationContract`, `AssistiveProvenanceEnvelope`, `AssistiveConfidenceDigest`, `AssistiveFreezeFrame`, and `AssistiveCapabilityTrustEnvelope`.
- `blueprint/phase-8-the-assistive-layer.md`: applied the surface priority that visible assistive workflow is staff-only, same-shell, summary-first, provenance-bound, and confidence-conservative.
- `blueprint/phase-8-the-assistive-layer.md`: applied the route and trust priority that a successful model return is not sufficient for live rendering.
- `blueprint/phase-8-the-assistive-layer.md` 8G: applied the monitoring and rollout rule that missing trust projection, rollout verdict, watch tuple, or freeze record fails closed.
- `blueprint/staff-workspace-interface-architecture.md`: applied the workspace trust envelope and selected-anchor continuity model.
- `blueprint/phase-3-the-human-checkpoint.md`: applied same-shell recovery and no optimistic workflow mutation.
- `data/contracts/410_capability_control_plane_contract.json`: consumed invocation grants, run settlements, kill-switch state, release posture, and the separation of renderable settlement from visible UI authority.

## Implementation Mapping

- `AssistiveSurfaceBindingResolver` creates one binding per artifact and requires staff route, staff shell, active workspace consistency refs, workspace trust refs, selected anchor, surface publication, runtime bundle, and recovery disposition.
- `AssistivePresentationContractResolver` keeps presentation `summary_stub` first, enforces `companion_only`, suppresses raw confidence scores, and limits dominant action to one safe action.
- `AssistiveProvenanceEnvelopeService` binds snapshot hashes, derivation packages, model and prompt versions, output schema, policy bundle, evidence map, masking, disclosure, publication, and runtime refs.
- `AssistiveConfidenceDigestService` makes `displayBand` the primary token and emits `confidence_suppressed_by_trust_posture` or related suppression reasons when calibration, trust, publication, runtime, continuity, uncertainty, or harm posture is not strong enough.
- `AssistiveFreezeFrameService` materializes in-place freeze records with retained anchors and provenance while suppressing accept, insert, regenerate, export, browser handoff, and completion affordances.
- `AssistiveSurfacePostureResolver` explicitly separates `surfacePostureState`, `actionabilityState`, `confidencePostureState`, and `completionAdjacencyState`.
- `AssistiveTrustEnvelopeProjector` publishes one `AssistiveCapabilityTrustEnvelope` and marks `browserClientActionabilityRecomputeForbidden = true`.

## Fail-Closed Posture

The runtime emits exact blocking reasons:

- `missing_watch_tuple_fail_closed`
- `missing_trust_projection_fail_closed`
- `missing_rollout_verdict_fail_closed`
- `missing_freeze_record_fail_closed`
- `publication_drift_freeze_frame_required`
- `runtime_publication_drift_freeze_frame_required`
- `selected_anchor_drift_freeze_frame_required`
- `confidence_suppressed_by_trust_posture`
- `same_shell_recovery_required`

Those reasons force observe-only, provenance-only, placeholder-only, hidden, regenerate-only, blocked-by-policy, or blocked posture.

## Interface Gap Handling

The static 403 launch registry still marks `par_411` blocked because it predates the validated 404-410 outputs. The task therefore publishes `data/analysis/PHASE8_BATCH_404_411_INTERFACE_GAP_TRUST_ENVELOPE_PROJECTION.json` and uses validated 405, 407, 408, 409, and 410 contract files as fallback inputs.
