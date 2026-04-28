# 316 External Reference Notes

Accessed on `2026-04-23` for `par_316`. These sources were support only. The local Phase 0 and Phase 5 blueprints remained authoritative where product rules were stricter.

## Borrowed

- [CIS2 Authentication API catalogue](https://digital.nhs.uk/developer/api-catalogue/cis2-authentication)
  - Borrowed the requirement to treat hub staff sign-in as CIS2-backed OIDC, not a local role alias.
- [CIS2 scopes and claims](https://digital.nhs.uk/services/care-identity-service/applications-and-services/cis2-authentication/integrate/design-and-build/scopes-and-claims)
  - Borrowed the `selected_roleid` / role-selection model and the expectation that applications resolve role and organisation from authoritative claims rather than remembered UI state.
- [CIS2 role selection, changing role and organisation, and logout](https://digital.nhs.uk/services/care-identity-service/applications-and-services/cis2-authentication/integrate/design-and-build/role-selection-changing-role-and-organisation-and-logout)
  - Borrowed the explicit role and organisation switching posture and the need to invalidate writable posture when role or organisation context changes.
- [CIS2 authenticators](https://digital.nhs.uk/services/care-identity-service/applications-and-services/cis2-authentication/authenticators)
  - Borrowed the `aal2` and `aal3` session-assurance vocabulary used in `StaffIdentityContext`.
- [Care Identity Management and Spine Directory Service](https://digital.nhs.uk/services/care-identity-service/applications-and-services/care-identity-management)
  - Borrowed the assumption that organisation and role grants are directory-backed authoritative facts, not frontend session preferences.
- [NHS England digital clinical safety assurance](https://www.england.nhs.uk/long-read/digital-clinical-safety-assurance/)
  - Borrowed the release obligation that unsafe cross-org behaviour must fail closed and remain auditable.
- [Applicability of DCB0129 and DCB0160 step-by-step guidance](https://digital.nhs.uk/services/clinical-safety/applicability-of-dcb-0129-and-dcb-0160/step-by-step-guidance)
  - Borrowed the requirement to treat cross-organisation access, wrong-practice visibility, and deployment controls as explicit clinical-safety hazards with deployment evidence.

## Rejected or tightened locally

- The official CIS2 material does not prescribe a full application-level acting-scope tuple. The local blueprint is stricter, so 316 added a durable `ActingScopeTuple` with environment, policy-plane, purpose, audience, and minimum-necessary bindings.
- The official identity guidance supports role and organisation selection, but it does not define fail-closed same-shell drift handling. The local blueprint required backend drift detection and stale/blocked posture before mutation.
- The official identity material does not define field-level hub visibility tiers. The local 311 contract remained authoritative for `origin_practice_visibility`, `hub_desk_visibility`, and `servicing_site_visibility`.
- The official safety guidance is broader than the repo’s minimum-necessary contract. 316 kept the local rule that wide cross-org payloads may not be materialized and then hidden later.
