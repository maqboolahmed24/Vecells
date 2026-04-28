# 421 Algorithm Alignment Notes

## Inputs

The frontend projection aligns to the 413 feedback-chain contract and the 420 confidence/provenance contract. The state adapter projects:

- `AssistiveFeedbackChain` ref
- `AssistiveArtifactActionRecord` ref
- `OverrideRecord` ref
- `FinalHumanArtifact` ref
- `AssistiveConfidenceDigest` ref
- `AssistiveProvenanceEnvelope` ref

No raw model confidence or raw override note text is required to render the UI.

## Gesture Mapping

The supported dispositions map to the 413 gesture policy:

- `accepted_unchanged`
- `accepted_after_edit`
- `rejected_to_alternative`
- `abstained_by_human`
- `regenerated_superseded`

`accepted_after_edit` remains distinct from `accepted_unchanged` because it carries material diff indicators and mandatory reason capture.

## Reason Capture

Reason capture is deterministic when the scope is material, policy exception, trust recovery, low-confidence acceptance, rejection, or abstention. The UI validates coded reasons before marking the visible reason state complete.

Optional free-text notes are disclosure-fenced. The completed state renders only that a note was captured, not the text itself. Routine telemetry should carry `OverrideRecord` refs and reason codes only.

## Settlement

The UI names the final human artifact as product truth. Assistive acceptance is an action in the feedback chain; it is not workflow settlement. Settlement posture stays attached to `FinalHumanArtifact`.

## 403 Gap

The 403 readiness registry still marks `par_421` as blocked by `GAP403_421_REQUIRES_413`. This implementation is a frontend contract surface over existing 413 refs and should be revisited when the launch packet `403_track_launch_packet_421` exists.
