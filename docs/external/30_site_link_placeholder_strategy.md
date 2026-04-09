# 30 Site Link Placeholder Strategy

        This pack turns NHS App site links into route-contract artifacts rather than ad hoc URL strings. The immediate lane is a safe placeholder generator and local `.well-known` rehearsal setup. The later lane is a blocked registration strategy that waits for NHS App team-supplied environment values, approved path allowlists, and current continuity proof.

        ## Section A — `Mock_now_execution`

        - generate route-family-bound placeholder metadata for Android and iOS from one shared allowlist model
        - make route safety, secure-link posture, and return-safe continuity visible before any environment-specific values exist
        - host local `.well-known` files for rehearsal so the app and tests can validate file presence, shape, and path discipline
        - keep rejected detached aliases and raw action URLs visible so the team cannot silently widen the allowlist later

        ## Section B — `Actual_provider_strategy_later`

        - real registration remains blocked until Phase 7 is in scope, official Android and iOS values are supplied, and the path allowlist is approved
        - the real hosting path must be exact, owned, HTTPS-backed, and coordinated with the NHS App onboarding team
        - the same route matrix generated now is the later source of truth for sandpit, AOS, and live registration packs

        ## Official guidance captured on 2026-04-09

        | Source | Captured on | Why it matters | URL |
| --- | --- | --- | --- |
| NHS App web integration | 2026-04-09 | The NHS App process page remains the external owner for onboarding, environment progression, and change coordination. Site-link registration belongs inside that later onboarding lane rather than as a stand-alone shortcut. | https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/nhs-app-web-integration |
| Web Integration Overview | 2026-04-09 | The overview page confirms that supplier journeys run inside a tailored NHS App webview with NHS App-managed jump-off points rather than a separate supplier-owned app. | https://nhsconnect.github.io/nhsapp-developer-documentation/web-integration-overview/ |
| Web Integration Guidance | 2026-04-09 | The guidance page is the current source for supplier-side site-link mechanics and embedded traffic hints, including `from=nhsApp`, `assetlinks.json`, `apple-app-site-association`, and NHS App team-supplied environment values. | https://nhsconnect.github.io/nhsapp-developer-documentation/web-integration-guidance/ |
| Javascript API v2 Specification | 2026-04-09 | The JS API v2 spec defines the embedded navigation and byte-delivery bridge, which shapes which linked routes are safe once the site link resolves into the embedded shell. | https://nhsconnect.github.io/nhsapp-developer-documentation/js-v2-api-specification/ |

        ## Summary

        - Visual mode: `Linkloom_Metadata_Studio`
        - Route rows: `18`
        - Approved rows: `7`
        - Conditional rows: `8`
        - Rejected rows: `3`
        - Environment variants: `4`
        - Live gates: `9`

        ## Mandatory gap closures

        - Site links are bound to route families, selected anchors, and return contracts rather than plain deep-link strings.
        - Placeholder metadata and later real registration share one environment matrix, so drift becomes machine-detectable.
        - Unsafe detached aliases and direct action URLs are explicit rejected rows, not hidden assumptions.
        - Local `.well-known` hosting is treated as rehearsal evidence only and cannot be mistaken for production readiness.
