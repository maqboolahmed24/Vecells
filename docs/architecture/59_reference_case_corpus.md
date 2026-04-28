# 59 Reference Case Corpus

        The Phase 0 reference corpus is the single seeded scenario set used by preview, integration, preprod, and wave-probe verification.

        | Case code | Persona | Channel | Route family | Primary release use | Posture | Simulators | Continuity controls |
        | --- | --- | --- | --- | --- | --- | ---: | --- |
        | clean_self_service_submit | patient_self_service | browser_public | rf_intake_self_service | preview | happy | 1 | patient_nav |
| duplicate_retry_return_prior_accepted | patient_authenticated | authenticated_portal | rf_patient_requests | preview | happy | 1 | patient_nav |
| duplicate_collision_open_review | support_operator | support_workspace | rf_support_ticket_workspace | integration | recovery | 2 | workspace_task_completion |
| fallback_review_after_accepted_progress_degrades | support_operator | support_workspace | rf_support_replay_observe | wave_probe | degraded | 2 | support_replay_restore, conversation_settlement, more_info_reply |
| wrong_patient_identity_repair_hold | patient_authenticated | authenticated_portal | rf_patient_secure_link_recovery | preview | blocked | 2 | patient_nav |
| urgent_diversion_required_then_issued | patient_self_service | browser_public | rf_intake_self_service | preprod | blocked | 2 | intake_resume |
| telephony_urgent_live_only_capture | caller_telephony | telephony_ivr | rf_intake_telephony_capture | preprod | degraded | 2 | intake_resume |
| telephony_seeded_vs_challenge_continuation | caller_telephony | telephony_ivr | rf_intake_telephony_capture | preprod | recovery | 2 | intake_resume, patient_nav |
| booking_confirmation_pending_ambiguity | hub_operator | hub_workspace | rf_hub_case_management | preprod | blocked | 4 | booking_manage, hub_booking_manage |
| pharmacy_dispatch_proof_pending_weak_match | pharmacy_operator | pharmacy_console | rf_pharmacy_console | integration | degraded | 3 | pharmacy_console_settlement |
| support_replay_restore_same_shell_recovery | support_operator | support_workspace | rf_support_replay_observe | preprod | recovery | 3 | support_replay_restore, conversation_settlement, more_info_reply, workspace_task_completion |

        ## Reuse Rules

        - The same case IDs and seed object IDs must be reused across preview, integration, preprod, and wave probes.
        - A case may change ring-specific continuity proof or publication tuple, but it may not change canonical aggregate or blocker semantics.
        - Duplicate, blocker, degraded, and recovery scenarios stay first-class and are not optional add-ons.
