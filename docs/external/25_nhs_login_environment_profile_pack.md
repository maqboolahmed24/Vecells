# 25 NHS Login Environment Profile Pack

            Section A — `Mock_now_execution`

            `Bluewoven_Identity_Simulator` exposes three executable rehearsal profiles now: local mock, sandpit-like, and integration-like. They are deliberately distinct so environment drift is visible before real onboarding begins.

            ## Environment profiles

            | Environment | Lane | Base URL | Test data | IM1 posture |
| --- | --- | --- | --- | --- |
| Local mock | Mock_now_execution | `http://127.0.0.1:4174` | Synthetic aliases, static OTP, deterministic callback-race and stale-code fault injection. | Disabled by default; can simulate `gp_integration_credentials` only when IM1 flag is enabled on the client. |
| Sandpit-like | Mock_now_execution | `https://sandpit-like.vecells.local` | Prepared dummy accounts plus static OTP rehearsal; no real ID or full PDS-backed registration. | IM1 registration flow stays disabled, matching sandpit restrictions on GP Online testing. |
| Integration-like | Mock_now_execution | `https://integration-like.vecells.local` | Synthetic PDS-matched and IM1-ready aliases mirror integration test-pack structure. | Available only when client and test user both carry IM1 enablement. |
| Actual sandpit later | Actual_provider_strategy_later | `https://sandpit.patient.vecells.example` | Provider-issued sandpit client plus supplied test pack after request approval. | Do not assume GP Online or IM1 testing is available; keep it disabled until integration. |
| Actual integration later | Actual_provider_strategy_later | `https://integration.patient.vecells.example` | Provider integration pack plus optional IM1 linkage details after approval. | IM1 pathways are allowed only with approved pairings and explicit high-assurance scope approval. |
| Actual production later | Actual_provider_strategy_later | `https://patient.vecells.example` | Smoke-test user only, no exploratory testing, and no load testing. | Production `gp_integration_credentials` remains blocked until live IM1 enablement is approved. |

            ## Official guidance snapshots

            | Source | Captured on | Why it matters | Grounding |
| --- | --- | --- | --- |
| What is NHS login? | 2026-04-09 | NHS login is an OpenID Connect-based identity rail for health and care services. It is not a one-off GP-credential retrieval tool. | NHS login is how people prove who they are online for health and care websites or apps., Partners choose the required verification and authentication combination for access. |
| How NHS login works | 2026-04-09 | NHS login authenticates and verifies the user, but partner services own session management, logout, age controls, and post-auth product authorization. | Consent denial must return to the partner with an explicit code and bounded handling., Session management and logout remain partner responsibilities. |
| How do I integrate to the sandpit? | 2026-04-09 | Sandpit registration requires a friendly name, redirect URI, public key, and scope list. Sandpit is for proof of concept and login-flow rehearsal. | Partners submit a sandpit environment request form., Required setup data is the friendly name, redirect URI, public key, and scopes. |
| Compare NHS login environments | 2026-04-09 | Sandpit has no formal requirements, integration requires sandpit completion plus ODS and DSPT posture, and live needs readiness activity plus a signed agreement. | Sandpit allows proof-of-concept login rehearsal but not real ID or load testing., Integration is where technical conformance and production-like testing occur. |
| Test data | 2026-04-09 | Sandpit provides dummy accounts and a static OTP; integration supports PDS-backed end-to-end test data and optional IM1 linkage details; live can provide a smoke-test user only. | Sandpit accounts use dummy details and a static OTP for rehearsals., Integration provides test accounts for full end-to-end journeys and can support IM1 linkage details. |
| Multiple redirect URIs | 2026-04-09 | NHS login supports up to 10 redirect URIs and recommends using opaque state-based fan-out when more destinations are needed. | The state parameter should carry the partner-side routing identifier., The callback returns state as-is to the partner. |
| Technical Conformance | 2026-04-09 | Integration environment testing covers production-like setup and technical conformance; IM1 and non-IM1 suppliers have distinct test-data expectations. | IM1 suppliers create local GP-system records and share linkage details with NHS login for integration testing., Non-IM1 suppliers can still test online identity verification and GP Online journeys in integration. |
| Using NHS login to create or retrieve GP credentials | 2026-04-09 | The `gp_integration_credentials` scope returns linkage key, ODS code, and account ID for IM1-enabled relying parties only, and only as part of NHS login authentication. | The feature must be used as part of NHS login authentication, not as a standalone retrieval flow., IM1-enabled production posture is required before the scope is allowed in live environments. |
| Scopes and claims | 2026-04-09 | Scopes are not automatically available: they must be requested and approved. `openid` is mandatory, `profile` and `basic_demographics` are mutually exclusive, and `gp_integration_credentials` is high-assurance and IM1-gated. | Claims are retrieved through the userinfo endpoint after approval., The `openid` scope is mandatory for all partners. |
| Introduction to Vectors of Trust | 2026-04-09 | The `vtr` claim requests acceptable verification and authentication combinations. Returned `vot` and `vtm` claims bind the achieved trust level to the token. | VoT selection must be included during OIDC initialisation., The default NHS login vector set assumes high verification unless a partner specifies otherwise. |

            ## Section B — `Actual_provider_strategy_later`

            The live-provider environment pack is already structured, but it remains blocked on approval, sponsor, target environment, and real mutation gates.

            ## Key derived rules

            - Sandpit later needs a friendly service name, redirect URI, public key, and scope list.
            - Integration later is the correct target for technical conformance and IM1 rehearsal, not sandpit.
            - Production later allows smoke-test posture only after readiness activity and agreement.
            - Test-data handling differs by environment, so the simulator keeps separate fixtures for local, sandpit-like, and integration-like execution.
