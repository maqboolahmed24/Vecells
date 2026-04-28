# 28 Mesh Workflow Group And ID Registry

        Section A — `Mock_now_execution`

        The registry below is the control-plane source for the mock twin and mailroom console. Every row exists because a bounded-context flow needs it. No row implies that the workflow ID is already approved by MESH.

        | workflow_group | workflow_id | workflow_role | message_family | mailbox_direction | approval_posture |
| --- | --- | --- | --- | --- | --- |
| WG_HUB_PRACTICE_VISIBILITY | VEC_HUB_BOOKING_NOTICE | initiator | practice_visibility_notice | outbound | candidate_new_or_needs_mapping |
| WG_HUB_PRACTICE_VISIBILITY | VEC_HUB_BOOKING_ACK | responder | practice_business_ack | inbound | candidate_new_or_needs_mapping |
| WG_PHARMACY_REFERRAL | VEC_PF_REFERRAL_INIT | initiator | pharmacy_referral_dispatch | outbound | candidate_new_or_needs_mapping |
| WG_PHARMACY_REFERRAL | VEC_PF_REFERRAL_ACK | responder | pharmacy_business_ack | inbound | candidate_new_or_needs_mapping |
| WG_PHARMACY_REFERRAL | VEC_PF_OUTCOME_RESP | responder | pharmacy_outcome_return | inbound | candidate_new_or_needs_mapping |
| WG_PHARMACY_REFERRAL | VEC_PF_URGENT_RETURN_RESP | responder | pharmacy_urgent_return | inbound | candidate_new_or_needs_mapping |
| WG_SUPPORT_QUARANTINE_REPLAY | VEC_ATTACHMENT_QUARANTINE | duplex | attachment_quarantine_notice | duplex | candidate_new_or_needs_mapping |
| WG_SUPPORT_QUARANTINE_REPLAY | VEC_REPLAY_EVIDENCE_REQUEST | duplex | replay_or_resubmission_request | duplex | candidate_new_or_needs_mapping |
| WG_HUB_MANUAL_RECOVERY | VEC_HUB_RECOVERY_ACTION | initiator | manual_recovery_follow_up | outbound | candidate_new_or_needs_mapping |

        ## Registry law

        - Every workflow row carries a business-flow statement, proof target, fallback, and directionality rule.
        - Candidate IDs must be mapped to an existing approved workflow or requested through the official workflow-request process.
        - Business acknowledgements remain distinct from mailbox download acknowledgement.

        Section B — `Actual_provider_strategy_later`

        Before any real workflow request, Vecells must confirm whether each candidate row maps to an existing workflow workbook entry or requires a new-group or new-ID request with prior MESH-team liaison. The official workflow request requires a concise MESH-side transfer description and explicit initiator or responder posture for each requested ID.
