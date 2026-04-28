# Follow-Up Evidence Assimilation And Duplicate Controls API

## POST `/internal/telephony/followups/evidence`

Contract family: `FollowupEvidenceIngressCommandContract`

The body follows `data/contracts/194_followup_evidence_ingress_command.schema.json`. The command must identify the existing request and episode, source lineage, follow-up channel, evidence kind, evidence refs, source timestamp, duplicate probe, optional continuity witness, and material signals.

The endpoint is idempotent. A byte-equivalent retry returns the settled outcome with `replayClassification=exact_replay`. A new command with the same request lineage and semantic digest returns `semantic_replay`. Neither replay creates a second `SafetyPreemptionRecord`, projection hold, or receipt.

## Duplicate Decision Semantics

The API returns `FollowupDuplicateEvaluation`:

- `same_request_attach` means continuity witness passed and no divergence or score-only blocker exists.
- `review_required` means same-episode or same-request attach was not proven safely.
- `same_episode_link` means the evidence may be linked at episode level without request attachment.
- `separate_request` means canonical policy does not prove continuity.
- `exact_retry_collapse` means deterministic retry handling.

`scoreOnlyAttachRejected=true` is a hard fail-closed signal. Clients must not turn a score-only duplicate into same-request attachment.

## Assimilation Chain

The response includes refs and snapshots for:

- `EvidenceClassificationDecision`
- `MaterialDeltaAssessment`
- `EvidenceAssimilationRecord`
- `SafetyPreemptionRecord` when opened
- `SafetyDecisionRecord` when re-safety settles
- `UrgentDiversionSettlement` when urgent review is opened

`createdReceipt` is always false for this API. Late evidence never issues a second canonical receipt.

## Projection Hold

`PhoneFollowupProjectionHoldContract` governs patient and staff rendering. Patient UIs must use `patientVisibleState` and `patientVisibleCalmStatusAllowed`; staff UIs must use `staffActionability`. When `patientVisibleCalmStatusAllowed=false`, existing routine or closed reassurance must be frozen or downgraded until the latest canonical chain settles.
