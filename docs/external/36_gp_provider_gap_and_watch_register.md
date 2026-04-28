# 36 GP Provider Gap And Watch Register

The watch register keeps the uncomfortable facts visible: current official routes exist, but the real provider path is not open and cannot be claimed open from partial evidence.

## Gap and watch matrix

| Gap | Path | Severity | Blocks actual strategy | Summary | Next step |
| --- | --- | --- | --- | --- | --- |
| GAP_GP_001 | im1_pairing_optum_emisweb | high | yes | Optum (EMISWeb) is publicly listed for IM1 Pairing, but exact booking, hold, and manage semantics still need supplier PIP evidence. | Carry supplier-specific capability proof into seq_038 and seq_039 before any live claim. |
| GAP_GP_002 | im1_pairing_tpp_systmone | high | yes | TPP (SystmOne) is publicly listed for IM1 Pairing, but exact booking, hold, and manage semantics still need supplier PIP evidence. | Carry supplier-specific capability proof into seq_038 and seq_039 before any live claim. |
| GAP_GP_003 | gp_connect_appointment_management_watch_only | high | yes | GP Connect Appointment Management new supplier development is currently paused, so it cannot be treated as the current Vecells expansion lane. | Keep the lane watch-only unless official supplier posture changes materially. |
| GAP_GP_004 | gp_connect_appointment_management_watch_only | medium | yes | Current GP Connect Appointment Management value is estate-specific and oriented to existing consumer suppliers and staff flows. | Require a bounded estate-specific architecture decision before any future adoption. |
| GAP_GP_005 | bars_watch_only | medium | yes | BaRS is broader referral interoperability and should not be mistaken for the baseline patient-to-GP-practice principal-system booking path. | Keep BaRS in the watch register until a separate bounded use-case decision exists. |
| GAP_GP_006 | im1_pairing_optum_emisweb | high | yes | A real provider path cannot open without named sponsor ownership and commissioning posture. | Name sponsor and commissioning posture before any live provider activity. |
| GAP_GP_007 | im1_pairing_tpp_systmone | high | yes | Actual-later remains fail-closed until a named approver and target environment are declared. | Capture named approver and target environment before dry-run execution is considered. |
| GAP_GP_008 | local_adapter_simulator_required | medium | yes | The architecture baseline exists, but the live-provider-specific diagram digest still needs named refresh before any real path can open. | Freeze provider-specific architecture and data-flow digests before later live work. |
| GAP_GP_009 | manual_practice_handoff_only | high | yes | Real provider mutation stays blocked unless ALLOW_REAL_PROVIDER_MUTATION=true is supplied deliberately. | Keep all dry-run tooling fail-closed unless the mutation flag is explicitly enabled. |
| GAP_GP_010 | manual_practice_handoff_only | high | yes | The gap register still contains unresolved supplier, governance, and evidence blockers. | Resolve supplier and governance blockers before claiming the watch register is clear. |

## Gate-state digest

| Gate | Status | Reason |
| --- | --- | --- |
| LIVE_GATE_PROVIDER_PATH_EVIDENCE_PUBLISHED | pass | Seq_036 publishes the path matrix, proof dossier, decision register, and gap register. |
| LIVE_GATE_APPROVED_PROVIDER_SCORECARDS | pass | Seq_022 already froze the GP/IM1/booking supplier scorecard family and due-diligence bars. |
| LIVE_GATE_ARCHITECTURE_AND_DATA_FLOW_CURRENT | review_required | The architecture baseline exists, but the live-provider-specific diagram digest still needs named refresh before any real path can open. |
| LIVE_GATE_CREDIBLE_BOOKING_MVP | blocked | Actual provider work stays blocked until a bounded booking MVP is explicitly named and approved. |
| LIVE_GATE_SPONSOR_AND_COMMISSIONING_POSTURE | blocked | A real provider path cannot open without named sponsor ownership and commissioning posture. |
| LIVE_GATE_NAMED_APPROVER_AND_ENVIRONMENT | blocked | Actual-later remains fail-closed until a named approver and target environment are declared. |
| LIVE_GATE_MUTATION_FLAG_ENABLED | blocked | Real provider mutation stays blocked unless ALLOW_REAL_PROVIDER_MUTATION=true is supplied deliberately. |
| LIVE_GATE_WATCH_REGISTER_CLEAR | blocked | The gap register still contains unresolved supplier, governance, and evidence blockers. |
| LIVE_GATE_PHASE0_EXTERNAL_FOUNDATION | blocked | Seq_020 still reports Phase 0 entry withheld, so actual provider motion cannot be treated as current-baseline execution. |

## Decision digest

| Decision | Status | Choice | Rationale |
| --- | --- | --- | --- |
| DEC_36_001 | accepted | Treat IM1 Pairing as the only current principal-system actual-later path. | Current official guidance still points patient-to-GP-practice booking at IM1 Pairing Patient APIs, and the current public supplier roster names only Optum (EMISWeb) and TPP (SystmOne). |
| DEC_36_002 | accepted | Keep GP Connect Appointment Management as watch only. | The lane is officially live, but new supplier development is currently paused and the current use cases remain bounded to existing consumer estates and staff flows. |
| DEC_36_003 | accepted | Keep BaRS visible but not baseline for principal GP-system booking. | BaRS is relevant interoperability infrastructure, but current official guidance places principal-system patient booking against IM1 Pairing and places BaRS in broader referral or urgent-care contexts. |
| DEC_36_004 | accepted | Local adapter simulation is mandatory now. | The booking provider truth seam is a top-priority mock-now family and the blueprint explicitly requires deterministic simulation before supplier claims are trusted. |
| DEC_36_005 | accepted | Manual practice handoff is fallback only, not success. | Manual practice contact preserves continuity but must still flow through ExternalConfirmationGate and the current BookingConfirmationTruthProjection before any calm booked state appears. |
| DEC_36_006 | accepted | Proof objects remain named and separate. | Seq_036 refuses generic yes/no capability claims. Search, hold, authoritative confirmation, manage support, and reminder readiness stay distinct dimensions tied to named canonical objects. |
| DEC_36_007 | accepted | Actual provider work remains fail-closed. | The current gate set still blocks real provider work until booking MVP, sponsor posture, diagrams, approver, environment, mutation flag, and watch-register clearance all exist. |
