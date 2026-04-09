# 24 NHS Login Application Dossier

        The dossier is the canonical field-level input model shared by the mock twin, the live dry-run harness, and the validation script.

        ## Section A — `Mock_now_execution`

        In mock mode every field has either a synthetic seeded value or an explicit blank that demonstrates why live progression must remain blocked.

        ## Section B — `Actual_provider_strategy_later`

        In actual later mode each field has an explicit capture contract so the team knows exactly what still has to become real.

        | Field id | Section | Label | Mock seed | Actual capture contract |
        | --- | --- | --- | --- | --- |
        | `fld_service_name` | Service identity | Service name | Vecells | Partner-facing product name exactly as submitted in application and sandpit forms. |
| `fld_service_summary` | Service identity | Service summary | FHIR-native primary care access and operations layer that routes patient demand into one safety-gated request pipeline. | Public-facing product summary used in the application and product demo. |
| `fld_patient_eligibility` | Eligibility and sponsorship | Patient eligibility statement | Vecells serves patients registered at GP practices in England or receiving NHS services in England. | Exact wording used to justify NHS login eligibility. |
| `fld_commissioner_posture` | Eligibility and sponsorship | Commissioner or sponsor posture | ASSUMPTION_NHS_LOGIN_SPONSOR_PLACEHOLDER: commissioner and sponsor are not yet named; current pack preserves placeholder-only governance and blocks live progression. | Named commissioner, NHS sponsor, or explicit commissioning discussion status. |
| `fld_sponsor_contact` | Eligibility and sponsorship | Sponsor contact placeholder | TBD sponsor owner - blocked until NHS commissioner or sponsor is confirmed. | Named sponsor or commissioner contact. |
| `fld_route_families` | Product logic | Patient route families | Public request intake, authenticated status tracking, request claim and resume, booking manage, pharmacy follow-up, and conversation or callback follow-up. | Route-family inventory exactly mapped to user journeys shown in demo and dossier. |
| `fld_identity_boundary` | Product logic | Identity and session boundary | NHS login authenticates the patient and returns claims. Vecells still decides local session creation, route intent, access grant redemption, writable authority, and same-shell recovery. | Production wording for partner onboarding and architecture review. |
| `fld_user_journeys` | User journey pack | User journey inventory | Registration allow-share, registration deny-share, repeat sign-in, settings-link return, P5 navigation, P9 uplift, and delegated-access placeholder. | Current product journey inventory used in product demo and SCAL artefacts. |
| `fld_architecture_summary` | Architecture pack | Architecture diagram narrative | Client-first React shell, gateway-managed browser boundary, dual-UK-region runtime, identity bridge, event spine, audit and release parity controls. | Updated architecture narrative used with the submitted diagram. |
| `fld_data_flow_summary` | Architecture pack | Data flow diagram narrative | Claims from NHS login enter the identity bridge, settle into local session and route-intent decisions, then drive bounded patient actions and downstream notification, booking, or pharmacy adapters. | Updated data-flow narrative used with the submitted diagram. |
| `fld_demo_team` | Demo readiness | Demo attendees | Product lead, technical architect, security lead, privacy lead, clinical safety owner, and sponsor placeholder. | Named attendees for the preparation and product demonstration calls. |
| `fld_demo_script_ref` | Demo readiness | Demo walkthrough script | 24_demo_walkthrough_internal_v1 | Current demo script or rehearsal recording reference. |
| `fld_sandpit_friendly_name` | Sandpit request | Sandpit friendly service name | Vecells Partner Access Atelier | Exact friendly name for the sandpit environment request form. |
| `fld_redirect_uri_primary` | Sandpit request | Primary redirect URI | https://vecells.example/mock/callback/nhs-login | Current callback URI registered for the chosen environment. |
| `fld_public_key_ref` | Sandpit request | Public key bundle reference | PUBKEY_VECELLS_NHS_LOGIN_NONPROD_01 | Public key bundle and custody reference to submit. |
| `fld_scopes_claims_summary` | Sandpit request | Scopes and claims summary | openid profile email phone profile_extended (placeholder only), with route-family checks enforcing least-necessary use and local authorization after callback. | Current scope and claims request matrix by route family. |
| `fld_vector_of_trust_profile` | Sandpit request | Vector of trust posture | P5 for low-risk signed-in portal continuity and P9 for PHI-bearing request ownership, booking manage, and pharmacy follow-up; final route matrix remains governed by local capability and session law. | Final VoT matrix agreed during product demonstration. |
| `fld_integration_target_date` | Integration planning | Indicative go-live target | ASSUMPTION_NHS_LOGIN_GO_LIVE_WINDOW: no live date is proposed until sponsor, MVP, and approvals exist. | Nominal target date agreed after product demo. |
| `fld_dspt_status` | Assurance | DSPT status | Not yet published for live scope; mock dossier tracks placeholder only. | In-year DSPT status covering NHS login service scope. |
| `fld_privacy_notice_ref` | Assurance | Privacy notice reference | PRIVACY_NOTICE_VECELLS_NHS_LOGIN_DRAFT | Published NHS login-compliant privacy notice reference. |
| `fld_clinical_safety_owner` | Assurance | Clinical safety owner | ROLE_MANUFACTURER_CSO placeholder - evidence bundle not yet signed. | Named Clinical Safety Officer and supporting sign-off references. |
| `fld_connection_signatory` | Commercial and legal | Connection agreement signatory | TBD signatory - blocked until commissioner or product ownership model is confirmed. | Named signatory or commissioner-owner for the connection agreement. |
| `fld_service_desk_contacts` | Operations handoff | Service desk registration contacts | Operations lead, support lead, incident manager, and out-of-hours escalation placeholders only. | Current Service Bridge registration contacts and escalation details. |
| `fld_named_approver` | Live submission gates | Named approver | (blank) | Named approver required before any live portal mutation. |
| `fld_environment_target` | Live submission gates | Environment target | (blank) | sandpit | integration | production |
| `fld_live_mutation_flag` | Live submission gates | Live mutation flag | false | ALLOW_REAL_PROVIDER_MUTATION=true |
