# 36 GP System Pathways Mock Strategy

Seq_036 freezes the current GP principal-system posture without pretending every official route is equally real or equally usable today.

## Mock_now_execution

- executable now: `local_adapter_simulator_required`
- bounded fallback now: `manual_practice_handoff_only`
- non-executable now but visible: the two IM1 actual-later rows plus the GP Connect and BaRS watch rows
- proof rule: transport, acceptance, and booked reassurance stay separate facts under canonical booking proof objects

## Current mock-now and fallback matrix

| Path | Current execution | Proof discipline | Fallback rule |
| --- | --- | --- | --- |
| Local adapter simulator / Required | required_now | Durable reference, same-commit read-after-write, ambiguous acceptance, and failure paths simulated. | assisted_only, linkage_required, local_component_required, blocked, callback_fallback, hub_review_pending. |
| Manual practice handoff / Only | bounded_fallback_only | Manual confirmation only after explicit practice acknowledgement and canonical projection refresh. | callback_fallback, hub_review_pending, assisted_only, or recovery_required. |

## Full path classification

| Path | Kind | Maturity | Actor modes | Proof class | Current position | Actual-later position |
| --- | --- | --- | --- | --- | --- | --- |
| IM1 Pairing / Optum (EMISWeb) | principal_system_actual_later | actual_later_gated | patient_self_service; staff_assist | authoritative_commit_or_read_after_write | Use only in the local simulator and capability-matrix pack now. Do not expose live patient booking. | Open only after pairing, supplier PIP review, licence execution, supported test, assurance, and current sponsor or approver signoff. |
| IM1 Pairing / TPP (SystmOne) | principal_system_actual_later | actual_later_gated | patient_self_service; staff_assist | authoritative_commit_or_read_after_write | Use only in the local simulator and capability-matrix pack now. Do not expose live patient booking. | Open only after pairing, supplier PIP review, licence execution, supported test, assurance, and current sponsor or approver signoff. |
| GP Connect Appointment Management / Watch only | existing_estate_watch | watch_only | staff_assist; urgent_care_referrer | watch_only_consumer_truth | Watch only. Do not model as the current product default. | Possible only for bounded existing estates and only if future sponsor posture explicitly chooses that lane. |
| BaRS / Watch only | broader_referral_standard_watch | watch_only | staff_assist; urgent_care_referrer | inter_provider_referral_standard | Watch only. Keep visible for future interoperability but not as the current GP principal-system lane. | Future bounded adapter exploration only after explicit sponsor and use-case narrowing. |
| Local adapter simulator / Required | mock_now_executable | mock_now_executable | patient_self_service; staff_assist; operations_support | simulated_authoritative_truth | Mandatory now. This is the only executable booking-provider lane in the current baseline. | Remains the proving ground even after live provider paths open. |
| Manual practice handoff / Only | manual_fallback_only | manual_only | staff_assist; operations_support; practice_staff | manual_handoff_acknowledgement | Allowed only as bounded fallback. It is not a silent success path. | May remain the safety fallback even after live provider rails open. |

## Mock guardrails

- The simulator must preserve slot freshness, revalidation, reservation semantics, ambiguous confirmation, and waitlist or fallback truth.
- Manual practice handoff is continuity protection only; it never implies booked calmness by itself.
- GP Connect and BaRS stay visible in the same path model so the team does not quietly re-baseline them later.
