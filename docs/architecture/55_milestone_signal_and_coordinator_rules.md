# 55 Milestone Signal And Coordinator Rules

            ## Signal Producers Versus Canonical State Owner

            The rule is one-way:

            - child domains emit milestone, gate, repair, or reopen signals
            - `LifecycleCoordinator` consumes those signals under the current lineage epoch
            - only the coordinator may emit canonical close, defer, or reopen verdicts

            ## Milestone Signal Matrix

            | Signal | Domain | Blockers | Coordinator Consumption | Reopen |
| --- | --- | --- | --- | --- |
| MSIG_055_BOOKING_AMBIGUOUS | booking | confirmation_gate;outcome_reconciliation | materialize_blockers | contradiction |
| MSIG_055_BOOKING_CONFIRMATION_PENDING | booking | confirmation_gate;degraded_promise | materialize_blockers | none |
| MSIG_055_BOOKING_CONFIRMED | booking | none | derive_milestone_only | none |
| MSIG_055_COMMUNICATION_CALLBACK_OUTCOME_RECORDED | communication | reachability_dependency | derive_milestone_only | unable_to_contact |
| MSIG_055_COMMUNICATION_COMMAND_SETTLED | communication | none | derive_milestone_only | none |
| MSIG_055_HUB_CONFIRMATION_PENDING | hub_coordination | confirmation_gate | materialize_blockers | none |
| MSIG_055_HUB_EXTERNALLY_CONFIRMED | hub_coordination | none | derive_milestone_only | none |
| MSIG_055_HUB_PRACTICE_NOTIFIED | hub_coordination | approval_checkpoint;confirmation_gate | materialize_blockers | none |
| MSIG_055_PHARMACY_CASE_BOUNCE_BACK | pharmacy | safety_preemption;reachability_dependency | derive_governed_reopen | bounce_back |
| MSIG_055_PHARMACY_CASE_RESOLVED | pharmacy | none | derive_milestone_only | none |
| MSIG_055_PHARMACY_DISPATCH_CONFIRMED | pharmacy | degraded_promise | materialize_blockers | none |
| MSIG_055_PHARMACY_OUTCOME_RECEIVED | pharmacy | outcome_reconciliation | derive_milestone_only | none |
| MSIG_055_SUPPORT_ACTION_SETTLED | support | none | clear_or_refresh_blockers | none |
| MSIG_055_SUPPORT_REPLAY_RESTORE_REQUIRED | support | fallback_review | materialize_blockers | none |
| MSIG_055_SUPPORT_REPLAY_RESTORE_SETTLED | support | none | clear_or_refresh_blockers | none |
| MSIG_055_TRIAGE_CONTINUITY_UPDATED | triage | none | derive_milestone_only | none |
| MSIG_055_TRIAGE_SELFCARE_OR_ADMIN_OUTCOME_RECORDED | triage | none | derive_milestone_only | none |
| MSIG_055_TRIAGE_TASK_SETTLED | triage | none | derive_milestone_only | none |

            ## Reopen Trigger Matrix

            | Trigger | Vector | Threshold | Ownership Reacquire |
| --- | --- | --- | --- |
| RTP_055_URGENT | u_urgent | u_urgent(e) = 1 | triage_or_equivalent_immediately |
| RTP_055_UNABLE_TO_COMPLETE | u_unable | u_unable(e) = 1 | triage_or_pharmacy_followup |
| RTP_055_UNABLE_TO_CONTACT | u_contact | u_contact(e) >= tau_reopen | reachability_repair_then_triage |
| RTP_055_BOUNCE_BACK | u_bounce | u_bounce(e) >= tau_reopen | triage_reacquire_with_urgency_floor |
| RTP_055_CONSENT_REVOCATION | u_revocation | u_revocation(e) >= tau_reopen | triage_or_pharmacy_reassessment |
| RTP_055_CONTRADICTION | u_contradiction | u_contradiction(e) >= tau_reopen | reconciliation_or_triage_reissue |
| RTP_055_CLINICAL_CHANGE | delta_clinical | materialChange(e,l) >= tau_reopen | triage_reassess |
| RTP_055_CONTACT_CHANGE | delta_contact | materialChange(e,l) >= tau_reopen | reachability_repair_then_triage |
| RTP_055_PROVIDER_CHANGE | delta_provider | materialChange(e,l) >= tau_reopen | booking_or_hub_reconciliation |
| RTP_055_CONSENT_CHANGE | delta_consent | materialChange(e,l) >= tau_reopen | pharmacy_or_support_followup |
| RTP_055_TIMING_CHANGE | delta_timing | materialChange(e,l) >= tau_reopen | booking_or_callback_followup |
| RTP_055_IDENTITY_CHANGE | delta_identity | materialChange(e,l) >= tau_reopen | identity_repair_then_triage |

            ## Non-Negotiable Rules

            - No downstream domain may write `Request.workflowState = closed`.
            - No blocker class may be encoded as workflow state.
            - `request.close.evaluated` is the canonical defer-or-close checkpoint.
            - `request.reopened` is legal only after a persisted defer verdict under the new lineage epoch.
