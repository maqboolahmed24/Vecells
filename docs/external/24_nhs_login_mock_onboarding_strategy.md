# 24 NHS Login Mock Onboarding Strategy

        This pack keeps the NHS login onboarding track honest by separating the executable rehearsal path from the later live provider path. The mock is meant to exercise product-fit, dossier readiness, evidence readiness, and checkpoint handling now without claiming that Vecells is already eligible for a real submission.

        ## Summary

        - visual mode: `Partner_Access_Atelier`
        - stages: 12
        - fields: 26
        - artifacts: 18
        - manual checkpoints: 9
        - live gates: 9
        - current mock execution posture: `executable`
        - current real submission posture: `blocked`

        ## Section A — `Mock_now_execution`

        The mock twin is intentionally not a visual clone of NHS login. It is an internal rehearsal surface that models the operational path:

        1. application draft
        2. product fit review
        3. demo preparation
        4. sandpit request readiness
        5. sandpit requested
        6. product demo pending
        7. integration blocked until demo
        8. integration request ready
        9. assurance bundle in progress
        10. connection agreement pending
        11. service desk registration pending
        12. ready for real submission

        The mock faithfully simulates:
        - stage-to-stage blocker handling
        - evidence attachment and freshness
        - sponsor and commissioner placeholders
        - architecture, data-flow, and user-journey readiness
        - product demonstration dependency before integration access
        - later legal, assurance, and operational checkpoints
        - fail-closed live-submission posture

        The mock deliberately leaves these as placeholders instead of inventing fake truth:
        - named sponsor or commissioner identity
        - named signatory
        - named live approver
        - live target environment
        - live mutation enablement

        ## Mock stage model

        | Stage id | Label | What it proves |
        | --- | --- | --- |
        | `application_draft` | Application draft | Capture product summary, eligibility, sponsor placeholder, and basic service facts. |
| `product_fit_review` | Product fit review | Lock the route-family description and the boundary that NHS login authenticates but does not authorize. |
| `demo_prep` | Demo prep | Prepare the current architecture, data flow, user journeys, and live-demo walkthrough. |
| `sandpit_request_ready` | Sandpit request ready | Prepare the friendly name, redirect URI, public key bundle, scope list, and environment rationale. |
| `sandpit_requested` | Sandpit requested | Record the sandpit request and treat the account pack as pending until the provider responds. |
| `product_demo_pending` | Product demo pending | Stage the proof-of-concept demo, the sponsor placeholder, and the walkthrough pack. |
| `integration_request_blocked_until_demo` | Integration request blocked until demo | Make the provider rule explicit: integration access follows the product demonstration, not the other way around. |
| `integration_request_ready` | Integration request ready | After demo approval, package the integration request and nominal target date with current redirect and key material. |
| `assurance_bundle_in_progress` | Assurance bundle in progress | Prepare SCAL, DSPT, privacy, safety, and architecture evidence without implying that any signed approval exists yet. |
| `connection_agreement_pending` | Connection agreement pending | Separate the legal signatory path from technical readiness and keep ownership questions explicit. |
| `service_desk_registration_pending` | Service desk registration pending | Prepare the Service Bridge contacts and incident posture after connection-agreement work is current. |
| `ready_for_real_submission` | Ready for real submission | Mock rehearsal can reach this dossier-complete state, but real submission remains fail-closed until the live gates pass. |

        ## Section B — `Actual_provider_strategy_later`

        The mock stays aligned with later live work by using the same field map, selector map, manual checkpoint register, and live gate model. When real onboarding begins, the same stages still apply, but real progression remains blocked until sponsor, assurance, approver, and environment gates become true with current evidence.

        Grounding:
        - `blueprint/phase-0-the-foundation-protocol.md` and `blueprint/phase-2-identity-and-echoes.md` keep auth callback success separate from local session, route intent, and writable authority.
        - `official_apply_for_nhs_login`, `official_discovery`, and `official_integrate` define the live process order: eligibility -> discovery -> demo -> integration -> assurance -> connection agreement -> service desk.
        - `official_integrating_to_sandpit` and `official_multiple_redirect_uris` keep redirect, key, and scope inputs governed instead of ad hoc.
