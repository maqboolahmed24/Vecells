# 15 Operational Readiness And Resilience Tooling

        The readiness baseline is tuple-bound. `OperationalReadinessSnapshot`, `RunbookBindingRecord`, `RecoveryControlPosture`, `RestoreRun`, `FailoverRun`, and `ChaosRun` are the only live authorities for recovery posture.

        ## Essential Function Matrix

        | Essential function | SLO | Alert route | Dashboard | Synthetic | Recovery refs |
| --- | --- | --- | --- | --- | --- |
| Patient entry, intake, and secure-link recovery | 99.90% over 30 days | ALERT_PATIENT_ENTRY_SLO | DASH_PATIENT_ENTRY_AND_RECOVERY | SYN_PATIENT_ENTRY_AND_RECOVERY | RecoveryControlPosture(patient public recovery scope) |
| Patient home, requests, messages, appointments, and record continuity | 99.50% over 30 days | ALERT_PATIENT_SELF_SERVICE_CONTINUITY | DASH_PATIENT_SELF_SERVICE | SYN_PATIENT_SELF_SERVICE_CONTINUITY | RecoveryControlPosture(patient authenticated scope) |
| Workspace triage, clinician decision, and settlement | 99.50% over 30 days | ALERT_WORKSPACE_SETTLEMENT_SLO | DASH_WORKSPACE_SETTLEMENT | SYN_WORKSPACE_TRIAGE_AND_SETTLEMENT | RecoveryControlPosture(workspace mutation scope) |
| Booking confirmation, waitlist, and capacity commit | 99.00% over 30 days | ALERT_BOOKING_AND_PARTNER_FLOW_SLO | DASH_BOOKING_AND_CAPACITY | SYN_BOOKING_AND_CAPACITY_COMMIT | RecoveryControlPosture(booking management scope) |
| Network hub queue, acknowledgement, and cross-organisation coordination | 99.00% over 30 days | ALERT_HUB_COORDINATION_HEALTH | DASH_NETWORK_HUB | SYN_NETWORK_HUB_COORDINATION | RecoveryControlPosture(hub coordination scope) |
| Pharmacy referral dispatch, consent, and outcome reconciliation | 99.00% over 30 days | ALERT_PHARMACY_REFERRAL_HEALTH | DASH_PHARMACY_LOOP | SYN_PHARMACY_REFERRAL_AND_OUTCOME | RecoveryControlPosture(pharmacy console scope) |
| Patient communication, callback, and reachability repair | 99.50% over 30 days | ALERT_COMMUNICATION_AND_CALLBACK_HEALTH | DASH_COMMUNICATION_AND_CALLBACK | SYN_COMMUNICATION_AND_CALLBACK | RecoveryControlPosture(communication scope) |
| Release governance, tuple parity, and live wave control | 100% exact for active waves | ALERT_WATCH_TUPLE_OR_PARITY_DRIFT | DASH_RELEASE_EVIDENCE_COCKPIT | SYN_RELEASE_CONTROL_AND_GOVERNANCE | RecoveryControlPosture(release control scope) |
| Operational readiness, restore authority, and recovery activation | 100% current for active release tuple | ALERT_READINESS_OR_REHEARSAL_STALE | DASH_RESILIENCE_AND_RECOVERY | SYN_RESILIENCE_RECOVERY_CONTROL | RecoveryControlPosture(platform recovery scope) |

        ## Readiness Law

        - Every essential function has one SLO, one alert route, one dashboard, one synthetic journey, and restore or failover or chaos evidence requirements.
        - `readinessState = ready` is impossible on stale rehearsal evidence or stale runbook bindings.
        - The same release tuple feeds operations boards, governed handoff, release watch, and recovery activation.
        - This is the direct closure for Finding 112: no loose dashboard, wiki runbook, or remembered drill remains live authority once the readiness tuple drifts.
