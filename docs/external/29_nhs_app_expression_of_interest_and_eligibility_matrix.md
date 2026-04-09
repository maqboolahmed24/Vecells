# 29 NHS App Expression Of Interest And Eligibility Matrix

        This matrix turns the current NHS App EOI and eligibility rules into machine-readable rows while keeping the deferred channel posture explicit.

        ## Eligibility matrix

        | Criterion ID | Criterion | Mock now | Actual later | Fields | Notes |
        | --- | --- | --- | --- | --- | --- |
        | crit_patient_population_england | Serves patients registered with GP or secondary care services in England | evidenced | review_required | q06_gp_patients_in_england;q07_secondary_care_patients;q08_user_population | Product scope supports England patient populations, but real commissioning detail stays later-gated. |
| crit_patient_facing_personalised | Provides a patient-facing personalised service, not generic health information | evidenced | evidenced | q03_product_overview;q13_service_categories | The route inventory is patient-personalised and same-portal. |
| crit_free_at_point_of_delivery | Free to patient at point of delivery | evidenced | review_required | q11_free_at_point_of_delivery | Modelled as yes, but real commercial or local charging evidence remains outside the repo. |
| crit_commissioned_in_england | Commissioned by NHS body or local authority in England | gap_captured | blocked | q14_commissioned_by_nhs_body;q15_commissioning_detail | Current pack keeps commissioner posture explicit instead of inventing it. |
| crit_procurement_framework_alignment | Aligned to at least one recognised procurement framework | gap_captured | review_required | q16_procurement_frameworks;q17_framework_application_detail | Framework status is modelled as dossier evidence, not assumed. |
| crit_nhs_login_enabled_or_approved | Integrated with NHS login or approved for NHS login integration | evidenced | review_required | q18_nhs_login_posture;q19_nhs_login_client_id | Seq_024/025 created the prerequisite strategy, but real live approval remains gated. |
| crit_standards_commitment | Can meet NHS App standards and requirements | evidenced | review_required | q35_standards_commitment | The commitment is modelled now; fresh signed evidence remains later. |
| crit_public_service_desk | Public-facing service desk exists | gap_captured | review_required | q12_public_service_desk | The operating model is modelled, but public-facing evidence remains a live-gate concern. |
| crit_demo_environment | Demo environment available to NHS App team | evidenced | review_required | q21_demo_environment_available;int06_demo_environment_url | Mock environment exists now; real-accessible environment remains later-gated. |
| crit_recent_user_research | Recent user research | gap_captured | review_required | q22_user_research_recent | Placeholder kept visible rather than silently omitted. |
| crit_recent_accessibility_audit | Recent WCAG accessibility audit | gap_captured | review_required | q23_accessibility_audit_recent;q24_accessibility_outcome | The pack plans the audit and evidence lane, but does not fabricate an audit outcome. |
| crit_dedicated_design_resource | Dedicated design resource during integration | gap_captured | review_required | q35_standards_commitment | Explicitly recorded as a requirement in the live gate. |
| crit_dedicated_development_resource | Dedicated development team during integration | gap_captured | review_required | q35_standards_commitment | Explicitly recorded as a requirement in the live gate. |
| crit_one_portal_two_shells | One portal, two shells, zero forks | evidenced | pass | int01_solution_design_doc;int02_embedded_route_manifest_hash | This closes the separate-product gap. |
| crit_deferred_scope_boundary | Deferred NHS App channel does not become current-baseline scope | evidenced | blocked_until_scope_window | q27_primary_channel;int09_limited_release_target | The rehearsal studio is explicitly future-channel preparation only. |
| crit_embedded_route_parity | Embedded preview stays on the same route families as standalone web | evidenced | pass | int02_embedded_route_manifest_hash;int05_secure_return_contract | The preview routes are tied to canonical route families and return contracts. |
| crit_webview_safe_artifact_behaviour | Embedded artifact and error behaviour stays webview-safe | evidenced | pass | int03_bridge_capability_matrix;int05_secure_return_contract | Print is never assumed and file download is gated to byte-safe delivery. |

        ## Field map

        | Question | Field ID | Label | Section | Kind | Required | Default |
        | --- | --- | --- | --- | --- | --- | --- |
        | 1 | q01_company_name | Company name | contact_information | text | True | Vecells |
| 2 | q02_product_service_name | Product or service name | contact_information | text | True | Vecells patient portal (embedded rehearsal) |
| 3 | q03_product_overview | Product overview | contact_information | textarea | True | Responsive patient portal for requests, status, booking, and pharmacy follow-up. This rehearsal pack preserves one portal with a deferred embedded shell rather than a separate NHS App product. |
| 4 | q04_named_contact | Named contact | contact_information | text | True | ROLE_EMBEDDED_CHANNEL_LEAD |
| 5 | q05_contact_email | Contact email | contact_information | text | True | embedded.channel@vecells.example |
| 6 | q06_gp_patients_in_england | Serves patients registered at GP surgeries in England | product_functionality | select | True | yes |
| 7 | q07_secondary_care_patients | Serves patients receiving secondary care services in England | product_functionality | select | True | yes |
| 8 | q08_user_population | User population | product_functionality | textarea | True | Patients in England using one portal for intake, status, appointments, record views, messages, and deferred embedded-channel reuse. |
| 9 | q09_registered_patients | Registered patient count | product_functionality | text | True | pilot_placeholder |
| 10 | q10_active_users | Active patient count | product_functionality | text | True | pilot_placeholder |
| 11 | q11_free_at_point_of_delivery | Free to patient at point of delivery | product_functionality | select | True | yes |
| 12 | q12_public_service_desk | Public-facing service desk | product_functionality | select | True | planned |
| 13 | q13_service_categories | NHS App service categories | product_functionality | textarea | True | Medical query; Admin query; Appointments; Personal Health Records; Notifications and Messaging |
| 14 | q14_commissioned_by_nhs_body | Commissioned by NHS body or local authority in England | product_functionality | select | True | to_be_confirmed |
| 15 | q15_commissioning_detail | Commissioning detail | product_functionality | textarea | False | Commissioning bodies and connected organisations remain placeholders until scope window opens. |
| 16 | q16_procurement_frameworks | Procurement framework posture | product_functionality | textarea | True | Framework and procurement posture to be evidenced during real-later dossier completion. |
| 17 | q17_framework_application_detail | Framework application detail | product_functionality | textarea | False | placeholder |
| 18 | q18_nhs_login_posture | NHS login posture | product_functionality | select | True | integrating |
| 19 | q19_nhs_login_client_id | NHS login ClientID | product_functionality | text | False | placeholder_client_id_later |
| 20 | q20_application_type | Application type | technical | select | True | web_application |
| 21 | q21_demo_environment_available | Demo environment available | technical | select | True | yes |
| 22 | q22_user_research_recent | User research in last 12 months | design_delivery | select | True | planned |
| 23 | q23_accessibility_audit_recent | WCAG 2.1 or 2.2 accessibility audit in last 12 months | design_delivery | select | True | planned |
| 24 | q24_accessibility_outcome | Accessibility audit outcome | design_delivery | textarea | False | Audit result placeholder retained until a fresh WCAG 2.2 audit is commissioned. |
| 25 | q25_message_types | Message types | messaging | textarea | False | Individual messages; Message with reply option; Message with link to onward journey; Time-sensitive messages |
| 26 | q26_message_use_cases | Message use cases | messaging | textarea | False | Responses to patient requests; appointment confirmations; questionnaires |
| 27 | q27_primary_channel | NHS App primary communication channel | messaging | select | False | no |
| 28 | q28_primary_channel_if_no | Primary channel if not NHS App | messaging | text | False | browser_web_patient_portal |
| 29 | q29_multichannel_policy | Multi-channel communication policy | messaging | textarea | False | NHS App remains a deferred embedded channel. Email, SMS, letter, and browser surfaces stay governed by route family, communication envelope, and degraded-mode policy. |
| 30 | q30_average_daily_messages | Average daily message volume | messaging | text | False | volume_placeholder |
| 31 | q31_peak_daily_messages | Peak single-day message volume | messaging | text | False | volume_placeholder |
| 32 | q32_peak_tps | Average and peak throughput per second | messaging | text | False | tps_placeholder |
| 33 | q33_message_pattern | Message sending pattern | messaging | textarea | False | Pattern placeholder retained for later operational modelling. |
| 34 | q34_message_volume_change | Expected message volume change over next year | messaging | textarea | False | Volume-change placeholder retained until limited-release planning is explicit. |
| 35 | q35_standards_commitment | Standards and delivery commitment confirmed | read_and_commit | select | True | planned |
| internal | int01_solution_design_doc | Solution design dossier ref | internal_design | text | True | docs/external/29_nhs_app_onboarding_strategy.md |
| internal | int02_embedded_route_manifest_hash | Embedded route manifest hash | internal_design | text | True | manifest_placeholder_v1 |
| internal | int03_bridge_capability_matrix | Bridge capability matrix ref | internal_design | text | True | bridge_matrix_preview_v1 |
| internal | int04_hidden_header_review | Hidden supplier header review | internal_design | select | True | complete |
| internal | int05_secure_return_contract | Secure return contract | internal_design | text | True | safe_return_contract_v1 |
| internal | int06_demo_environment_url | Demo environment URL | internal_delivery | text | True | http://127.0.0.1:4180/ |
| internal | int07_sandpit_target | Sandpit target environment | internal_delivery | text | True | sandpit_placeholder.vecells.example |
| internal | int08_aos_target | AOS target environment | internal_delivery | text | True | aos_placeholder.vecells.example |
| internal | int09_limited_release_target | Limited release cohort | internal_delivery | text | True | limited_release_placeholder |
| internal | int10_monthly_data_owner | Monthly data owner | internal_delivery | text | True | ROLE_EMBEDDED_CHANNEL_LEAD |
| internal | int11_annual_assurance_owner | Annual assurance owner | internal_delivery | text | True | ROLE_PROGRAMME_ARCHITECT |

        ## Interpretation rules

        - `mock_now_status = evidenced` means the rehearsal pack can capture or simulate the data now.
        - `actual_later_status = blocked` means the real provider path must fail closed until the evidence exists outside the repo.
        - Internal fields extend the official EOI so solution design, manifest, bridge, release, and post-live obligations stay connected to the same dossier.
