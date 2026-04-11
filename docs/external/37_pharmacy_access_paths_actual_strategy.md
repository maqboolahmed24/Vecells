# 37 Pharmacy Access Paths Actual Strategy

As of 10 April 2026, the official route posture is current enough to classify, but not current enough to treat as automatically live for Vecells.

## Actual_provider_strategy_later

- phase 0 external-foundation verdict: `withheld`
- actual-provider strategy state: `blocked`
- blocking assurance gaps: `6`

## Official route classification

| Route | Maturity | Version posture | Official status | Why blocked or bounded |
| --- | --- | --- | --- | --- |
| Service Search v3 / primary candidate | actual_later_gated | Service Search API v3 current; versions 1 and 2 deprecated on 2 February 2026. | Current official primary directory candidate for live pharmacy search. | Open later once the directory access path, patient-choice compliance review, and live tuple evidence are signed off. |
| DoS UEC REST / watch or supporting route | watch_only_supporting | Official urgent-and-emergency-care REST API remains catalogued in production context. | Urgent-care directory context only; not the baseline patient-choice route. | Use only after a bounded urgent-care architecture decision if the route remains necessary. |
| EPS DoS / supporting legacy route | watch_only_supporting | Current EPS-facing supplier guidance still points suppliers at DoHS; keep EPS DoS only as a supporting posture. | Legacy or supporting route only; not the strategic live default. | Stay legacy-supporting only, and never outrank the Service Search v3 route without a fresh policy decision. |
| Referral dispatch / primary candidate | actual_later_gated | Transport posture remains bounded to simulator law now; seq_028 currently inventories 10 MESH route rows separately. | Live route not yet selected; current truth is simulator-first only. | Open later only after the dispatch route, proof thresholds, and manual-assisted redispatch policy are frozen. |
| GP Connect Update Record / assured path | actual_later_gated | Current GP Connect Update Record route for consultation summaries over MESH; silver-service rollout remains combination dependent. | Assured visibility and consultation-summary path only. | Open later only when the community-pharmacy supplier or GP-system combination is named, assured, and replay-safe. |
| MESH or transport / observation dependency | supporting_dependency | Current MESH and secure-transport posture remains separately inventoried from the pharmacy route decision. | Supporting dependency only; not business truth. | Remain a supporting dependency only after live mailbox, workflow, or equivalent transport specifics are frozen. |

## Live gates

| Gate | Status | Summary | Required env |
| --- | --- | --- | --- |
| LIVE_GATE_PHARMACY_PROVIDER_SCORECARDS_APPROVED | pass | Seq_022 already froze the pharmacy directory, transport, and outcome scorecard families. | n/a |
| LIVE_GATE_PHARMACY_TRANSPORT_SCORECARDS_APPROVED | pass | Seq_028 already froze message-route and proof separation for pharmacy-related MESH posture. | n/a |
| LIVE_GATE_PHARMACY_MVP_APPROVED | blocked | Actual-provider work stays blocked until a bounded pharmacy MVP is explicitly named and approved. | PHARMACY_MVP_REF |
| LIVE_GATE_PHARMACY_CONSENT_AND_DISPATCH_MODELS_IMPLEMENTED | review_required | The canonical contracts are specified, but seq_037 does not claim runtime implementation is already complete. | PHARMACY_RUNTIME_IMPLEMENTATION_REF |
| LIVE_GATE_PHARMACY_NAMED_APPROVER_AND_ENVIRONMENT | blocked | Real-provider route discovery remains fail-closed until a named approver and environment target exist. | PHARMACY_NAMED_APPROVER; PHARMACY_TARGET_ENVIRONMENT |
| LIVE_GATE_PHARMACY_MUTATION_FLAG_ENABLED | blocked | Real provider mutation must remain blocked unless ALLOW_REAL_PROVIDER_MUTATION=true is supplied deliberately. | ALLOW_REAL_PROVIDER_MUTATION |
| LIVE_GATE_PHARMACY_WATCH_REGISTER_CLEAR | blocked | The current assurance gaps still include unresolved blockers across discovery, transport, urgent fallback, and outcome observation. | PHARMACY_WATCH_REGISTER_ACK |
| LIVE_GATE_PHARMACY_UPDATE_RECORD_COMBINATION_NAMED | blocked | GP Connect Update Record remains blocked until the exact assured combination and rollout context are recorded. | PHARMACY_UPDATE_RECORD_COMBINATION_REF |
| LIVE_GATE_PHARMACY_URGENT_RETURN_OWNERSHIP_REHEARSED | blocked | The manual safety-net route is mandatory, but live opening stays blocked until ownership and rehearsal evidence are recorded. | PHARMACY_URGENT_RETURN_REHEARSAL_REF |
| LIVE_GATE_PHASE0_EXTERNAL_FOUNDATION | blocked | Seq_020 still reports Phase 0 entry as withheld, so actual provider motion cannot be treated as current-baseline execution. | n/a |

## Current official grounding

| Official source | Captured | Why it matters |
| --- | --- | --- |
| Directory of Healthcare Services (Service Search) API | 2026-04-10 | The current catalogue positions Service Search API version 3 as the live version, with versions 1 and 2 deprecated on 2 February 2026. It supports searching by location together with clinical services, service type, and capability filters. |
| Guide to search identifiers and service codes | 2026-04-10 | The guide publishes pharmacy-relevant identifiers and service codes including community pharmacy consultation and Pharmacy First codes, which makes route-level choice evidence and capability snapshots more concrete. |
| Directory of Services - Urgent and Emergency Care - REST API | 2026-04-10 | The urgent-and-emergency-care REST API still sits in the official catalogue under the urgent-care taxonomy, while the Directory of Services overview keeps its primary use in NHS 111 and Pathways referral contexts. Vecells therefore treats it as watch or supporting directory context only, not as the baseline patient-choice route. |
| Electronic Prescription Service guidance for suppliers | 2026-04-10 | Current EPS supplier guidance says suppliers dispensing via EPS Release 2 require the Directory of Healthcare Services API and that it provides information on dispensing services available to prescribing systems. Vecells keeps EPS DoS visible only as a legacy supporting route and not as the main live discovery default. |
| GP Connect: Update Record | 2026-04-10 | GP Connect Update Record remains the community-pharmacy route for pharmacist consultation summaries, with messages sent over MESH. The page also says Update Record is a silver service, so exact supplier and system combinations remain bounded and staged. |
| GP Connect news | 2026-04-10 | Current GP Connect programme news still frames Update Record through Pharmacy First rollout and independent-pharmacy expansion, which confirms the route is live in principle but not a blanket assumption for every tenant or supplier combination. |
