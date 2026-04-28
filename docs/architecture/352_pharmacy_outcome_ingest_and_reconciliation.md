# 352 Pharmacy Outcome Ingest And Reconciliation

Task `par_352_phase6_track_backend_build_pharmacy_outcome_ingest_update_record_observation_and_reconciliation_pipeline` lands the authoritative backend path for pharmacy outcome evidence. The implementation lives in `packages/domains/pharmacy/src/phase6-pharmacy-outcome-reconciliation-engine.ts` and is the only place in Phase 6 that may decide whether inbound outcome evidence resolves, reopens, queues for review, or is ignored as replay.

## Objects owned here

- `OutcomeEvidenceEnvelope`
- `PharmacyOutcomeSourceProvenance`
- `NormalizedPharmacyOutcomeEvidence`
- `PharmacyOutcomeMatchScorecard`
- `PharmacyOutcomeIngestAttempt`
- `PharmacyOutcomeReconciliationGate`
- `PharmacyOutcomeSettlement`
- `PharmacyOutcomeTruthProjection`
- `PharmacyOutcomeAuditEvent`

## Inbound families

The parser registry preserves four first-class source families:

- `gp_workflow_observation`
- `direct_structured_message`
- `email_ingest`
- `manual_structured_capture`

They are not collapsed into one generic source enum because trust floor, replay handling, and auto-apply eligibility differ by family.

## Canonical flow

1. Parse inbound evidence into source-aware normalized fields and immutable provenance.
2. Mint one append-only `OutcomeEvidenceEnvelope` with `sourceMessageKey`, `rawPayloadHash`, `semanticPayloadHash`, `replayKey`, `trustClass`, `correlationRefs`, and `decisionClass`.
3. Run replay classification before any case mutation.
4. Match by trusted correlation first, then by the frozen posterior scorecard.
5. Assimilate evidence through the Phase 0 intake-safety backbone before progression.
6. Settle exactly one of:
   - `duplicate_ignored`
   - `resolved_pending_projection`
   - `reopened_for_safety`
   - `review_required`
   - `unmatched`
7. Publish `PharmacyOutcomeTruthProjection` for patient-safe, staff-safe, and console-safe downstream use.

## Replay law

Replay posture is decided before case mutation:

- `exact_replay` when `replayKey` and semantic payload line up with an existing accepted envelope
- `semantic_replay` when the same outcome meaning arrives again, including same-source-key chronology drift such as redelivery with a slightly different receive timestamp
- `collision_review` when the source key is reused for meaningfully different outcome semantics
- `distinct` otherwise

Duplicate replay returns `duplicate_ignored` and preserves the prior accepted truth chain. It does not reopen, resolve, or mutate the case a second time.

## Matching law

The matcher implements the frozen 352 order:

1. trusted `PharmacyCorrelationRecord` chain match
2. patient and service hard floors
3. route floor where outbound dispatch proof exists
4. weighted posterior scoring using patient, provider, service, time, transport, and contradiction terms

The scorecard is persisted so later queue, console, and audit work reads the authoritative match tuple instead of recomputing it.

## Safety bridge

All distinct evidence is assimilated through Phase 0 `EvidenceAssimilationRecord` and `MaterialDeltaAssessment`.

Routine completion outcomes such as `advice_only`, `medicine_supplied`, and `resolved_no_supply` are mapped to `operational_nonclinical` materiality so they do not reopen safety by default.

Urgent or escalation outcomes such as `urgent_gp_action`, `onward_referral`, `pharmacy_unable_to_complete`, and contact failures continue to drive explicit reopen posture. They do not get silently downgraded into calm completion.

## Settlement branches

- Strong, trusted, non-contradictory routine outcomes settle directly to `resolved_pending_projection`.
- Strong, trusted, safety-signalling outcomes settle directly to `reopened_for_safety`.
- Weak, low-assurance, collision, or explicitly blocked outcomes open `PharmacyOutcomeReconciliationGate` and settle to `review_required`.
- Manual operator resolution reuses the same gate and settlement families; it does not mint a second ingest pathway.
- Unmatched outcomes settle to `unmatched` and do not mutate the case.

## Truth projection law

`PharmacyOutcomeTruthProjection` is now the only backend source for downstream outcome posture. Later patient, operations, and pharmacy-console work must consume:

- `outcomeTruthState`
- `resolutionClass`
- `matchConfidenceBand`
- `manualReviewState`
- `closeEligibilityState`
- `patientVisibilityState`
- `continuityEvidenceRef`

No later surface may infer “resolved” from raw inbound messages, dispatch proofs, or silence.

## Case-kernel integration

Accepted outcome settlement now clears the stale dispatch confirmation gate from `PharmacyCase`. That avoids carrying a historical dispatch gate forward into closure posture once 352 has become the governing outcome authority.
