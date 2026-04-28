# Phase 2 Trust Contract And Capability Gates

Status: frozen for Phase 2 implementation planning  
Task: `seq_170_phase2_freeze_trust_contract_capability_gates_and_identity_authority_rules`

This document freezes the shared Phase 2 trust kernel used by authenticated intake, claim redemption, request status, post-sign-in attachments, SMS continuation, and future protected records or booking surfaces. It is intentionally a contract pack rather than implementation logic. NHS login/OIDC transaction detail belongs to `seq_171`, patient-link confidence and optional PDS enrichment belong to `seq_172`, and telephony evidence readiness belongs to `seq_173`.

## Canonical Objects

`IdentityContext` is the posture envelope consumed by route capability evaluation. It carries `identitySource`, `verificationLevel`, `patientLinkPosture`, freshness, restrictions, and grant ceilings. It never stores evidence payloads and it does not imply a patient link just because a local session exists.

`IdentityEvidenceEnvelope` is the append-only vault envelope. Operational tables, events, route profiles, and UI surfaces can hold only vault references, digests, disclosure classes, retention classes, and masked display hints. Payload values remain inside the encrypted evidence vault.

`CapabilityDecision` is the route-level decision envelope emitted by the capability engine. Its decision vocabulary is frozen to exactly:

| Decision | Meaning | Grant posture |
| --- | --- | --- |
| `allow` | The route may proceed within the profile ceiling. | At or below `maxGrantCeiling`. |
| `step_up_required` | The user must complete stronger verification or policy resolution first. | No new high-trust grant. |
| `recover_only` | The surface may show recovery, repair, or continuation affordances only. | Continuation or repair grant only. |
| `deny` | The surface is blocked. | No grant. |

## Authority Separation

The frozen ownership model separates five responsibilities:

| Component | Owns | Explicitly cannot do |
| --- | --- | --- |
| `IdentityBindingAuthority` | Append, supersede, freeze, and release `IdentityBinding`. | Bypass the evidence vault or raise grants above route ceilings. |
| `CapabilityDecisionEngine` | Evaluate `IdentityContext` plus `RouteCapabilityProfile`. | Mutate `IdentityBinding` or persist evidence payloads. |
| `PatientLink` | Provide linkage posture and conflict signals. | Mutate `IdentityBinding` or raise capabilities on its own. |
| `AccessGrantService` | Issue and supersede grants at or below the decision ceiling. | Exceed `CapabilityDecision.maxGrantCeiling`. |
| `LocalSessionAuthority` | Establish, rotate, and expire local session epochs. | Treat a session as a patient link. |

Manual override and identity repair are narrowing controls. They may downgrade a route to `recover_only` or `deny`, request authority review, or release a repair posture after `IdentityBindingAuthority` acts. They may not write `IdentityBinding` directly.

## Capability Gate Rules

Every protected surface must resolve to a `RouteCapabilityProfile` row before it can evaluate a route. The registry in `data/contracts/170_route_capability_profiles.yaml` is authoritative for the current freeze. Unknown protected routes deny by default through both `unknownProfileBehavior: deny` and `RCP_170_UNKNOWN_PROTECTED_ROUTE_FALLBACK`.

Capability gates are evaluated in this order:

1. Resolve the route to a `RouteCapabilityProfile`.
2. Load `IdentityContext` and only evidence-envelope references.
3. Apply freshness, age/policy restrictions, patient-link posture, and manual override signals.
4. Emit `CapabilityDecision` using only `allow`, `step_up_required`, `recover_only`, or `deny`.
5. Issue grants only at or below the profile and decision ceilings.
6. Send identity binding changes only as authority signals to `IdentityBindingAuthority`.

## Required Surface Coverage

The frozen matrix in `data/analysis/170_capability_matrix.csv` covers the required Card 3 surfaces:

| Surface | Route profile | Default decision |
| --- | --- | --- |
| Anonymous draft start | `RCP_170_ANONYMOUS_DRAFT_START` | `allow` |
| Anonymous draft continue | `RCP_170_ANONYMOUS_DRAFT_CONTINUE` | `allow` |
| Signed-in draft start | `RCP_170_SIGNED_IN_DRAFT_START` | `allow` |
| Authenticated request status view | `RCP_170_AUTHENTICATED_REQUEST_STATUS_VIEW` | `allow` |
| Draft claim into authenticated account | `RCP_170_DRAFT_CLAIM_INTO_AUTHENTICATED_ACCOUNT` | `step_up_required` until authority accepts binding. |
| Post-sign-in attachment addition | `RCP_170_POST_SIGN_IN_ATTACHMENT_ADDITION` | `allow` when linked and fresh. |
| SMS continuation for phone-seeded drafts | `RCP_170_SMS_CONTINUATION_PHONE_SEEDED_DRAFT` | `recover_only` |
| Future protected records | `RCP_170_FUTURE_PROTECTED_RECORDS` | `deny` placeholder. |
| Future booking-style surfaces | `RCP_170_FUTURE_BOOKING_SURFACES` | `deny` placeholder. |
| Unknown protected route | `RCP_170_UNKNOWN_PROTECTED_ROUTE_FALLBACK` | `deny` |

## Grant And Capability Ceilings

Route profiles declare the maximum grant a surface can receive. `CapabilityDecision` may only preserve or lower that ceiling. `AccessGrantService` must not promote a continuation, draft, status, or attachment grant beyond the decision envelope.

| Ceiling | Intended use |
| --- | --- |
| `none` | No grant. |
| `draft_lease_only` | Anonymous draft start or continuation. |
| `continuation_recovery_only` | SMS continuation and identity repair. |
| `authenticated_draft_only` | Signed-in draft start or claim after step-up. |
| `request_status_read` | Authenticated status view only. |
| `request_attachment_write` | Post-sign-in attachment write scoped to linked request. |
| `future_denied` | Future placeholder surfaces that must not activate yet. |

## Gap Closures

The gap log in `data/analysis/170_trust_gap_log.json` resolves the mandatory closures:

| Closure | Contract evidence |
| --- | --- |
| Route-profile registry prevents auth, claim, patient-link, and session drift. | Route profiles plus capability matrix. |
| Evidence vault boundary prevents identity evidence leakage. | Evidence envelope schema plus security rules. |
| Future channels have shared contract rows now. | Future records and booking denied placeholders. |
| Identity repair is bound to authority and capability model. | Authority rules plus patient-link boundary. |
| Unknown protected routes deny by default. | Registry fallback plus validator. |

## Verification

`tools/analysis/validate_phase2_trust_contracts.py` verifies the frozen vocabulary, required route-profile coverage, future placeholder behavior, authority mutation boundary, evidence vault boundary, atlas parity markers, package wiring, and checklist state for `seq_170`.
