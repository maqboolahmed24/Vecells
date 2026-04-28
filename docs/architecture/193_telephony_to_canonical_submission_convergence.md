# 193 Telephony To Canonical Submission Convergence

Task `193_par_phase2_track_telephony_build_one_pipeline_convergence_into_canonical_submission_promotion` implements the Phase 2 2G rule that phone capture, secure-link continuation, support-assisted capture, and self-service entry converge through one intake path.

## Canonical Sequence

1. Resolve the true `ingressChannel` and `surfaceChannelProfile` using `phase2-ingress-channel-mapping-193.v1`.
2. Resolve idempotency from command id, source lineage, source hash, semantic hash, and replay key.
3. Return exact or semantic replay without new capture, ingress, request, promotion, or receipt side effects.
4. For idempotency collision, create a separate review envelope, freeze one capture bundle, derive a snapshot, normalize from the frozen input, and block routine promotion.
5. Freeze `FrozenTelephonyCaptureBundle` before any normalization or state advancement.
6. Persist `TelephonyEvidenceSnapshot` from the frozen bundle and readiness posture.
7. Append one immutable `SubmissionIngressRecord` carrying channel provenance, capability ceiling, contact authority, readiness, and receipt/status keys.
8. Build one canonical `NormalizedSubmission` with the existing normalizer; telephony-specific fields only influence the frozen input and provenance.
9. Evaluate duplicate relation classes through the channel-agnostic policy: `retry`, `same_episode_candidate`, `same_episode_confirmed`, `related_episode`, and `new_episode`.
10. Promote exactly once only when evidence is `safety_usable` and duplicate handling does not settle retry or same-request attach.

## Provenance Without Forking

`SubmissionIngressRecord` preserves channel provenance through `ingressChannel`, `surfaceChannelProfile`, and `captureAuthorityClass`. `NormalizedSubmission` preserves canonical meaning and is not forked into phone-specific request semantics.

Support-assisted capture uses `ingressChannel = support_assisted_capture` and `captureAuthorityClass = support_assisted | staff_transcribed`, but it still writes the same ingress, normalized submission, duplicate decision, promotion record, and receipt/status projection families.

## Exact-Once Boundaries

Exact replay returns the prior settled outcome. Semantic replay uses the same source lineage and semantic replay key and likewise returns the prior outcome. Idempotency collisions freeze the conflicting payload into a collision-review branch and do not mutate a previously promoted envelope.

Promotion delegates to the canonical submission backbone. The convergence service passes deterministic receipt and status keys into `SubmissionPromotionRecord`, so cross-channel receipt replay does not create a second submitted event or second receipt.

## Readiness Gating

Telephony readiness remains authoritative. `evidence_pending`, `urgent_live_only`, `manual_review_only`, and `unusable_terminal` all normalize from the frozen input but do not enter routine promotion. `resumePausedIngress` handles a later `safety_usable` assessment by superseding ingress readiness and promoting the already frozen lineage exactly once.

