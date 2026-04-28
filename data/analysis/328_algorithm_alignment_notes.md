# 328 Algorithm Alignment Notes

`par_328` consumes the validated Phase 5 outputs from `320`, `323`, `324`, and `326`.

## Region to projection mapping

| UI region | Projection source | Notes |
| --- | --- | --- |
| `AlternativeOfferHero` | `AlternativeOfferSessionRouteSnapshot328` + `HubOfferToConfirmationTruthProjectionRouteSnapshot328` | Hero copy stays truthful to entry mode, actionability, and confirmation posture. |
| ranked option cards | `AlternativeOfferEntryProjection328[]` | The full current patient-offerable set stays visible. Recommendation chips are advisory only. |
| callback fallback card | `AlternativeOfferFallbackCardProjection328` | Callback remains a separate governed action and never joins the ranked stack. |
| selection rail | `HubOfferToConfirmationTruthProjectionRouteSnapshot328` | Accept, decline-all, and callback update child truth posture without pretending confirmation already happened. |
| `AlternativeOfferProvenanceStub` | `AlternativeOfferRegenerationSettlementRouteSnapshot328` plus recovery reason | Expired, superseded, stale-link, wrong-patient, embedded-drift, and publication-drift states keep last-safe context visible. |
| route repair panel | contact-route recovery contract | Repair stays in shell and preserves the selected anchor while fresh action is blocked. |
| return binder | `sameShellContinuationRef`, selected anchor refs, and origin query | Return and refresh continuity are explicit, not implicit browser luck. |

## Governing closures

- Close the “recommended means preselected” gap: live entry has no selected offer and no hidden rows.
- Close the “callback is just another card” gap: callback owns separate DOM markers and separate action law.
- Close the “detached network mini-site” gap: route stays inside the booking shell and publishes the same responsive/embedded markers.
- Close the “stale route still looks actionable” gap: stale-link, wrong-patient, superseded, expired, embedded-drift, and publication-drift scenarios downgrade to provenance or blocked posture.
- Close the “mobile is a second journey” gap: the same scenario model drives desktop, folded, and embedded views.
