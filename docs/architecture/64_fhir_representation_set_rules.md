# 64 FHIR Representation Set Rules

## Invariant Matrix

| Invariant | Scope | Rule |
| --- | --- | --- |
| `INV_064_DOMAIN_FIRST_AUTHORITY` | `FhirRepresentationContract` | Domain aggregates remain authoritative and FHIR is derived representation only. |
| `INV_064_PUBLISHED_CONTRACT_ONLY` | `FhirRepresentationContract` | Runtime materialization may read only published active representation contract rows. |
| `INV_064_REPLAY_SAFE_SET_IDS` | `FhirRepresentationSet` | The same aggregate version rematerializes the same representation set identity and resource membership. |
| `INV_064_IDENTIFIER_STABILITY` | `FhirResourceRecord` | Logical ids, version ids, and identifier sets are deterministic under replay and may not silently fork. |
| `INV_064_BUNDLE_TYPE_GUARD` | `FhirExchangeBundle` | Only declared and supported bundle types may be emitted at the adapter boundary. |
| `INV_064_APPEND_ONLY_SUPERSESSION` | `FhirRepresentationSet` | New aggregate versions supersede prior representation rows append-only instead of rewriting history in place. |
| `INV_064_ADAPTER_CONSUMPTION_GUARD` | `FhirExchangeBundle` | Adapters may consume only the published contract rows and bundle types their profile explicitly allows. |

## Resource Families

- `Task` remains the canonical request-shaped FHIR representation for request truth.
- `ServiceRequest` appears only when the published contract says a real clinical or external commitment exists.
- `DocumentReference`, `Communication`, `Consent`, `AuditEvent`, and `Provenance` are emitted as governed representation products, never hidden lifecycle owners.
- `Bundle` remains an exchange product bound to published bundle law and adapter profiles.
