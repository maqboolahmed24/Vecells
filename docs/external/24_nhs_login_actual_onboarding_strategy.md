# 24 NHS Login Actual Onboarding Strategy

        This strategy captures the real NHS login partner path for later use while failing closed today. The official process structure comes from current NHS England Digital and NHS Connect guidance accessed on `2026-04-09`. Vecells product logic remains governed by the blueprint corpus, not by the provider forms.

        ## Section A — `Mock_now_execution`

        The mock twin is used as the rehearsal substrate for the real provider path. Every real form section, checkpoint, and evidence bundle must first exist in the mock pack as a structured field, artefact, or manual checkpoint. That is the anti-drift control.

        ## Section B — `Actual_provider_strategy_later`

        Later live progression should follow this order:
        1. confirm service eligibility and sponsorship
        2. complete the application and review call path
        3. build a proof of concept in sandpit
        4. complete preparation and product demonstration calls
        5. request integration environment access
        6. complete SCAL, privacy, DSPT, safety, and technical conformance evidence
        7. complete the connection agreement
        8. complete National Service Desk registration
        9. run the formal review cycle and wait for live enablement

        Official source alignment:

        | Source | Why it matters | URL |
        | --- | --- | --- |
        | Apply for NHS login | Application stage checks eligibility, commissioner or sponsor posture, IM1 or PDS linked dependencies, and board approval before any later integration work. | https://digital.nhs.uk/services/nhs-login/nhs-login-for-partners-and-developers/nhs-login-integration-toolkit/apply-for-nhs-login |
| Discovery | Discovery requires a sandpit proof of concept, forms-and-documents review, product demonstration checklist completion, and current architecture, data-flow, and user-journey artefacts. | https://digital.nhs.uk/services/nhs-login/nhs-login-for-partners-and-developers/nhs-login-integration-toolkit/discovery |
| Integrate | Integration starts only after the product demonstration call, then runs through integration environment access, SCAL and clinical-safety evidence, connection agreement, and National Service Desk registration. | https://digital.nhs.uk/services/nhs-login/nhs-login-for-partners-and-developers/nhs-login-integration-toolkit/integrate |
| How NHS login works | NHS login authenticates and verifies the user, but partner services own session management, logout, product authorization, age controls, and least-necessary scope requests. | https://digital.nhs.uk/services/nhs-login/nhs-login-for-partners-and-developers/nhs-login-integration-toolkit/how-nhs-login-works |
| How do I integrate to the sandpit? | Sandpit setup requires a friendly service name, redirect URI, public key, and scope list. Sandpit is suitable for proof of concept and login flow rehearsal, not full assurance or live approval. | https://nhsconnect.github.io/nhslogin/integrating-to-sandpit/ |
| Compare NHS login environments | Sandpit has no formal requirements, integration requires sandpit completion and DSPT or ODS posture, and live production requires completed readiness activity plus signed agreement. | https://nhsconnect.github.io/nhslogin/compare-environments/ |
| Multiple redirect URIs | NHS login supports up to 10 redirect URIs and advises state-based fan-out when more are needed. | https://nhsconnect.github.io/nhslogin/multiple-redirect-uris/ |

        Live gate posture:

        | Gate | Status | Meaning |
        | --- | --- | --- |
        | `LIVE_GATE_EXTERNAL_FOUNDATION_WITHHELD` | `blocked` | seq_020 still reports `withheld` for Phase 0 entry; no real provider mutation may proceed while the external-readiness chain remains withheld. |
| `LIVE_GATE_CREDIBLE_MVP_OR_DEMO_ENV` | `review_required` | The rehearsal environment exists, but there is not yet a real sponsor-approved MVP or live-admissible demo environment. |
| `LIVE_GATE_SPONSOR_UNKNOWN` | `blocked` | The current dossier intentionally preserves sponsor and commissioner placeholders instead of inventing names. |
| `LIVE_GATE_ARCHITECTURE_CURRENT` | `pass` | This task creates the current architecture narrative, data-flow narrative, and the submission checklist rows that keep them current. |
| `LIVE_GATE_USER_JOURNEYS_CURRENT` | `pass` | The application field map and demo pack keep the required allow-share, deny-share, repeat sign-in, settings, and uplift flows explicit. |
| `LIVE_GATE_SAFETY_AND_PRIVACY_CURRENT` | `review_required` | The pack seeds the required bundle, but live submission remains blocked until those artefacts become current and signed. |
| `LIVE_GATE_APPROVER_MISSING` | `blocked` | No named live approver is stored in repo fixtures or synthetic seed data. |
| `LIVE_GATE_ENVIRONMENT_TARGET_MISSING` | `blocked` | Real runs must specify sandpit, integration, or production as a named target. The pack intentionally leaves the field blank. |
| `LIVE_GATE_MUTATION_FLAG_DISABLED` | `blocked` | All generated browser automation defaults to dry-run and refuses live submission until ALLOW_REAL_PROVIDER_MUTATION=true. |

        Automation law:
        - Browser automation defaults to dry-run only.
        - The selector map is data-driven in `data/analysis/nhs_login_live_gate_conditions.json`.
        - Final submission requires `ALLOW_REAL_PROVIDER_MUTATION=true`, named approver, target environment, and current evidence presence.
        - Screenshot capture is allowed only with synthetic or redacted values.
        - Final-submit actions must pause for explicit operator confirmation.

        Identity law carried through to provider onboarding:
        - NHS login authenticates and verifies. It does not authorize Vecells actions or local session scope.
        - Consent denial must return to a bounded local product state, not a generic success.
        - Redirect URI inventory must stay tied to route families and state-parameter fan-out rather than freeform callback sprawl.
        - Completion of a provider form never implies that Vecells may expose writable patient actions.
