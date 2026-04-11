# 36 GP System Pathways Actual Strategy

The actual-provider-later view is deliberately fail-closed. Seq_036 classifies the official routes, but it does not open live mutation or claim that provider booking reach is ready.

## Actual_provider_strategy_later

- principal-system actual-later lanes: `im1_pairing_optum_emisweb`, `im1_pairing_tpp_systmone`
- watch-only official lanes: `gp_connect_appointment_management_watch_only`, `bars_watch_only`
- current verdict: `blocked` while Phase 0 external readiness remains withheld and live gates remain open

## Official route classification

| Path | Official posture | Why not baseline now | Later gate |
| --- | --- | --- | --- |
| IM1 Pairing / Optum (EMISWeb) | listed_on_im1_pairing_page_2026_04_09 | Official supplier exists, but exact booking semantics still need supplier evidence and assurance. | Open only after pairing, supplier PIP review, licence execution, supported test, assurance, and current sponsor or approver signoff. |
| IM1 Pairing / TPP (SystmOne) | listed_on_im1_pairing_page_2026_04_09 | Official supplier exists, but exact booking semantics still need supplier evidence and assurance. | Open only after pairing, supplier PIP review, licence execution, supported test, assurance, and current sponsor or approver signoff. |
| GP Connect Appointment Management / Watch only | appointment_management_live_but_new_supplier_development_paused | Officially live but bounded, estate-specific, and not open for new supplier expansion now. | Possible only for bounded existing estates and only if future sponsor posture explicitly chooses that lane. |
| BaRS / Watch only | broader_interoperability_standard_current | Important standard, but not the current Vecells principal-GP-system booking route. | Future bounded adapter exploration only after explicit sponsor and use-case narrowing. |

## Live gates

| Gate | Status | Summary | Required env |
| --- | --- | --- | --- |
| LIVE_GATE_PROVIDER_PATH_EVIDENCE_PUBLISHED | pass | Seq_036 publishes the path matrix, proof dossier, decision register, and gap register. | n/a |
| LIVE_GATE_APPROVED_PROVIDER_SCORECARDS | pass | Seq_022 already froze the GP/IM1/booking supplier scorecard family and due-diligence bars. | n/a |
| LIVE_GATE_ARCHITECTURE_AND_DATA_FLOW_CURRENT | review_required | The architecture baseline exists, but the live-provider-specific diagram digest still needs named refresh before any real path can open. | GP_PROVIDER_ARCHITECTURE_DIAGRAM_REF; GP_PROVIDER_DATAFLOW_DIAGRAM_REF |
| LIVE_GATE_CREDIBLE_BOOKING_MVP | blocked | Actual provider work stays blocked until a bounded booking MVP is explicitly named and approved. | GP_PROVIDER_BOOKING_MVP_REF |
| LIVE_GATE_SPONSOR_AND_COMMISSIONING_POSTURE | blocked | A real provider path cannot open without named sponsor ownership and commissioning posture. | GP_PROVIDER_SPONSOR_MODE |
| LIVE_GATE_NAMED_APPROVER_AND_ENVIRONMENT | blocked | Actual-later remains fail-closed until a named approver and target environment are declared. | GP_PROVIDER_NAMED_APPROVER; GP_PROVIDER_ENVIRONMENT_TARGET |
| LIVE_GATE_MUTATION_FLAG_ENABLED | blocked | Real provider mutation stays blocked unless ALLOW_REAL_PROVIDER_MUTATION=true is supplied deliberately. | ALLOW_REAL_PROVIDER_MUTATION |
| LIVE_GATE_WATCH_REGISTER_CLEAR | blocked | The gap register still contains unresolved supplier, governance, and evidence blockers. | GP_PROVIDER_WATCH_REGISTER_ACK |
| LIVE_GATE_PHASE0_EXTERNAL_FOUNDATION | blocked | Seq_020 still reports Phase 0 entry withheld, so actual provider motion cannot be treated as current-baseline execution. | n/a |

## Current official grounding

| Source | Captured | Why it matters |
| --- | --- | --- |
| IM1 Pairing integration | 2026-04-10 | NHS England still positions IM1 Pairing as the current principal-system route. The page names Optum (EMISWeb) and TPP (SystmOne), says there are no current plans to decommission IM1 Pairing, and shows the path from prerequisites through SCAL, supported test, assurance, and live rollout. |
| GP Connect Appointment Management | 2026-04-10 | The GP Connect Appointment Management page describes the API as live and highlights its primary use in integrated urgent care, care navigation, and care coordination. It also names current embedded consumer suppliers instead of inviting new baseline product onboarding. |
| GP Connect supplier progress | 2026-04-10 | The supplier-progress page explicitly says new supplier development for Appointment Management is currently paused while existing consumer suppliers remain listed. |
| Guidance for referrals and bookings specific use cases | 2026-04-10 | NHS England's guidance explicitly says patient-to-GP-practice booking applications are generally integrated with principal clinical systems through IM1 Pairing Patient APIs, while BaRS is presented in referral and urgent-care use cases. |
| NHS Booking and Referral Standard | 2026-04-10 | The standard defines BaRS as a FHIR-based interoperability standard between patient record systems for booking and referral information exchange. That is important, but it still does not make BaRS the current Vecells baseline for principal-GP-system patient self-service booking. |
