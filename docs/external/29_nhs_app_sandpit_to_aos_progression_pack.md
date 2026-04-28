# 29 NHS App Sandpit To AOS Progression Pack

        Sandpit and AOS are not interchangeable labels. The official NHS App process expects sandpit delivery and sign-off before the same discipline is repeated in AOS. This pack makes that ordering explicit.

        ## Progression rows

        | Stage ID | Stage | Category | Required documents | Blocking dependencies |
        | --- | --- | --- | --- | --- |
        | nhs_app_stage_eoi_eligibility | EOI eligibility and dossier prep | eligibility | Expression of interest dossier, Eligibility evidence pack, Deferred scope boundary guard, NHS login dependency summary | dep_nhs_app_embedded_channel_ecosystem, LIVE_GATE_PHASE7_SCOPE_WINDOW, LIVE_GATE_COMMISSIONING_EXPLICIT |
| nhs_app_stage_product_review | Product review and prioritisation | review | Demo environment brief, Recent user research pack, Dedicated design resource plan, Dedicated development resource plan | LIVE_GATE_COMMISSIONING_EXPLICIT, LIVE_GATE_PATIENT_ELIGIBILITY_EXPLICIT |
| nhs_app_stage_solution_design | Solution design and delivery commitment | design | Solution design document, Route manifest and jump-off inventory, Implementation approach document, NHS Service Support Guidance pack | dep_nhs_app_embedded_channel_ecosystem, FINDING_095 |
| nhs_app_stage_embedded_readiness | Embedded readiness preview | design | Embedded preview board, Route manifest and jump-off inventory | RISK_UI_002, dep_nhs_app_embedded_channel_ecosystem |
| nhs_app_stage_sandpit_delivery | Sandpit delivery rehearsal | sandpit | Demo environment brief, Embedded preview board, Incident rehearsal pack, Route manifest and jump-off inventory | LIVE_GATE_DEMO_ENVIRONMENT_READY, LIVE_GATE_ENVIRONMENT_TARGET_PRESENT |
| nhs_app_stage_sandpit_signoff | Sandpit demo sign-off | sandpit | Demo environment brief, Issue action log | nhs_app_stage_sandpit_delivery, LIVE_GATE_DEMO_ENVIRONMENT_READY |
| nhs_app_stage_aos_delivery | AOS delivery rehearsal | aos | Route manifest and jump-off inventory, Embedded preview board, Incident rehearsal pack, SCAL workspace and upload map | nhs_app_stage_sandpit_signoff, LIVE_GATE_ENVIRONMENT_TARGET_PRESENT |
| nhs_app_stage_aos_signoff | AOS demo sign-off | aos | SCAL workspace and upload map, Issue action log | nhs_app_stage_aos_delivery, LIVE_GATE_ACCESSIBILITY_EVIDENCE_READY |
| nhs_app_stage_scal_assurance | SCAL and assurance submission | assurance | SCAL workspace and upload map, Clinical safety bundle (DCB0129/DCB0160), Privacy and NHS service standard bundle, WCAG 2.2 accessibility audit | LIVE_GATE_ACCESSIBILITY_EVIDENCE_READY, LIVE_GATE_DESIGN_READINESS_READY |
| nhs_app_stage_connection_agreement | Connection agreement and final go-live readiness | assurance | Connection agreement readiness pack, Incident rehearsal pack, Implementation approach document | LIVE_GATE_NAMED_APPROVER_PRESENT, LIVE_GATE_MUTATION_FLAG_ENABLED |
| nhs_app_stage_limited_release | Limited release | release | Implementation approach document, NHS Service Support Guidance pack, Incident rehearsal pack | LIVE_GATE_SERVICE_DESK_READY, LIVE_GATE_ENVIRONMENT_TARGET_PRESENT |
| nhs_app_stage_full_release | Full release | release | Implementation approach document, Accessibility audit, Monthly data pack setup | nhs_app_stage_limited_release, LIVE_GATE_PHASE7_SCOPE_WINDOW |
| nhs_app_stage_post_live_assurance | Post-live monthly data and annual assurance | release | Monthly data owner assignment, Annual assurance owner assignment, NHS Service Support Guidance pack | nhs_app_stage_full_release |

        ## Ladder

        `EOI -> product_review -> sandpit -> AOS -> SCAL -> connection_agreement -> limited_release -> full_release`

        ## Stage rules

        - Sandpit is the first real environment stage and must be completed before AOS.
        - AOS repeats the same delivery, demo, and sign-off discipline under later environment values.
        - SCAL, clinical safety, privacy, accessibility, connection agreement, limited release, and full release remain distinct downstream steps.
