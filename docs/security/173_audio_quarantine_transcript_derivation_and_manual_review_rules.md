# Audio Quarantine, Transcript Derivation, And Manual Review Rules

Sequence: `seq_173_phase2_freeze_telephony_call_session_and_evidence_readiness_contracts`

## Security Posture

Telephony evidence contains protected health information, raw identity fragments, weak handset signals, and potential malware-bearing audio artifacts. The safe default is ref-only, append-only, masked, and reviewable.

Rules:

- raw provider payloads stop at the normalization boundary;
- raw recordings are stored only in quarantine or governed object storage;
- DOM, URLs, logs, metrics labels, screenshots, and board rows may contain only opaque refs, masked placeholders, reason codes, and state names;
- transcript text is a derived artifact, not source truth;
- manual review is a first-class contract, not an operator convention;
- routine promotion is blocked until a new immutable readiness assessment says it is safe.

## Evidence Handling

Audio capture must follow the same object-reference discipline as uploaded documents:

1. fetch or receive the recording;
2. write to quarantine;
3. scan and validate storage integrity;
4. create an object or `DocumentReference` pointer;
5. enqueue transcript and fact extraction by ref;
6. append `TelephonyTranscriptReadinessRecord`;
7. settle `TelephonyEvidenceReadinessAssessment`.

Automatic discard is forbidden. Unsafe, missing, contradictory, or unreadable audio becomes `TelephonyManualReviewDisposition`, `manual_review_only`, or `unusable_terminal` as defined in [173_readiness_truth_table.csv](/Users/test/Code/V/data/analysis/173_readiness_truth_table.csv).

## Transcript Derivation

Transcript output must be bound to an immutable derivation package. A `ready` transcript is insufficient by itself. The record must also show:

- `coverageClass`;
- `qualityBand`;
- `sufficiencyState`;
- blocking reason codes when coverage is not clinically sufficient;
- exact call-session and recording artifact refs.

Transcript reruns and manual corrections append new records. They do not mutate prior transcript readiness or promoted evidence snapshots.

## Manual Review Disposition

`TelephonyManualReviewDisposition` is mandatory for:

- `recording_missing`;
- `transcript_degraded`;
- `contradictory_capture`;
- `identity_ambiguous`;
- `handset_untrusted`;
- `urgent_live_without_routine_evidence`.

While a manual disposition is open, routine promotion remains blocked. A settled review may open a new evidence cut only by appending a new readiness assessment. Operators may not locally flip a call back into routine flow.

## Continuation Safety

`TelephonyContinuationEligibility.grantFamilyRecommendation = manual_only` creates no redeemable grant. It must settle `grantIssuance = no_redeemable_grant` and, when a continuation context exists, `contextState = no_grant_manual_only`.

Seeded or challenge continuation is legal only through canonical `AccessGrantService` after:

- evidence readiness is settled;
- identity confidence ref is present;
- destination confidence ref is present;
- lineage scope is bounded;
- any authority-settled binding fence is current.

Caller ID is a weak narrowing signal. It is never sufficient on its own for identity, destination safety, or seeded continuation.

## Masking And Observability

Operational rows may show:

- call-session id suffix or masked ref;
- state;
- readiness verdict;
- reason-code family;
- event family;
- object-store or derivation package ref;
- manual review posture.

Operational rows must not show:

- raw phone numbers;
- raw caller identifiers;
- raw auth or telephony claims;
- transcript excerpts;
- raw provider JSON;
- unmasked object URLs;
- inferred patient demographics.

Logs and metrics must use stable low-cardinality reason codes and ref classes. They may not use phone numbers, patient identifiers, caller identifiers, transcript terms, vendor payload fields, or grant tokens as labels.

## Recovery And Audit

Every recovery from `urgent_live_only`, `manual_review_only`, `recording_missing`, `transcript_degraded`, or `provider_error` requires a new immutable event or readiness record. Replay and audit must be able to reconstruct the same call posture from canonical events plus immutable readiness records without consulting raw provider payloads.

The same evidence cut may enter canonical intake only after `TelephonyEvidenceReadinessAssessment(usabilityState = safety_usable, promotionReadiness = ready_to_promote)`. Until then, `TelephonyContinuationEligibility` and `TelephonyManualReviewDisposition` may route bounded continuation or review work, but `manual_only` remains no redeemable grant.
