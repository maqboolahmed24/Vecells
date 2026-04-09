# 09 Regulatory Workstreams

Vecells needs one explicit operating model for safety, privacy, partner evidence, records governance, resilience, and release assurance. This pack preserves source-era version context rather than flattening the corpus into a timeless checklist.

- Frameworks: 16
- Workstreams: 13
- Baseline-required or ongoing workstreams: 10
- Deferred or conditional workstreams: 3

## Framework Context

| Framework | Scope | Source-era context | Why it matters |
| --- | --- | --- | --- |
| DCB0129 manufacturer clinical risk management | Baseline Required | Phase 9 notes the DCB standards are under review in the March 2026-era corpus and should therefore stay version-aware rather than timeless. | The corpus treats DCB0129 as the governing manufacturer-side clinical safety frame and explicitly ties it to templates, agile implementation guidance, and incremental evidence updates. |
| DCB0160 deployment and use clinical risk management | Baseline Required | Phase 9 notes DCB0160 is under review in the same March 2026-era corpus context and therefore remains a versioned input. | The corpus positions DCB0160 as the deployment-and-use counterpart to DCB0129, especially once live identity, telephony, assistive, and operational rollout are in scope. |
| DTAC | Baseline Required | Phase 9 explicitly says DTAC guidance was refreshed in March 2026 and must be tracked through version metadata and standards watchlists. | The corpus treats DTAC as spanning clinical safety, data protection, technical security, interoperability, and usability or accessibility rather than a single evidence upload. |
| Data Security and Protection Toolkit | Baseline Required | Phase 9 explicitly references the 2024-25 CAF-aligned DSPT guidance and its stronger response-and-recovery posture. | The corpus ties DSPT to continuous evidence production, incident reporting capability, and operational proof rather than a once-a-year spreadsheet exercise. |
| Records Management Code of Practice | Ongoing Bau | Phase 9 states the HTML version is the most up-to-date source and should therefore be carried as source metadata, not flattened into an undated policy label. | The corpus elevates retention, deletion, archive, and legal-hold control into first-class product objects rather than after-the-fact storage policy. |
| WCAG 2.2 AA | Baseline Required | The corpus explicitly references WCAG 2.2 and recent audit expectations, including NHS App expression-of-interest wording around recent WCAG 2.1 or 2.2 audits. | Phase 1 already treats WCAG 2.2 AA and accessible-authentication patterns as architectural input; Phase 7 raises that to NHS App channel gating. |
| NHS service standard and content guidance | Baseline Required | Phase 7 frames the service standard as part of the current NHS App standards pack rather than a later UX tidy-up. | The corpus treats the 17-point NHS service standard, simple-health-content guidance, and joined-up channel experience as release-shaping controls. |
| GDPR | Baseline Required | Phase 7 lists GDPR explicitly inside the NHS App standards posture; the workstream model therefore carries it as a source-era requirement rather than an external refresh. | The corpus binds privacy to identity, contact provenance, telemetry minimization, embedded-channel restrictions, and explicit data-flow evidence rather than generic legal boilerplate. |
| PECR | Baseline Required | Phase 7 cites PECR as part of the current NHS App standards set carried through SCAL and channel approval. | The corpus places PECR in the same standards bundle as channel onboarding and privacy evidence, especially for patient messaging and notification behavior. |
| NHS login onboarding and assurance | Partner Specific | Phase 2 references current NHS login partner guidance and mock-auth flows; the corpus does not treat this as timeless. | The corpus treats NHS login onboarding as including redirect inventory, scope decisions, clinical-safety evidence, and local-session ownership rather than simple credential setup. |
| IM1 pairing and material-change RFC routing | Partner Specific | Phase 8 describes current IM1 guidance for AI-containing products and explicitly ties it to material-change routing rather than initial timeless pairing only. | The corpus treats IM1 pairing as a whole-product documentation review lane and states that material AI enhancement routes through formal RFC plus updated SCAL and related documents. |
| NHS App web integration onboarding | Deferred Phase7 | Phase 7 preserves the current onboarding sequence of expression of interest, product assessment, Sandpit, AOS, limited release, and full release. | The corpus treats the NHS App channel as one portal with embedded shell, manifest, jump-off, and demo/onboarding obligations rather than a separate product. |
| SCAL submission and evidence bundle | Deferred Phase7 | Phase 7 routes SCAL after Sandpit, AOS, demo, and incident rehearsal in the current NHS App process. | The corpus treats SCAL as an evidence bundle tied to exact manifest, telemetry, safety, accessibility, and release tuples rather than a detached upload. |
| NHS AI-enabled ambient scribing and documentation guidance | Assistive Optional | Phase 8 explicitly cites current NHS guidance as the closest operating basis for assistive capabilities and uses it as a live change-control reference. | The corpus uses current NHS guidance on ambient scribing and documentation support to require human oversight, training, audit, bias monitoring, and bounded intended use. |
| Medical-device boundary and intended-use reassessment | Assistive Optional | Phase 8 frames this through current NHS guidance and MHRA-regulated device boundary language rather than fixed timeless classification. | The corpus distinguishes verified transcription from higher-function generative processing and uses that split to drive intended-use freeze and medical-purpose reassessment. |
| Release/runtime/publication parity and standards watchlist governance | Baseline Required | Phase 9 explicitly notes March 2026 DTAC refresh and the 2 March 2026 decommissioning of legacy developer and FHIR documentation endpoints, so standards and dependency hygiene remain time-sensitive. | The corpus treats runtime publication bundles, parity records, continuity evidence, release watch tuples, and standards dependency watchlists as first-class regulated-delivery controls. |

## Workstream Inventory

| Workstream | Scope | Framework basis | Owner | Cadence |
| --- | --- | --- | --- | --- |
| Manufacturer clinical safety workstream | Baseline Required | FW_DCB0129, FW_DTAC | ROLE_MANUFACTURER_CSO | Creation-time baseline, then per material safety-affecting change and before any release candidate that changes clinical behavior. |
| Deployment and use clinical risk workstream | Baseline Required | FW_DCB0160, FW_DSPT | ROLE_DEPLOYMENT_CSO | Before new live rollout classes, before channel expansion, and after any incident or deployment posture change that alters clinical risk. |
| Data protection and privacy workstream | Baseline Required | FW_GDPR, FW_PECR, FW_DTAC | ROLE_DPO | Creation-time baseline, then per disclosure-changing delta and before any release that changes audience, channel, telemetry, or subprocessor posture. |
| Technical security and assurance workstream | Baseline Required | FW_DTAC, FW_DSPT | ROLE_SECURITY_LEAD | Before release-candidate approval for security-affecting changes and continuously for vendor freshness and active trust slices. |
| Interoperability evidence workstream | Baseline Required | FW_DTAC, FW_NHS_LOGIN_ONBOARDING, FW_IM1_PAIRING_AND_RFC | ROLE_INTEROPERABILITY_LEAD | At integration creation-time, on material adapter or supplier changes, and before releases that widen external surface behavior. |
| Accessibility, content, and service-standard workstream | Baseline Required | FW_WCAG_22_AA, FW_NHS_SERVICE_STANDARD | ROLE_ACCESSIBILITY_CONTENT_LEAD | Per route-family or shell change, before release, and again for embedded-channel onboarding when Phase 7 becomes active. |
| Records management and retention governance workstream | Ongoing Bau | FW_RECORDS_MGMT_CODE, FW_RUNTIME_PARITY_AND_WATCHLIST | ROLE_RECORDS_GOVERNANCE_LEAD | Creation-time for new artifact families, continuously for lifecycle changes, and in periodic governance packs. |
| Incident, near-miss, and reportability workstream | Ongoing Bau | FW_DSPT, FW_DCB0160 | ROLE_INCIDENT_MANAGER | Continuous operational use with periodic drill cadence and release blocking when unresolved incidents materially affect the changed area. |
| NHS login, IM1, and partner onboarding evidence workstream | Partner Specific | FW_NHS_LOGIN_ONBOARDING, FW_IM1_PAIRING_AND_RFC | ROLE_PARTNER_ONBOARDING_LEAD | Whenever partner configuration, product documentation burden, or material change routing changes; not every release, but always when the corpus says the partner pack must move. |
| Deferred NHS App SCAL and channel onboarding workstream | Deferred Phase7 | FW_NHS_APP_WEB_INTEGRATION, FW_SCAL, FW_WCAG_22_AA, FW_NHS_SERVICE_STANDARD | ROLE_PARTNER_ONBOARDING_LEAD | Deferred until Phase 7, then creation-time onboarding plus pre-release and channel-widening evidence cycles. |
| Assistive and AI governance plus change-control workstream | Assistive Optional | FW_AI_AMBIENT_GUIDANCE, FW_DCB0129, FW_DCB0160, FW_DTAC, FW_IM1_PAIRING_AND_RFC, FW_MHRA_MEDICAL_DEVICE_BOUNDARY, FW_GDPR | ROLE_AI_GOVERNANCE_LEAD | Optional until assistive rollout starts; then at creation-time, every material change, every visible rollout step, and continuously for supplier and trust freshness. |
| Release, runtime, publication parity, and standards watchlist workstream | Baseline Required | FW_RUNTIME_PARITY_AND_WATCHLIST, FW_DTAC | ROLE_RELEASE_MANAGER | Every release candidate and continuously while standards or dependency posture drifts. |
| Operational resilience, restore, and recovery rehearsal workstream | Baseline Required | FW_DSPT, FW_RUNTIME_PARITY_AND_WATCHLIST | ROLE_RELEASE_MANAGER | Pre-release for every material topology or dependency-order change, then continuously as rehearsal freshness decays. |

## Baseline posture

Baseline workstreams include manufacturer safety, deployment/use safety, privacy, security, interoperability, accessibility/content, release/runtime parity, records governance, incident handling, and resilience. These are part of the build and release model, not post-build overlay work.

## Deferred and conditional posture

NHS App onboarding and SCAL remain explicit but deferred to Phase 7. Assistive and AI governance remains optional scope until Phase 8 work is activated, but becomes fully release-blocking once visible rollout starts.
