# 358 Algorithm Alignment Notes

## Mapping the visible chooser to 348 truth

| Visible surface | Authoritative 348 field(s) | Notes |
| --- | --- | --- |
| Provider order | `PharmacyChoiceProof.visibleProviderRefs` plus the proof's ranking formula | The browser preserves preview order and does not re-rank locally. |
| Recommended group | `PharmacyChoiceProof.recommendedProviderRefs` | The recommended group is advisory only. |
| All-valid group | `PharmacyChoiceTruthProjection.visibleProviderRefs` minus the recommended frontier | Valid warned providers stay visible here. |
| Warned provider state | `PharmacyChoiceTruthProjection.warningVisibleProviderRefs`, `PharmacyChoiceExplanation.warningCopyRef`, `overrideRequirementState` | Warning posture is card-level and drawer-level. |
| Selected provider | `PharmacyChoiceSession.selectedProviderRef`, `selectedProviderExplanationRef` | Selection remains separate from consent or dispatch truth. |
| Warned-choice gate | `PharmacyChoiceSession.patientOverrideRequired`, `PharmacyChoiceOverrideAcknowledgement` | The shell blocks forward motion until acknowledgement is complete. |
| Drift recovery strip | `PharmacyChoiceTruthProjection.visibleChoiceSetHash`, `projectionState` | A changed visible set pins the older choice as provenance instead of silently keeping it live. |
| Map markers | Same provider order and selection key as the list | The map is presentation-only and never re-ranks the proof. |
| Open-now / open-later buckets | Provider `openingState` presentation over the current visible set | Buckets are filters over the proof, not hidden eligibility rules. |

## Key closures

1. Hidden top result: closed by showing the full visible set alongside the advisory frontier.
2. Map/list disagreement: closed by deriving both from the same preview snapshot and selection key.
3. Open-now filter silently deleting warned providers: closed by keeping warning counts and warned cards inside each bucket.
4. Warning posture too easy to miss: closed by an inline warning panel plus `DecisionDock` escalation.
5. Changed ranking silently overwriting a selection: closed by the drift strip and read-only provenance card.
