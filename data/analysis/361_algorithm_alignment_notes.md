# 361 Algorithm Alignment Notes

## Binding map

| UI field or action | Authoritative source | Notes |
| --- | --- | --- |
| assurance header title, status pill, close posture | `PharmacyOutcomeTruthProjection`, `PharmacyOutcomeReconciliationGate`, `PharmacyAssuranceProjection` | Header never promotes calmness unless confidence, gate, and close posture all allow it. |
| matched case and runner-up | `PharmacyOutcomeMatchScorecard` | The panel keeps the best candidate and runner-up visible together for weak-match review. |
| confidence band, confidence value, delta to runner-up | `PharmacyOutcomeMatchScorecard`, `PharmacyOutcomeTruthProjection` | Band and numeric proof remain synchronized across header, meter, and root data attributes. |
| gate timeline | `PharmacyOutcomeReconciliationGate`, `PharmacyOutcomeSettlement` | The current gate state is rendered as timeline posture, not inferred from local action state. |
| manual-review banner | `PharmacyOutcomeTruthProjection.manualReviewState`, `PharmacyOutcomeReconciliationGate.gateState` | Review prominence changes by truth posture: alert for unresolved ambiguity or unmatched evidence, status for in-progress review debt. |
| evidence drawer rows | `OutcomeEvidenceEnvelope`, `PharmacyOutcomeSourceProvenance`, `NormalizedPharmacyOutcomeEvidence`, `PharmacyOutcomeMatchScorecard`, `PharmacyOutcomeReconciliationGate` | Drawer keeps provenance, parser assumptions, and gate/scoring proof in one same-shell rail. |
| decisive actions | `PharmacyOutcomeTruthProjection`, `PharmacyOutcomeReconciliationGate`, `PharmacyOutcomeSettlement` | `OutcomeDecisionDock` remains the one authoritative action locus for validate, resolve, and handoff routes. |

## Scenario alignment

- `PHC-2124`: ambiguous weak-match review. Confidence is low, runner-up remains visible, closure is blocked.
- `PHC-2146`: matched evidence with manual-review debt. Confidence is high, but the case stays explicitly review-bound.
- `PHC-2168`: unmatched evidence. No candidate clears the source floor, so the case is not closable and cannot quiet itself.

## Preview seam

`PHASE6_BATCH_356_363_INTERFACE_GAP_OUTCOME_ASSURANCE.json` records the bounded fallback that composes consultation mode, medicines supplied, and GP-action posture for the assurance panel. Those fields are deterministic and source-backed, but they are not yet published as one backend-owned assurance bundle.

## Action law

- assurance does not close or settle the case locally
- assurance actions route back into the same pharmacy shell lanes
- handoff proof stays distinct from outcome truth
- unresolved review or unmatched posture blocks calm copy everywhere in the shell
