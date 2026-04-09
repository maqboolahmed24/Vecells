# 08 External Dependency Taxonomy

        ## Class Summary

        | Dependency Class | Count |
| --- | --- |
| booking_supplier | 2 |
| content_or_standards_source | 1 |
| email | 1 |
| embedded_channel | 1 |
| gp_system | 2 |
| identity_auth | 1 |
| malware_scanning | 1 |
| messaging_transport | 3 |
| model_vendor | 1 |
| patient_data_enrichment | 1 |
| pharmacy_directory | 1 |
| pharmacy_outcome | 1 |
| pharmacy_transport | 1 |
| sms | 1 |
| telephony | 1 |
| transcription | 1 |

        ## Layer Summary

        | Layer | Count |
| --- | --- |
| channel_partner_surface | 1 |
| clinical_platform_rail | 1 |
| deferred_channel_expansion | 1 |
| optional_feature_flagged | 3 |
| security_assurance_dependency | 3 |
| supplier_specific_adapter | 5 |
| transport_message_rail | 6 |

        ## Touchpoint Resolution

        | Touchpoint | Touchpoint Name | Resolved Dependencies / Exclusions |
| --- | --- | --- |
| ext_nhs_login | NHS login rail | dep_nhs_login_rail |
| ext_secure_link_and_notification_rail | Secure-link and notification delivery rail | dep_sms_notification_provider<br>dep_email_notification_provider<br>excl_secure_link_tokens_internal |
| ext_telephony_and_ivr_provider | Telephony and IVR provider | dep_telephony_ivr_recording_provider |
| ext_artifact_store_and_scan | Binary artifact storage and malware / readiness processing | dep_malware_scanning_provider<br>dep_transcription_processing_provider<br>excl_private_artifact_storage_internal |
| ext_message_delivery_provider | Asynchronous messaging delivery provider | dep_sms_notification_provider<br>dep_email_notification_provider |
| ext_booking_supplier_adapter | Local booking supplier adapter | dep_im1_pairing_programme<br>dep_gp_system_supplier_paths<br>dep_local_booking_supplier_adapters |
| ext_network_booking_adapter | Cross-site or hub booking adapter | dep_network_capacity_partner_feeds |
| ext_practice_ack_delivery_rail | Practice acknowledgement delivery rail | dep_cross_org_secure_messaging_mesh<br>dep_origin_practice_ack_rail |
| ext_pharmacy_directory | Pharmacy directory / discovery API | dep_pharmacy_directory_dohs |
| ext_pharmacy_dispatch_transport | Pharmacy referral transport adapter | dep_cross_org_secure_messaging_mesh<br>dep_pharmacy_referral_transport |
| ext_pharmacy_outcome_ingest | Structured pharmacy outcome ingest or agreed local return channel | dep_pharmacy_outcome_observation<br>dep_pharmacy_urgent_return_professional_routes |
| ext_embedded_host_bridge | Trusted embedded host bridge | dep_nhs_app_embedded_channel_ecosystem |

        ## Internal Exclusions

        | Exclusion ID | Touchpoint | Summary | Reason |
| --- | --- | --- | --- |
| excl_secure_link_tokens_internal | ext_secure_link_and_notification_rail | Secure-link token issuance is internal | The external dependency here is delivery via SMS or email. AccessGrant issuance, secure-link redemption, and route-authority fencing stay on the internal command plane. |
| excl_private_artifact_storage_internal | ext_artifact_store_and_scan | Private object storage remains an internal platform service | The touchpoint includes storage, scanning, and readiness processing, but this inventory treats only scanning and transcription as external dependencies. Private quarantine storage stays inside the platform trust boundary. |

        ## Scope Alignment

        - `dep_pds_fhir_enrichment` is locked to `optional_flagged`.
        - `dep_nhs_app_embedded_channel_ecosystem` is locked to `deferred_phase7`.
        - `dep_assistive_model_vendor_family` is locked to `future_optional`.
        - No dependency is allowed to bypass `AdapterContractProfile` or the browser-termination rules from the runtime blueprint.
