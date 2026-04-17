# Route Capability Profile Registry

Status: frozen for Phase 2 trust-kernel consumers  
Registry: `data/contracts/170_route_capability_profiles.yaml`

The registry-level `unknownProfileBehavior` value is frozen to `deny`.

## Contract Shape

Each `RouteCapabilityProfile` row defines the route family, protected surface, required identity posture, default decision, grant ceiling, and authority boundary for a protected route. It is not application routing code; it is the shared policy contract that application route guards, BFFs, capability evaluation, and grants must agree on.

| Field                      | Required meaning                                                                        |
| -------------------------- | --------------------------------------------------------------------------------------- |
| `profileId`                | Stable profile reference used by route guards and `CapabilityDecision.routeProfileRef`. |
| `routeFamilyRef`           | Route family owning the protected surface.                                              |
| `surfaceRef`               | Canonical protected surface key.                                                        |
| `routePathPattern`         | Human-readable route pattern or fallback marker.                                        |
| `lifecycle`                | `current`, `planned_phase2`, `future_profile_pending`, or `fallback`.                   |
| `requiredCapability`       | Capability evaluated for the surface.                                                   |
| `acceptedIdentitySources`  | Allowed source contexts before restrictions are applied.                                |
| `minimumVerificationLevel` | Floor before patient-link and policy checks.                                            |
| `patientLinkPosture`       | Required or accepted patient-link posture.                                              |
| `defaultDecision`          | Baseline decision before per-request restrictions.                                      |
| `grantCeiling`             | Maximum grant the profile can ever receive.                                             |
| `writableAuthorityState`   | Whether the route can write non-identity domain state.                                  |
| `futureProfilePending`     | True only for denied future placeholders.                                               |
| `evidenceBoundary`         | Must be `vault_reference_only`.                                                         |
| `owningAuthority`          | Policy owner; not necessarily a writer.                                                 |
| `reasonCodes`              | Canonical reason-code family for audit and UI explanation.                              |

## Frozen Profiles

| Profile                                          | Surface                                  | Lifecycle                | Default decision   | Grant ceiling                |
| ------------------------------------------------ | ---------------------------------------- | ------------------------ | ------------------ | ---------------------------- |
| `RCP_170_ANONYMOUS_DRAFT_START`                  | `anonymous_draft_start`                  | `current`                | `allow`            | `draft_lease_only`           |
| `RCP_170_ANONYMOUS_DRAFT_CONTINUE`               | `anonymous_draft_continue`               | `current`                | `allow`            | `draft_lease_only`           |
| `RCP_170_SIGNED_IN_DRAFT_START`                  | `signed_in_draft_start`                  | `planned_phase2`         | `allow`            | `authenticated_draft_only`   |
| `RCP_170_AUTHENTICATED_REQUEST_STATUS_VIEW`      | `authenticated_request_status_view`      | `planned_phase2`         | `allow`            | `request_status_read`        |
| `RCP_170_DRAFT_CLAIM_INTO_AUTHENTICATED_ACCOUNT` | `draft_claim_into_authenticated_account` | `planned_phase2`         | `step_up_required` | `authenticated_draft_only`   |
| `RCP_170_POST_SIGN_IN_ATTACHMENT_ADDITION`       | `post_sign_in_attachment_addition`       | `planned_phase2`         | `allow`            | `request_attachment_write`   |
| `RCP_170_SMS_CONTINUATION_PHONE_SEEDED_DRAFT`    | `sms_continuation_phone_seeded_draft`    | `planned_phase2`         | `recover_only`     | `continuation_recovery_only` |
| `RCP_170_IDENTITY_REPAIR_HOLD`                   | `identity_repair_hold`                   | `planned_phase2`         | `recover_only`     | `continuation_recovery_only` |
| `RCP_170_FUTURE_PROTECTED_RECORDS`               | `future_protected_records`               | `future_profile_pending` | `deny`             | `future_denied`              |
| `RCP_170_FUTURE_BOOKING_SURFACES`                | `future_booking_surfaces`                | `future_profile_pending` | `deny`             | `future_denied`              |
| `RCP_170_UNKNOWN_PROTECTED_ROUTE_FALLBACK`       | `unknown_protected_route`                | `fallback`               | `deny`             | `none`                       |

## Evaluation Contract

Consumers must follow these rules:

1. Resolve the route to a profile before capability evaluation.
2. If no exact profile matches a protected route, use deny-by-default behavior.
3. Treat `future_profile_pending` rows as denied placeholders, not implementation permission.
4. Treat `defaultDecision` as the starting point; per-request restrictions may only preserve or lower capability.
5. Never allow grants above `grantCeiling`.
6. Never write `IdentityBinding` from route guards, patient-link checks, grants, sessions, or auth bridge code.

## Drift Prevention

The registry prevents four drift modes:

| Drift mode         | Registry control                                                       |
| ------------------ | ---------------------------------------------------------------------- |
| Auth route drift   | Route guards consume the same profile refs as the capability engine.   |
| Claim route drift  | Draft claim routes have step-up and authority-signal semantics frozen. |
| Patient-link drift | Patient-link posture is an input, not a session substitute.            |
| Session drift      | `LocalSessionAuthority` freshness does not imply patient ownership.    |

## Validator Expectations

`pnpm validate:phase2-trust-contracts` fails if:

1. Any required protected surface lacks a profile row.
2. Unknown protected routes are not denied by default.
3. Future records or booking profiles are omitted or not denied.
4. Route profile decisions use vocabulary outside `allow`, `step_up_required`, `recover_only`, or `deny`.
5. Any profile omits `vault_reference_only`.
6. The atlas lacks diagram-to-table parity coverage.
