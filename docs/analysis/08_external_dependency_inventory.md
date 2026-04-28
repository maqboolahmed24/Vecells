# 08 External Dependency Inventory

        Vecells now has one authoritative external-dependency inventory covering 20 dependencies, 22 touchpoint resolutions, 2 explicit internal exclusions, and 12 browser-automation backlog rows.

        ## Inventory Summary

        - Baseline-required dependencies: 16
        - Optional-flagged dependencies: 2
        - Deferred Phase 7 dependencies: 1
        - Future-optional dependencies: 1
        - Browser-automation candidates: 10

        ## Inventory Table

        | Dependency ID | Name | Class | Scope | Layer | Touchpoints | Browser Automation |
| --- | --- | --- | --- | --- | --- | --- |
| dep_nhs_login_rail | NHS login authentication rail | identity_auth | baseline_required | channel_partner_surface | ext_nhs_login | yes |
| dep_pds_fhir_enrichment | Optional PDS enrichment seam | patient_data_enrichment | optional_flagged | optional_feature_flagged | inventory_only | yes |
| dep_telephony_ivr_recording_provider | Telephony, IVR, and call-recording provider | telephony | baseline_required | transport_message_rail | ext_telephony_and_ivr_provider | yes |
| dep_transcription_processing_provider | Transcript and derived-facts processing provider | transcription | baseline_required | supplier_specific_adapter | ext_artifact_store_and_scan | yes |
| dep_sms_notification_provider | SMS delivery provider | sms | optional_flagged | optional_feature_flagged | ext_secure_link_and_notification_rail, ext_message_delivery_provider | yes |
| dep_email_notification_provider | Email and notification delivery provider | email | baseline_required | transport_message_rail | ext_secure_link_and_notification_rail, ext_message_delivery_provider | yes |
| dep_malware_scanning_provider | Malware and artifact scanning provider | malware_scanning | baseline_required | security_assurance_dependency | ext_artifact_store_and_scan | yes |
| dep_im1_pairing_programme | IM1 Pairing programme and prerequisite path | gp_system | baseline_required | security_assurance_dependency | ext_booking_supplier_adapter | yes |
| dep_gp_system_supplier_paths | Principal GP-system supplier integration paths | gp_system | baseline_required | supplier_specific_adapter | ext_booking_supplier_adapter | no |
| dep_local_booking_supplier_adapters | Local booking supplier adapter family | booking_supplier | baseline_required | supplier_specific_adapter | ext_booking_supplier_adapter | no |
| dep_network_capacity_partner_feeds | Network and hub partner capacity feeds | booking_supplier | baseline_required | supplier_specific_adapter | ext_network_booking_adapter | no |
| dep_cross_org_secure_messaging_mesh | Cross-organisation secure messaging rail including MESH | messaging_transport | baseline_required | transport_message_rail | ext_practice_ack_delivery_rail, ext_pharmacy_dispatch_transport | yes |
| dep_origin_practice_ack_rail | Origin-practice acknowledgement rail | messaging_transport | baseline_required | transport_message_rail | ext_practice_ack_delivery_rail | no |
| dep_pharmacy_directory_dohs | Pharmacy directory and discovery dependency | pharmacy_directory | baseline_required | clinical_platform_rail | ext_pharmacy_directory | no |
| dep_pharmacy_referral_transport | Pharmacy referral transport dependency | pharmacy_transport | baseline_required | transport_message_rail | ext_pharmacy_dispatch_transport | no |
| dep_pharmacy_outcome_observation | Pharmacy outcome observation and reconciliation path | pharmacy_outcome | baseline_required | supplier_specific_adapter | ext_pharmacy_outcome_ingest | no |
| dep_pharmacy_urgent_return_professional_routes | Pharmacy urgent-return and professional-contact routes | messaging_transport | baseline_required | transport_message_rail | ext_pharmacy_outcome_ingest | no |
| dep_nhs_app_embedded_channel_ecosystem | NHS App embedded-channel ecosystem | embedded_channel | deferred_phase7 | deferred_channel_expansion | ext_embedded_host_bridge | yes |
| dep_assistive_model_vendor_family | Assistive model vendor and subprocessor family | model_vendor | future_optional | optional_feature_flagged | inventory_only | no |
| dep_nhs_assurance_and_standards_sources | NHS standards and assurance source set | content_or_standards_source | baseline_required | security_assurance_dependency | inventory_only | no |

        ## Required Closures

        - Supplier, messaging, pharmacy, and embedded-channel dependencies are now in one stable inventory instead of scattered prose.
        - Every dependency names authoritative proof, non-authoritative signals, ambiguity modes, and degraded fallback posture.
        - Optional and deferred boundaries are explicit: optional PDS enrichment, optional assistive model vendors, and deferred NHS App embedded-channel scope are separated from current baseline blockers.
        - Future provisioning is prepared without provisioning any service in this task.
