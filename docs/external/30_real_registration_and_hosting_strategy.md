# 30 Real Registration And Hosting Strategy

        Real site-link registration is intentionally blocked in this pack. The strategy exists now so later sandpit, AOS, and live work can proceed from a controlled field map rather than re-deriving metadata under pressure.

        ## Hosting strategy

        - host `/.well-known/assetlinks.json` and `/.well-known/apple-app-site-association` on the owned HTTPS domain for the selected environment
        - avoid hidden redirects, HTML error pages, or CDN rewrites on the exact `.well-known` paths
        - use explicit JSON-compatible content types for both files
        - keep cache TTL short until environment values and path approvals are frozen, then increase only under change control
        - route changes or additional path exposure require the same review path as any other embedded route publication change

        ## Domain and ownership checklist

        - confirm the selected environment host is owned and delegated to the correct Vecells runtime slice
        - confirm release tuple, route publication tuple, and embedded continuity proof are current for every linked route family
        - confirm named approver, environment target, and mutation flag before any real submission or hosting change
        - retain a browser-automation dry-run harness for later evidence capture without writing real values to the repo

        ## Live gates

        | Gate | Status | Meaning |
| --- | --- | --- |
| Phase 7 approved scope window | blocked | Site-link registration stays deferred until the NHS App channel is inside an approved scope window. |
| External readiness chain clear | blocked | Phase 0 planning is ready for external-readiness work, but the current-baseline external gate remains withheld and still blocks any real NHS App mutation. |
| Environment-specific package, certificate, and appID values supplied | blocked | Android package name, Android certificate fingerprint, and iOS appID must come from the NHS App team per environment. |
| Path allowlist approved and traceable | review_required | Every registered path must map back to one approved route family, safe return contract, and embedded-safe posture. |
| Route continuity and embedded evidence current | review_required | Linked routes must already satisfy session, continuity, artifact, and return-safe laws before registration. |
| Domain ownership, hosting path, and cache controls proven | review_required | Real `.well-known` hosting requires owned HTTPS domains, exact paths, no hidden redirects, and governed cache controls. |
| Named approver present | blocked | No named approver is stored in repo fixtures or allowed by default in the rehearsal pack. |
| Environment target present | blocked | Real registration must target exactly one environment: sandpit, AOS, or live. |
| ALLOW_REAL_PROVIDER_MUTATION=true | blocked | Dry-run remains the only default; real mutation is fail-closed until the explicit flag is set. |

        ## Rehearsal vs real hosting

        Local preview hosting proves only:
        - file path shape
        - generated JSON structure
        - stable local asset fetch behavior

        It does not prove:
        - production DNS ownership
        - correct official Android or iOS values
        - NHS App team approval
        - production cache or CDN behavior
