# Deferred And Conditional Scope

These items are designed and inventoried now, but they do not all belong in the current completion line.

| ID | Capability | Class | Condition | Dependency summary |
| --- | --- | --- | --- | --- |
| cap_nhs_app_embedded_channel | Trusted NHS App embedded web channel | deferred_channel_expansion | Deferred baseline scope. Inventory now, deliver later. | NHS App route manifest (deferred); Trusted bridge capability negotiation (deferred); Environment-specific release guardrails (deferred) |
| cap_optional_pds_enrichment | Optional PDS enrichment layered onto governed identity binding | future_optional | Conditional future enrichment. Must not replace local governed identity authority. | Personal Demographics Service adapter (optional); PDS sandbox or simulator (replaceable_by_simulator) |
| cap_model_vendor_assistive_rollout | Model-vendor-backed assistive rollout cohorts beyond the baseline floor | future_optional | Conditional cohort expansion. Baseline requires the control plane, not universal visible rollout. | Model vendor contract (feature_flagged); Assistive rollout ladder (required_baseline); Kill switch and freeze controls (required_baseline) |
| cap_supplier_specific_capability_expansion | Supplier-specific capability expansion hidden behind adapter seams | future_optional | Conditional adapter-layer expansion only. Core request semantics stay vendor-agnostic. | Supplier capability matrix updates (optional); Supplier sandbox or simulator (replaceable_by_simulator) |

## Required conditional items

- `cap_nhs_app_embedded_channel`: deferred channel expansion under phase-7 contracts.
- `cap_optional_pds_enrichment`: optional demographic enrichment only.
- `cap_model_vendor_assistive_rollout`: cohort-gated model-vendor rollout beyond the baseline floor.
- `cap_supplier_specific_capability_expansion`: supplier-specific capability growth behind adapter seams only.

