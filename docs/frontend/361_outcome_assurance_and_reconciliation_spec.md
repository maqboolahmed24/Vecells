# 361 Outcome Assurance And Reconciliation Spec

## Scope

`par_361` replaces the placeholder assurance child route on the pharmacy workspace shell with a dense, same-shell outcome-assurance workbench.

It covers:

- incoming outcome source and match summary
- reconciliation confidence, classification, and close-block posture
- manual-review prominence
- evidence provenance inspection without leaving the shell
- one authoritative assurance `DecisionDock`

## Authoritative UI surfaces

- `PharmacyOutcomeAssurancePanel`
- `OutcomeEvidenceSourceCard`
- `OutcomeMatchSummary`
- `OutcomeConfidenceMeter`
- `OutcomeGateTimeline`
- `OutcomeManualReviewBanner`
- `OutcomeEvidenceDrawer`
- `OutcomeDecisionDock`

## Truth sources

The assurance preview binds the shell route to:

- `PharmacyOutcomeTruthProjection`
- `PharmacyOutcomeReconciliationGate`
- `PharmacyOutcomeSettlement`
- `PharmacyOutcomeMatchScorecard`
- `PharmacyAssuranceProjection`
- `OutcomeEvidenceEnvelope`
- `NormalizedPharmacyOutcomeEvidence`
- `PharmacyOutcomeSourceProvenance`

The browser may compose these facts for presentation. It may not infer calmness, closure, or match strength from local click state.

## Same-shell law

- assurance remains `/workspace/pharmacy/:pharmacyCaseId/assurance`
- the active case anchor and continuity markers remain on the pharmacy shell root
- route actions stay centralized in one `OutcomeDecisionDock`
- ambiguous and unmatched evidence remain visibly non-calm
- unmatched evidence never reads as slow completion or pending closure

## Surface law

- `PHC-2124` proves ambiguous weak-match review
- `PHC-2146` proves matched evidence with manual-review debt
- `PHC-2168` proves unmatched evidence and not-closable posture
- `PHC-2103` still falls back to the recovery-owned assurance placeholder until `362` lands the urgent-return recovery family

## Interface-gap note

`PHASE6_BATCH_356_363_INTERFACE_GAP_OUTCOME_ASSURANCE.json` records the bounded preview seam: consultation mode, medicines supplied, and GP action posture are composed from the existing 352/355 truth family because there is not yet one canonical backend-owned assurance bundle.

## Proof expectations

Playwright must prove that:

1. assurance renders as a child state of the same pharmacy shell
2. confidence, gate, and close posture stay visible and distinct
3. manual-review debt and unmatched evidence stay harder to miss than routine shell chrome
4. the evidence drawer stays keyboard reachable and screen-reader legible
5. decisive actions remain centralized in one `OutcomeDecisionDock`
6. matched, ambiguous, and unmatched variants all preserve the same-shell case anchor
