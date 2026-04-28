# 29 NHS App Onboarding Strategy

        This pack keeps the NHS App channel deferred in the current baseline while making later NHS App conversion concrete enough to rehearse now. The core product law is unchanged: one portal, one backend truth, one route family set, and an embedded shell adaptation instead of a separate NHS App product.

        ## Section A — `Mock_now_execution`

        The mock studio is a rehearsal-grade planning and embedded-readiness surface. It does four things now:
        - captures the full expression-of-interest question set and eligibility gaps without touching the live form
        - turns sandpit, AOS, SCAL, incident rehearsal, limited release, and post-live obligations into deterministic stage rows
        - renders embedded-preview route parity for the same patient route families used on the web portal
        - keeps deferred-scope warnings, live gates, and artifact safety visible so the team cannot accidentally treat NHS App as a current-baseline release lane

        ## Section B — `Actual_provider_strategy_later`

        Later real execution follows the current official NHS App process:
        1. confirm eligibility and submit the EOI
        2. complete product review and prioritisation
        3. complete the product assessment and solution-design work
        4. deliver and demo in sandpit
        5. repeat delivery and demo in AOS
        6. upload SCAL, clinical safety, privacy, accessibility, and service-standard evidence
        7. complete connection-agreement readiness
        8. run limited release, then full release
        9. provide monthly data and attend annual assurance

        ## Official guidance captured on 2026-04-09

        | Source | Captured on | Why it matters | URL |
        | --- | --- | --- | --- |
        | NHS App web integration | 2026-04-09 | The main NHS App process page defines eligibility, quarterly prioritisation, product review, solution design, sandpit before AOS delivery, SCAL plus clinical safety submission, connection agreement, limited release, full release, and post-live monthly data plus annual assurance. | https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/nhs-app-web-integration |
| Tell us you want to integrate with the NHS App | 2026-04-09 | The expression-of-interest page publishes the current question set, including product overview, commissioning posture, procurement frameworks, NHS login posture, demo environment, research, accessibility, messaging use-cases, throughput, and standards commitments. | https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/tell-us-you-want-to-integrate-with-the-nhs-app |
| Standards for NHS App integration | 2026-04-09 | The standards page makes WCAG 2.2 AA, the NHS service standard, clinical safety standards, and data privacy standards explicit, and ties evidence submission to SCAL. | https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/standards-for-nhs-app-integration |
| Contact us | 2026-04-09 | The contact page names the current NHS App integration support address and points eligible suppliers to the EOI form. | https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/contact-us |
| Web Integration Overview | 2026-04-09 | The overview page explains that the NHS App hosts supplier journeys inside a tailored webview and uses app-managed jump-off points and custom user-agent handling. | https://nhsconnect.github.io/nhsapp-developer-documentation/web-integration-overview/ |
| Web Integration Guidance | 2026-04-09 | The guidance page explains user-agent and query handling, NHS login SSO with assertedLoginIdentity, site links, and webview limitations like file download and browser print. | https://nhsconnect.github.io/nhsapp-developer-documentation/web-integration-guidance/ |
| Javascript API v2 Specification | 2026-04-09 | The JS API page defines the bridge surface for back actions, app-page navigation, browser overlay, external browser, calendar insertion, and byte-safe file download. | https://nhsconnect.github.io/nhsapp-developer-documentation/js-v2-api-specification/ |

        ## Stage summary

        | Stage | Category | Browser automation | Mock now | Actual later |
        | --- | --- | --- | --- | --- |
        | EOI eligibility and dossier prep | eligibility | yes | Complete the internal EOI dossier, score eligibility gaps, and rehearse the same question set without touching the live form. | Submit the real EOI only after eligibility, commissioning, NHS login, named approver, and scope-window gates pass. |
| Product review and prioritisation | review | partial | Run internal product review with the studio, preview routes, and readiness chips. | Attend product review call and prioritisation with the NHS App team after the EOI is accepted. |
| Solution design and delivery commitment | design | yes | Use the preview lab to review embedded route parity, safe navigation, and manifest-driven exposure. | Work with the NHS App technical team on the solution design document and agree the delivery plan. |
| Embedded readiness preview | design | yes | Exercise the preview route tabs and confirm the same portal logic survives embedded posture changes. | Use the same preview evidence to support real sandpit and AOS demo preparation. |
| Sandpit delivery rehearsal | sandpit | partial | Rehearse the sandpit checklist inside the studio and validate evidence completeness. | Deploy to the official sandpit environment, test, present the product in the demo call, and address required actions. |
| Sandpit demo sign-off | sandpit | partial | Use internal sign-off notes and blocker chips to rehearse the go/no-go review. | Wait for formal sandpit sign-off before moving to AOS. |
| AOS delivery rehearsal | aos | partial | Rehearse AOS-specific environment checks and blocker handling inside the studio. | Deploy and demo in AOS only after sandpit sign-off and environment values are supplied. |
| AOS demo sign-off | aos | partial | Use the studio to rehearse the sign-off story and remaining blockers. | Wait for the formal AOS sign-off before live-release planning. |
| SCAL and assurance submission | assurance | partial | Use the assurance page and evidence drawer to verify that every required evidence family is mapped. | Upload SCAL evidence, clinical safety docs, and supporting standards evidence for review. |
| Connection agreement and final go-live readiness | assurance | no | Keep the readiness pack visible and immutable in the studio. | Read and sign the real connection agreement with the NHS App team. |
| Limited release | release | no | Use the release page to pressure-test limited-release blockers and cohort assumptions. | Run the limited release to the agreed sample users following the joint implementation plan. |
| Full release | release | no | Keep full-release criteria visible but blocked in actual mode. | Continue from limited release to full release with the NHS App team. |
| Post-live monthly data and annual assurance | release | no | Use placeholder ownership to keep post-live obligations visible from the start. | Provide monthly data, attend annual assurance, and coordinate journey changes with the integration manager. |

        ## Gap closures

        - Deferred-now versus onboarding-now is resolved by splitting rehearsal execution from live submission.
        - Embedded channel drift is resolved by route-manifest, return-safe, and degraded-mode contracts in the same portal.
        - Sandpit and AOS are modelled as distinct gated stages rather than vague environment labels.
        - Accessibility, design, service-desk, and incident-rehearsal evidence are first-class artifact families rather than narrative TODOs.

        ## Non-negotiable guardrails

        - The pack does not reclassify Phase 7 as current-baseline scope.
        - The studio does not create a second NHS App product or separate route tree.
        - The preview does not imitate the NHS App closely enough to be confused for it.
        - Real EOI, sandpit, AOS, or release actions remain blocked until the live gates pass.
