# 235 Review Summary Parity And Shadow Model Boundaries

## Summary parity boundary

Authoritative review summary copy is legal only when the current bundle is pinned to one current:

- `EvidenceSnapshot`
- `EvidenceCaptureBundle`
- `EvidenceSummaryParityRecord`
- `reviewVersion`

If parity is `stale`, `blocked`, or `superseded`, or if required provenance is missing, regenerated summary text may not be shown as authoritative evidence.

The command-api seam therefore emits:

- `summaryText` only for authoritative parity
- `provisionalText` for bounded fallback copy
- explicit `suppressionReasonCodes`

This closes the gap where stale parity could still look authoritative.

## Decision and duplicate supersession boundary

`EvidenceDeltaPacket` preserves stale judgment context instead of discarding it. The packet must keep prior:

- endpoint assumptions
- approval posture
- ownership state
- duplicate-lineage assumptions
- `DecisionEpoch` preview posture

visible through `supersededJudgmentContext[]` until recommit.

This closes the gap where superseded judgment context disappears after new evidence arrives.

## Suggestion seam boundary

`SuggestionEnvelope` exists in Phase 3 only as advisory review preparation.

Hard rules:

- `sourceType = rules` may surface to staff
- `sourceType = shadow_model` must remain dark as `silent_shadow`
- no `SuggestionEnvelope` may become mutation authority
- no suggestion may settle endpoint, approval, callback, or admin consequence directly
- visibility drift must degrade to `observe_only` or `blocked`, not remain live

Rules suggestions are visible only while the bundle remains `ready`.
When duplicate reversal, parity drift, or `DecisionEpoch` supersession occurs, suggestion output is invalidated in place and remains non-authoritative.

## Redaction and bounded artifact handling

Transcript absence, late transcript arrival, large attachments, and preview failures stay bounded:

- transcript absence becomes a typed placeholder state, not a false empty clean state
- large attachments may drop to `preview_unavailable` while preserving source artifact refs
- missing previews do not erase the attachment row or its provenance

The review path therefore remains deterministic, provenance-first, and same-shell recoverable.
