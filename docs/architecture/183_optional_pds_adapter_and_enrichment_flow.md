# 183 Optional PDS Adapter And Enrichment Flow

## Purpose

`PdsEnrichmentOrchestrator` adds a disabled-by-default Personal Demographics Service enrichment path. It is deliberately provider-port-first: `PdsAdapter` is the swappable external boundary, while the orchestrator owns feature flag, environment, tenant, onboarding, legal-basis, route, endpoint, secret, cache, circuit-breaker, and provenance decisions.

PDS is optional evidence. It strengthens demographic confidence when policy allows, but it does not replace `PatientLinker`, `IdentityBindingAuthority`, `SessionGovernor`, local evidence-vault refs, or authority-owned patient binding workflow.

## Flow

1. A caller submits a `PdsEnrichmentRequestRecord` with subject ref, tenant, route family, legal-basis evidence, local evidence refs, and bounded query digests.
2. `PdsEnrichmentOrchestrator` writes a `PdsGatingDecisionRecord`.
3. If any precondition fails, the outcome is deterministic local matching fallback and no adapter call occurs.
4. If policy allows access, a fresh cached `PdsNormalizedDemographicSnapshot` can be returned.
5. If no fresh cache exists, `PdsAdapter` calls a concrete PDS FHIR transport and normalizes only refs, hashes, digests, provenance, and freshness timestamps.
6. Provider timeout, provider failure, response parsing drift, circuit-open posture, and stale cache are explicit outcome states.
7. Optional PDS notifications are `PdsChangeSignalRecord` rows that queue refresh or manual review; they never mutate patient state directly.

## Disabled-By-Default Gates

Live PDS lookup requires all of the following:

- feature flag enabled for the call
- non-disabled access mode
- environment in the allow list
- tenant in the allow list
- PDS FHIR onboarding, PDS access approval, DSPT posture, secure network posture, and purpose/use-case ref complete
- accepted legal-basis mode and legal-basis evidence ref
- endpoint ref and credential secret ref configured
- route family explicitly approved
- circuit breaker closed

Default policy fails the first gate with `PDS_183_DISABLED_BY_DEFAULT`, returns `local_matching_only`, and preserves the local `PatientLinker` path.

## Data-Class Separation

`PdsNormalizedDemographicSnapshot` keeps data classes separate:

| Data class | Rule |
| --- | --- |
| authoritative local binding state | Always `null`; only `IdentityBindingAuthority` settles durable binding or derived patient refs. |
| local match evidence | Stored as local evidence refs only. |
| NHS login subject claims | Stored as separate claim refs and never treated as PDS or GP contact data. |
| PDS demographics | Stored as hashed/digested demographic evidence plus provenance and freshness. |
| communication preferences | Always separate; PDS and NHS login contact data cannot overwrite local communication preferences. |
| change notifications | Stored as change-signal refs and queued refresh/review inputs. |

## Patient Linker Bridge

`createPatientLinkerPdsEnrichmentProvider()` adapts the orchestrator to task 178's `PdsEnrichmentProvider` seam. Only fresh enrichment or fresh cache returns a `pdsDemographicsRef` to the linker. Stale cache returns an unavailable posture with `PDS_183_STALE_CACHE_NOT_FRESH_EVIDENCE` so stale enrichment cannot masquerade as fresh evidence.

## Official Guidance Used

The implementation follows local blueprint authority first and uses official NHS guidance only to refine access boundaries:

- [PDS FHIR API catalogue](https://digital.nhs.uk/developer/api-catalogue/personal-demographics-service-fhir)
- [Personal Demographics Service overview](https://digital.nhs.uk/services/personal-demographics-service)
- [Access data on PDS](https://digital.nhs.uk/services/personal-demographics-service/access-data-on-the-personal-demographics-service)
- [National Events Management Service](https://digital.nhs.uk/services/national-events-management-service)

## Gap Closures

- `PARALLEL_INTERFACE_GAP_PHASE2_PDS_PROVIDER_PORT_V1`
- `PARALLEL_INTERFACE_GAP_PHASE2_PDS_FEATURE_FLAG_GATING_V1`
- `PARALLEL_INTERFACE_GAP_PHASE2_PDS_ONBOARDING_LEGAL_BASIS_V1`
- `PARALLEL_INTERFACE_GAP_PHASE2_PDS_DATA_CLASS_SEPARATION_V1`
- `PARALLEL_INTERFACE_GAP_PHASE2_PDS_NO_DIRECT_BINDING_AUTHORITY_BYPASS_V1`
- `PARALLEL_INTERFACE_GAP_PHASE2_PDS_STALE_CACHE_FALLBACK_V1`
- `PARALLEL_INTERFACE_GAP_PHASE2_PDS_CHANGE_NOTIFICATION_SEAM_V1`

No `PARALLEL_INTERFACE_GAP_PHASE2_PDS.json` artifact is published because task 177 evidence refs and task 178 `PdsEnrichmentProvider` are present and coherent.
