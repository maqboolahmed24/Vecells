# 151 Urgent Diversion And Receipt Grammar Design

`par_151` closes the outcome-path gap left after synchronous safety. `SafetyDecisionRecord(requestedSafetyState = urgent_diversion_required)` is no longer treated as equivalent to patient advice issuance. The authoritative submit chain now passes through one append-only outcome tuple:

- `IntakeSubmitSettlement`
- `UrgentDiversionSettlement` when urgent advice is actually issued
- `IntakeOutcomePresentationArtifact`
- `PatientReceiptConsistencyEnvelope` for routine or recovery grammar
- `OutcomeNavigationGrant` when the outcome needs governed browser handoff
- `Phase1OutcomeTuple`

## Core law

- urgent advice may be issued only from a current settled `SafetyDecisionRecord` whose requested state is `urgent_diversion_required`
- `urgent_diverted` is legal only after `UrgentDiversionSettlement(settlementState = issued)`
- routine receipt and recovery grammar are separate result families, not copy variants of one generic success/error state
- replay returns the same `Phase1OutcomeTuple` and linked artifact chain for the same `IntakeSubmitSettlement`
- the receipt envelope stays monotone through `PatientReceiptConsistencyEnvelope(receiptBucket = after_2_working_days, etaPromiseRef = ETA_151_CONSERVATIVE_AFTER_2_WORKING_DAYS_V1)`

## Outcome families

The contract ref is `OGC_151_PHASE1_OUTCOME_GRAMMAR_V1`.

- `urgent_diversion`
  `urgent_diversion_required` resolves the pre-issuance copy family and `urgent_diverted` resolves the issued family. Both stay on `ArtifactPresentationContract` and require `OutcomeNavigationGrant`.
- `triage_ready`
  `screen_clear` and `residual_risk_flagged` both receive a routine receipt envelope, but the copy variant preserves the residual-risk distinction.
- `stale_recoverable`
  same-shell recovery remains explicit and never degrades into calm receipt.
- `failed_safe`
  processing/runtime failure uses recovery grammar and may not masquerade as routine calmness.
- `denied_scope`
  submit-blocked outcomes remain visibly denied rather than being folded into validation copy.

## Gap closure

`GAP_RESOLVED_RECEIPT_GRAMMAR_OBJECTS_151_V1` freezes the missing receipt-envelope family now. Later patient shells, telephony, embedded, and live handoff work must reuse these identifiers rather than minting their own outcome semantics.
