# 28 Mesh Message Route And Proof Matrix

        Section A — `Mock_now_execution`

        The route matrix enforces the mandatory gap closure: message accepted is not workflow complete.

        | route_family_ref | message_family | preferred_workflow_id | transport_acceptance_signal | authoritative_downstream_proof |
| --- | --- | --- | --- | --- |
| rf_hub_queue | practice_visibility_notice | VEC_HUB_BOOKING_NOTICE | message_accepted or queued_for_pickup | PracticeAcknowledgementRecord or governed recovery evidence. |
| rf_hub_case_management | practice_business_ack | VEC_HUB_BOOKING_ACK | picked_up | Current-generation practice ACK or inability response on the correct ackGeneration. |
| rf_staff_workspace | practice_visibility_notice | VEC_HUB_BOOKING_NOTICE | delayed_ack | PracticeAcknowledgementRecord plus freshness on the current tuple. |
| rf_pharmacy_console | pharmacy_referral_dispatch | VEC_PF_REFERRAL_INIT | message_accepted | PharmacyDispatchAttempt.authoritativeProofRef accepted by the active TransportAssuranceProfile. |
| rf_pharmacy_console | pharmacy_business_ack | VEC_PF_REFERRAL_ACK | picked_up | Business ACK on the matching referral generation. |
| rf_patient_requests | pharmacy_outcome_return | VEC_PF_OUTCOME_RESP | message_accepted | Matched PharmacyOutcomeRecord or explicit PharmacyOutcomeReconciliationGate resolution. |
| rf_staff_workspace | pharmacy_urgent_return | VEC_PF_URGENT_RETURN_RESP | picked_up | Urgent return record or bounce-back evidence on the current PharmacyCase. |
| rf_support_ticket_workspace | attachment_quarantine_notice | VEC_ATTACHMENT_QUARANTINE | quarantined | Attachment quarantine manifest plus recovery action state. |
| rf_support_replay_observe | replay_or_resubmission_request | VEC_REPLAY_EVIDENCE_REQUEST | replay_blocked or duplicate_delivery | Replay collision evidence bound to canonicalDispatchKey and current generation. |
| rf_patient_messages | manual_recovery_follow_up | VEC_HUB_RECOVERY_ACTION | proof_pending | Recovery case resolution plus current acknowledgement or manual-completion evidence. |

        ## Guardrails

        - Transport acceptance, mailbox pickup, business acknowledgement, and authoritative downstream proof are separate facts.
        - Canonical request truth changes only after the bounded-context proof class required by the route is current.
        - Duplicate, expired, quarantined, and replay-blocked states must remain visible and operator-actionable.

        Section B — `Actual_provider_strategy_later`

        The same matrix drives the live-later minimum-necessary review and business-flow statement for each mailbox and workflow request. Any live route must explicitly name its authoritative downstream proof class before the request can be submitted.
