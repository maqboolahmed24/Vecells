# 60 Recovery Tier And Essential Function Policy

        The recovery tier policy binds business recovery units to explicit restore ceilings, degraded-mode definitions, backup scope, and required journey proof.

        ## Tier Matrix

        | Function | Tier | RTO | RPO | Max Diagnostic | Restore Priority | Journey Proof |
| --- | --- | --- | --- | --- | --- | --- |
| Patient entry, intake, and secure-link recovery | tier_1 | PT30M | PT5M | PT15M | 1 | SRCR_058_PREPROD_INTAKE_RESUME_V1, SRCR_058_PRODUCTION_PATIENT_NAV_V1 |
| Patient home, requests, messages, appointments, and record continuity | tier_1 | PT30M | PT5M | PT20M | 1 | SRCR_058_PREPROD_PATIENT_NAV_V1, SRCR_058_PREPROD_RECORD_CONTINUATION_V1 |
| Workspace triage, clinician decision, and settlement | tier_1 | PT45M | PT10M | PT20M | 2 | SRCR_058_PREPROD_WORKSPACE_TASK_COMPLETION_V1, RC_059_DUPLICATE_COLLISION_REVIEW_V1 |
| Booking confirmation, waitlist, and capacity commit | tier_2 | PT60M | PT15M | PT25M | 3 | SRCR_058_PREPROD_BOOKING_MANAGE_V1, RC_059_BOOKING_CONFIRMATION_PENDING_AMBIGUITY_V1 |
| Network hub queue, acknowledgement, and cross-organisation coordination | tier_2 | PT60M | PT15M | PT30M | 4 | SRCR_058_PREPROD_HUB_BOOKING_MANAGE_V1, RC_059_BOOKING_CONFIRMATION_PENDING_AMBIGUITY_V1 |
| Pharmacy referral dispatch, consent, and outcome reconciliation | tier_2 | PT60M | PT20M | PT30M | 5 | SRCR_058_PREPROD_PHARMACY_CONSOLE_SETTLEMENT_V1, RC_059_PHARMACY_DISPATCH_WEAK_MATCH_V1 |
| Patient communication, callback, and reachability repair | tier_1 | PT30M | PT10M | PT20M | 2 | SRCR_058_PREPROD_MORE_INFO_REPLY_V1, SRCR_058_PREPROD_SUPPORT_REPLAY_RESTORE_V1 |
| Release governance, tuple parity, and live wave control | tier_0 | PT15M | PT0M | PT10M | 0 | SRCR_058_PRODUCTION_PATIENT_NAV_V1, SRCR_058_PRODUCTION_WORKSPACE_TASK_COMPLETION_V1 |
| Operational readiness, restore authority, and recovery activation | tier_0 | PT15M | PT0M | PT5M | 0 | SRCR_058_PRODUCTION_SUPPORT_REPLAY_RESTORE_V1, SRCR_058_PRODUCTION_PATIENT_NAV_V1 |

        ## Policy Notes

        - `tier_0` scopes are control-plane recovery units. They fail closed fastest and never inherit authority from a historic clean rehearsal.
        - `tier_1` scopes cover patient entry, portal continuity, workspace settlement, and communication repair where calm or writable posture must degrade quickly.
        - `tier_2` scopes cover booking, hub, and pharmacy loops where manual reconciliation remains legal but still tuple-bound.
        - Every row references both reference-case proof from seq_059 and synthetic recovery proof from seq_058 so journey readiness and recovery posture stay joined.
