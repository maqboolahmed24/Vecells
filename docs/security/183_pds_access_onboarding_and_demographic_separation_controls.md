# 183 PDS Access, Onboarding, And Demographic Separation Controls

## Control Position

PDS access is a bounded evidence enrichment, not an identity authority. `PdsEnrichmentOrchestrator` prevents always-on external dependency risk by failing deterministic local-only when feature flags, onboarding, legal basis, tenant policy, environment policy, endpoint refs, secret refs, route allow-list, or circuit posture are not satisfied.

`PdsAdapter` is called only after the policy record is persisted. The adapter returns normalized refs, hashes, digests, provenance, and freshness metadata. Raw PDS identifiers, full demographic payloads, secrets, and endpoint credentials are not stored in enrichment outcomes.

## No Direct Binding Mutation

PDS output cannot:

- set patient refs
- set ownership state
- confirm a durable claim
- rewrite request or episode identity
- overwrite communication preferences
- equate NHS login contact claims with PDS or GP demographic data

Any durable identity consequence still routes through local match policy and `IdentityBindingAuthority`. The outcome record always carries `bindingMutationProhibited = true` and `PDS_183_NO_DIRECT_BINDING_MUTATION`.

## Freshness And Staleness

Each `PdsNormalizedDemographicSnapshot` includes `cachedAt`, `expiresAt`, `staleAfter`, source last-updated time, source refs, and a freshness state. Fresh cache can support enrichment. Stale cache can support deterministic fallback and review, but it is marked with `PDS_183_STALE_CACHE_NOT_FRESH_EVIDENCE` and cannot masquerade as fresh evidence.

## Notification Controls

PDS change notifications remain disabled unless policy and onboarding explicitly enable them. `PdsChangeSignalRecord` stores a change signal and optional queued refresh ref. It does not mutate local patient state or binding state. If notifications are unavailable or not onboarded, the signal degrades to `manual_review_only` or `ignored_disabled`.

## OWASP And NHS Guidance Notes

The controls align with OWASP least privilege, secure logging, access-control, and secret-handling principles by storing refs and digests rather than raw payloads. Official NHS PDS guidance is used to keep access, onboarding, PDS FHIR usage, and optional event notification assumptions explicit, while the local blueprint remains the source of authority.

References:

- [PDS FHIR API catalogue](https://digital.nhs.uk/developer/api-catalogue/personal-demographics-service-fhir)
- [Personal Demographics Service](https://digital.nhs.uk/services/personal-demographics-service)
- [Access data on PDS](https://digital.nhs.uk/services/personal-demographics-service/access-data-on-the-personal-demographics-service)
- [National Events Management Service](https://digital.nhs.uk/services/national-events-management-service)
