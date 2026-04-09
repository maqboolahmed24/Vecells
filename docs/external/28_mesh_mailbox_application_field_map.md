# 28 Mesh Mailbox Application Field Map

Section A — `Mock_now_execution`

The mock-now pack carries placeholder-safe fields for ownership, route traceability, and proof class selection so the team can rehearse application and workflow-request preparation without real provider mutation.

Section B — `Actual_provider_strategy_later`

The live-later dossier binds the public mailbox and workflow-request forms to Vecells governance fields.

## Apply for a MESH mailbox

| field_id | label | origin_class | required_mode | value_examples | purpose |
| --- | --- | --- | --- | --- | --- |
| fld_mailbox_environment | Mailbox required | official_mailbox_form | actual_provider_strategy_later | live | path_to_live_integration | path_to_live_deployment | Select the environment requested on the mailbox form. |
| fld_organisation_type | Organisation type | official_mailbox_form | actual_provider_strategy_later | health_authority | nhs_trust | gp_practice | system_supplier | other | Record the owner organisation type for mailbox creation. |
| fld_owner_ods | Organisation Data Service code of the organisation that owns the mailbox | official_mailbox_form | mock_now_and_actual_later | VEC01 | Capture mailbox ownership ODS identity. |
| fld_org_contact_name | Organisation contact name | official_mailbox_form | actual_provider_strategy_later | Named representative | Name the nominated representative for the mailbox. |
| fld_org_contact_phone | Contact telephone number | official_mailbox_form | actual_provider_strategy_later | +44 20 7946 0000 | Provide mailbox administrative contact telephone details. |
| fld_org_contact_email | Contact email address | official_mailbox_form | actual_provider_strategy_later | interop.owner@example.invalid | Provide mailbox administrative contact email. |
| fld_third_party_manage_flag | Is mailbox managed by a 3rd party | official_mailbox_form | actual_provider_strategy_later | true | false | Declare whether a third party manages the mailbox on behalf of the owner. |
| fld_third_party_name | 3rd party organisation name | official_mailbox_form | conditional_actual_provider_strategy_later | Vecells interoperability delivery | Name the managing third party when mailbox management is delegated. |
| fld_third_party_ods | 3rd party Organisation Data Service code | official_mailbox_form | conditional_actual_provider_strategy_later | VEC01 | Capture the managing third party ODS code when relevant. |
| fld_third_party_contact_name | 3rd party organisation nominated contact | official_mailbox_form | conditional_actual_provider_strategy_later | Partner mailbox manager | Name the managing third-party contact. |
| fld_third_party_contact_phone | 3rd party organisation contact telephone number | official_mailbox_form | conditional_actual_provider_strategy_later | +44 20 7946 0100 | Provide third-party manager telephone details. |
| fld_third_party_contact_email | 3rd party organisation contact email | official_mailbox_form | conditional_actual_provider_strategy_later | mesh.manager@example.invalid | Provide third-party manager email details. |
| fld_nems_use | Is this mailbox for NEMS use | official_mailbox_form | actual_provider_strategy_later | false | Declare whether the mailbox is intended for NEMS messages. |
| fld_mesh_mailbox_type | Type of MESH mailbox you'll be using | official_mailbox_form | actual_provider_strategy_later | mesh_client | mesh_ui_hscn | mesh_ui_internet | mesh_api | Choose the MESH product shape for the mailbox. |
| fld_workflow_group_required | Workflow group required associating to your mailbox | official_mailbox_form | actual_provider_strategy_later | WG_HUB_PRACTICE_VISIBILITY | List the workflow group or groups needed for the mailbox application. |
| fld_data_usage_summary | What type of data will you be sending or receiving via MESH | official_mailbox_form | actual_provider_strategy_later | Practice continuity notices and pharmacy referral messages | Describe the transfer content at a MESH level. |
| fld_existing_mailbox_clone | A current mailbox ID that sends and receives similar data | official_mailbox_form | conditional_actual_provider_strategy_later | MAILBOX123 | Reference an existing mailbox when cloning a similar setup. |
| fld_approx_file_size | Approximate file sizes | official_mailbox_form | actual_provider_strategy_later | less_than_50mb | between_50_and_100mb | between_100mb_and_20gb | Declare expected transfer size. |
| fld_api_csr_subject | API only CSR subject common name | official_mailbox_form | conditional_actual_provider_strategy_later | SERVER001.VEC01.api.mesh-client.nhs.uk | Provide CSR subject when requesting Path to Live API testing. |
| fld_path_to_live_client_keystore | Client Path to Live keystore and password need | official_mailbox_form | conditional_actual_provider_strategy_later | integration keystore required | Track client-specific Path to Live access prerequisites. |
| fld_path_to_live_ui_smartcard | UI Path to Live smartcard need | official_mailbox_form | conditional_actual_provider_strategy_later | HSCN smartcard required | Track UI-specific Path to Live access prerequisites. |
| fld_pid_statement_acceptance | Statement on patient identifiable data acceptance | official_mailbox_form | actual_provider_strategy_later | true | Record the required acceptance of the patient identifiable data statement. |

## New workflow request or workflow amendment

| field_id | label | origin_class | required_mode | value_examples | purpose |
| --- | --- | --- | --- | --- | --- |
| fld_requester_name | Your name | official_workflow_request_form | conditional_actual_provider_strategy_later | Workflow requester | Identify the person raising the workflow request or amendment. |
| fld_requester_email | Email address | official_workflow_request_form | conditional_actual_provider_strategy_later | workflow.requester@example.invalid | Provide requester email for workflow request processing. |
| fld_requester_phone | Your telephone number | official_workflow_request_form | conditional_actual_provider_strategy_later | +44 20 7946 0200 | Provide requester phone for workflow request processing. |
| fld_workflow_request_type | Amendment to existing mailbox or new workflow request | official_workflow_request_form | conditional_actual_provider_strategy_later | amendment | new_workflow_request | Declare whether the workflow request is new or an amendment. |
| fld_existing_mailbox_ids_for_amendment | MESH mailbox IDs | official_workflow_request_form | conditional_actual_provider_strategy_later | MAILBOX123 | List existing mailbox IDs when the request is an amendment. |
| fld_mesh_team_contact | Name of MESH team or SPINE DevOps contact | official_workflow_request_form | conditional_actual_provider_strategy_later | Named MESH team contact | Record the prior liaison contact for new workflow requests. |
| fld_new_workflow_group_details | New workflow group details | official_workflow_request_form | conditional_actual_provider_strategy_later | Brief MESH transfer description and organisation pair | Describe the message or file transfer business flow for the requested group. |
| fld_new_workflow_id_details | New workflow ID details | official_workflow_request_form | conditional_actual_provider_strategy_later | Suggested workflow ID, initiator or responder posture, and brief transfer description | Describe each requested workflow ID and posture. |

## Vecells live gate dossier

| field_id | label | origin_class | required_mode | value_examples | purpose |
| --- | --- | --- | --- | --- | --- |
| fld_route_trace_refs | Traceable route family references | derived_internal_dossier | mock_now_and_actual_later | rf_hub_queue; rf_pharmacy_console | Bind the mailbox and workflow request to concrete Vecells route families. |
| fld_bounded_context_owner | Bounded context owner | derived_internal_dossier | mock_now_and_actual_later | hub_coordination | Name the owning bounded context for the workflow set. |
| fld_path_to_live_without_mailbox_decision | Path to Live without mailbox decision | derived_internal_dossier | mock_now_and_actual_later | local_sandbox_only | path_to_live_without_mailbox | mailbox_required_before_partner_test | Record whether rehearsal can progress without a mailbox request. |
| fld_named_approver | Named approver | derived_internal_dossier | actual_provider_strategy_later | ROLE_OPERATIONS_LEAD | Name the explicit approver for any real mailbox or workflow request. |
| fld_environment_target_confirmed | Environment target confirmed | derived_internal_dossier | actual_provider_strategy_later | path_to_live_integration | Confirm the exact target environment for the real request. |
| fld_allow_real_mutation | ALLOW_REAL_PROVIDER_MUTATION | derived_internal_dossier | actual_provider_strategy_later | false | Hard gate any real mailbox or workflow request submission. |
| fld_allow_spend | ALLOW_SPEND | derived_internal_dossier | actual_provider_strategy_later | false | Hard gate any path that could trigger managed-service or commercial cost. |
| fld_minimum_necessary_review | Minimum necessary payload review | derived_internal_dossier | actual_provider_strategy_later | Current payload minimisation review attached | Show that mailbox usage is tied to minimum-necessary content review. |
| fld_target_proof_class | Target proof class after send | derived_internal_dossier | mock_now_and_actual_later | PracticeAcknowledgementRecord | Force explicit proof-vs-acceptance reasoning per workflow row. |
| fld_live_api_onboarding_complete | Live API onboarding complete | derived_internal_dossier | actual_provider_strategy_later | false | Record the prerequisite called out by the mailbox form for live API mailbox requests. |
| fld_live_gate_bundle_ref | Live gate bundle reference | derived_internal_dossier | actual_provider_strategy_later | mesh_live_gate_checklist.json | Bind the dossier to the gate checklist and blocked status. |
