# Phone Follow-Up Duplicate And Re-Safety Design

Task `194_par_phase2_track_telephony_build_duplicate_attachment_and_resafety_trigger_handling_for_phone_followups` adds a governed late-evidence path for post-submit phone calls, SMS continuation supplements, support-transcribed details, and duplicate attachments.

## Core Path

`PhoneFollowupResafetyService.ingestFollowupEvidence` is the single ingress seam. The command is frozen into `FrozenFollowupEvidenceBatch` before duplicate evaluation, classification, materiality, assimilation, or safety logic runs. The frozen batch stores only refs, hashes, and redacted provenance.

The service then creates `FollowupDuplicateDigest` using exact and semantic digests across audio refs, transcript refs plus normalized narrative, form supplement refs plus structured facts, attachment refs, contact-route evidence refs, and support transcription refs. Exact idempotency replay and semantic replay return the previously settled assimilation chain and do not create another preemption, projection hold, or receipt.

## Duplicate And Attach Policy

Same-request attachment requires an accepted `FollowupContinuityWitness`. The accepted witness classes are:

- `active_continuation_lineage`
- `telephony_lineage_authority`
- `operator_confirmed_case_id`
- `same_request_convergence_outcome`
- `human_review_override`

The witness must include a ref, match request and episode, match request lineage when supplied, keep route and subject fences current, and carry the class-specific authority ref. Score-only attach is rejected even when the duplicate score is high.

`same_episode_candidate` without a valid witness becomes review-required, not same-request attach. `same_episode_link` may link an episode without attaching to the request only when continuity is accepted and policy says the late evidence is episode-related but not request-identical. Missing or drifted continuity either holds for review or creates a separate-request posture.

## Canonical Assimilation

Every accepted command settles the Phase 0 record chain through `CanonicalEvidenceAssimilationCoordinator`:

- `EvidenceClassificationDecision`
- `MaterialDeltaAssessment`
- `EvidenceAssimilationRecord`
- `SafetyPreemptionRecord` when material delta requires re-safety or blocks manual review

The service classifies contact route changes, preference changes, and delivery failures that threaten reachability as `contact_safety_relevant`. Clinically meaningful late detail, chronology drift, contradictions, urgent red flags, or routine-bypass signals classify as `potentially_clinical`. Technical-only duplicate metadata and ordinary attachment duplicates do not trigger re-safety.

Degraded or contradictory late transcripts fail closed with `PHONE_FOLLOWUP_194_DEGRADED_TRANSCRIPT_FAIL_CLOSED`; they become unresolved materiality and block manual review rather than disappearing into operational metadata.

## Projection Freeze

`PhoneFollowupProjectionHold` serializes patient and staff truth while late evidence is pending:

- `review_pending`
- `detail_received_being_checked`
- `urgent_review_opened`
- `blocked_by_degraded_followup_evidence`
- `separate_request_created_continuity_not_proven`
- `detail_added_no_resafety`

Routine calm projection is allowed only for `detail_added_no_resafety`. All review, re-safety, degradation, urgent, and continuity-split states suppress stale routine reassurance.
