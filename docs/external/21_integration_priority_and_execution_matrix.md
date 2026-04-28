            # 21 Integration Priority And Execution Matrix

            Current gate posture remains `withheld` because seq_020 still reports the Phase 0 foundation entry gate as blocked on external readiness. This pack closes the ordering gap by separating mock-now execution from later live-provider acquisition without flattening proof or degraded-mode law.

            ## Summary

            - integration families: 15
            - source dependencies collapsed: 20
            - lane counts: {"hybrid_mock_then_live": 3, "actual_later": 2, "mock_now": 8, "deferred": 2}
            - baseline-role counts: {"baseline_required": 3, "optional_flagged": 2, "baseline_mock_required": 8, "deferred_channel": 1, "future_optional": 1}
            - divergence rows: 15

            ## Top Mock-Now Execution

            | Rank | Integration | Score | Lane | Why now |
| --- | --- | --- | --- | --- |
| 1 | Pharmacy dispatch proof and urgent-return seam | 251 | mock_now | The pharmacy loop cannot wait for live dispatch or monitored urgent-return routes before it proves frozen package hashes, transport ambiguity, redispatch, and urgent reopen behavior. |
| 2 | NHS login core identity rail | 251 | hybrid_mock_then_live | Phase 2 cannot defer auth transactions, route-intent binding, subject mismatch handling, or read-only versus writable recovery states until the partner onboarding completes. |
| 3 | Local booking provider capability and confirmation-truth seam | 246 | mock_now | Booking revalidation, confirmation ambiguity, waitlist fallback, and manage-freeze rules must be proven behind a simulator before any supplier path, pairing, or portal credential becomes current. |
| 4 | Pharmacy outcome observation and reconciliation seam | 242 | mock_now | Outcome replay, weak correlation, manual review, and reopened-for-safety behavior are canonical control problems and must be testable before the live assured observation path exists. |
| 5 | Telephony capture, transcript, and artifact-safety backplane | 240 | mock_now | Telephony parity is baseline law and the product cannot wait for live carrier, recording, transcript, or scanning accounts before it proves IVR choreography, evidence readiness, and urgent fallback states. |
| 6 | Network capacity and practice-acknowledgement seam | 218 | mock_now | Hub choice, callback fallback, practice visibility debt, and acknowledgement overdue states must be available to product and platform teams before real partner feeds or practice routes exist. |
| 7 | Cross-organisation secure messaging and MESH seam | 218 | hybrid_mock_then_live | Hub, practice, and pharmacy message flows need replay-safe transport proof, ambiguity, and escalation behavior now even though live mailbox or certificate onboarding will lag. |
| 8 | IM1 pairing and capability-governance prerequisite seam | 194 | hybrid_mock_then_live | The programme needs a governed capability-matrix seam and explicit blocked states now so booking and identity work stay decoupled from live supplier pairing while the long-lead onboarding runs. |

            ## Top Actual-Provider Strategy Later

            | Rank | Integration | Score | Lane | Why later |
| --- | --- | --- | --- | --- |
| 1 | Pharmacy dispatch proof and urgent-return seam | 263 | mock_now | Real monitored routes, transport assurance, and professional escalation contacts are later onboarding work, but the simulator must already preserve their proof versus ambiguity law. |
| 2 | NHS login core identity rail | 253 | hybrid_mock_then_live | Current-baseline authenticated and recovery-grade patient authority still depends on real redirect inventory, partner approval, and live session proof before the rail is admissible. |
| 3 | Local booking provider capability and confirmation-truth seam | 249 | mock_now | Live patient-facing booking still needs provider-path evidence, pairing readiness, and exact confirmation proof before it can move beyond simulator-backed development. |
| 4 | Telephony capture, transcript, and artifact-safety backplane | 243 | mock_now | Live numbers, recording retention, transcript handling, and scanner placement all carry contract, privacy, and safety review before they become production truth. |
| 5 | Pharmacy outcome observation and reconciliation seam | 236 | mock_now | Real Update Record or equivalent inbound observation routes need assured combinations and correlation evidence later, but they do not remove the need for a replay-safe mock seam now. |
| 6 | Cross-organisation secure messaging and MESH seam | 231 | hybrid_mock_then_live | Real mailboxes, certificates, minimum-necessary payload review, and cross-org approvals are later work that should start early but must not stall simulator-backed implementation. |
| 7 | Network capacity and practice-acknowledgement seam | 219 | mock_now | Live partner feeds and practice acknowledgements still need data-sharing and trust review before they can drive patient-visible offers or closable hub outcomes. |
| 8 | IM1 pairing and capability-governance prerequisite seam | 210 | hybrid_mock_then_live | IM1 and SCAL readiness are still required before live supplier capability claims are admissible for booking reach, but the corpus explicitly keeps this out of the Phase 2 identity critical path. |

            ## Full Matrix

            | Integration | Baseline role | Lane | Mock rank | Live rank | Source dependencies | Later tasks |
| --- | --- | --- | --- | --- | --- | --- |
| Pharmacy dispatch proof and urgent-return seam | baseline_mock_required | mock_now | 1 | 1 | dep_pharmacy_referral_transport, dep_pharmacy_urgent_return_professional_routes | seq_022, seq_037, seq_038, seq_039, seq_040 |
| NHS login core identity rail | baseline_required | hybrid_mock_then_live | 2 | 2 | dep_nhs_login_rail | seq_022, seq_023, seq_024, seq_025, seq_039, seq_040 |
| Local booking provider capability and confirmation-truth seam | baseline_mock_required | mock_now | 3 | 3 | dep_gp_system_supplier_paths, dep_local_booking_supplier_adapters | seq_022, seq_026, seq_036, seq_038, seq_039, seq_040 |
| Pharmacy outcome observation and reconciliation seam | baseline_mock_required | mock_now | 4 | 5 | dep_pharmacy_outcome_observation | seq_022, seq_037, seq_038, seq_039, seq_040 |
| Telephony capture, transcript, and artifact-safety backplane | baseline_mock_required | mock_now | 5 | 4 | dep_telephony_ivr_recording_provider, dep_transcription_processing_provider, dep_malware_scanning_provider | seq_022, seq_023, seq_031, seq_032, seq_034, seq_035, seq_038, seq_039, seq_040 |
| Network capacity and practice-acknowledgement seam | baseline_mock_required | mock_now | 6 | 7 | dep_network_capacity_partner_feeds, dep_origin_practice_ack_rail | seq_022, seq_036, seq_038, seq_039, seq_040 |
| Cross-organisation secure messaging and MESH seam | baseline_mock_required | hybrid_mock_then_live | 7 | 6 | dep_cross_org_secure_messaging_mesh | seq_022, seq_023, seq_028, seq_038, seq_039, seq_040 |
| IM1 pairing and capability-governance prerequisite seam | baseline_required | hybrid_mock_then_live | 8 | 8 | dep_im1_pairing_programme | seq_022, seq_023, seq_026, seq_036, seq_039, seq_040 |
| Pharmacy directory and patient-choice seam | baseline_mock_required | mock_now | 9 | 9 | dep_pharmacy_directory_dohs | seq_022, seq_037, seq_038, seq_039, seq_040 |
| Email and secure-link notification rail | baseline_mock_required | mock_now | 10 | 10 | dep_email_notification_provider | seq_022, seq_023, seq_031, seq_033, seq_038, seq_039, seq_040 |
| SMS continuation delivery rail | optional_flagged | actual_later | 11 | 11 | dep_sms_notification_provider | seq_022, seq_031, seq_033, seq_039, seq_040 |
| NHS standards and assurance source watch | baseline_required | mock_now | 12 | 15 | dep_nhs_assurance_and_standards_sources | seq_039, seq_040 |
| NHS App embedded-channel ecosystem | deferred_channel | deferred | 13 | 12 | dep_nhs_app_embedded_channel_ecosystem | seq_029, seq_030, seq_040 |
| Assistive model-vendor boundary | future_optional | deferred | 14 | 13 | dep_assistive_model_vendor_family | seq_040 |
| Optional PDS enrichment seam | optional_flagged | actual_later | 15 | 14 | dep_pds_fhir_enrichment | seq_022, seq_023, seq_027, seq_040 |

            ## Sequencing For Tasks 022-040

            | Task group | Tasks | Impacted integrations | Why now |
| --- | --- | --- | --- |
| Scorecards And Secret Posture | seq_022, seq_023 | int_identity_nhs_login_core, int_identity_pds_optional_enrichment, int_telephony_capture_evidence_backplane, int_sms_continuation_delivery, int_email_notification_delivery, int_im1_pairing_and_capability_prereq, int_local_booking_provider_truth, int_network_capacity_and_practice_ack, int_cross_org_secure_messaging, int_pharmacy_directory_and_choice, int_pharmacy_dispatch_and_urgent_return, int_pharmacy_outcome_reconciliation | Freeze selection criteria, secret classes, and owner law before live onboarding scripts or vendor consoles appear. |
| NHS Login Long Lead | seq_024, seq_025 | int_identity_nhs_login_core | NHS login is the only current-baseline identity rail that stays on the critical path for authenticated and recovery-grade patient authority. |
| NHS And Partner Approvals | seq_026, seq_027, seq_028, seq_029, seq_030 | int_im1_pairing_and_capability_prereq, int_local_booking_provider_truth, int_identity_pds_optional_enrichment, int_cross_org_secure_messaging, int_nhs_app_embedded_channel | Start long-lead NHS, interoperability, and deferred-channel approvals without letting those tracks erase the mock-first execution posture. |
| Commercial Vendor Onboarding | seq_031, seq_032, seq_033, seq_034, seq_035 | int_telephony_capture_evidence_backplane, int_sms_continuation_delivery, int_email_notification_delivery | Telephony, notifications, transcription, and scanning need scorecards and account plans, but live credentials may trail the simulator-first engineering path. |
| Provider Discovery And Freeze | seq_036, seq_037, seq_038, seq_039, seq_040 | int_im1_pairing_and_capability_prereq, int_local_booking_provider_truth, int_network_capacity_and_practice_ack, int_pharmacy_directory_and_choice, int_pharmacy_dispatch_and_urgent_return, int_pharmacy_outcome_reconciliation, int_telephony_capture_evidence_backplane, int_email_notification_delivery, int_cross_org_secure_messaging, int_identity_nhs_login_core, int_sms_continuation_delivery, int_standards_and_assurance_watch, int_identity_pds_optional_enrichment, int_nhs_app_embedded_channel, int_assistive_vendor_boundary | Provider-path discovery, simulator backlog, manual checkpoints, and degraded-mode defaults turn raw dependency awareness into executable delivery law. |

            ## Gate Linkage

            - `GATE_P0_FOUNDATION_ENTRY`: Planning and architecture foundation are frozen enough to open external-readiness work, but actual Phase 0 entry remains withheld because the current-baseline external-readiness gate is still blocked by onboarding, assurance, and simulator-freeze dependencies.
            - `GATE_EXTERNAL_TO_FOUNDATION`: remains the active downstream gate that seq_021-seq_040 must clear before Phase 0 entry can move from `withheld`.
            - `seq_021` consequence: later tasks no longer need to re-argue whether a family is current-baseline, mock-first, actual-later, deferred, or optional.
