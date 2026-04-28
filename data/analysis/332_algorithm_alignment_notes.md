# 332 Algorithm Alignment Notes

## Governing runtime objects to UI surfaces

| UI surface | Primary backend/runtime object | Required truth law |
| --- | --- | --- |
| `HubActingContextChip` | `StaffIdentityContext`, `ActingContext` | active organisation, site, role, purpose, and elevation may not hide in account chrome |
| `HubScopeSummaryStrip` | `ActingScopeTuple`, `CrossOrganisationVisibilityEnvelope` | tuple, audience tier, and minimum-necessary contract stay visible in the shell |
| `OrganisationSwitchDrawer` | `ActingContextGovernor` | organisation or site switching may preserve, freeze, or deny explicitly, but never silently reinterpret the route |
| `ActingSiteSwitcher` | `ActingContext`, `ActingScopeTuple.switchGeneration` | site changes remain same-shell and can change expiry or read-only posture without route loss |
| `PurposeOfUsePanel` | `ActingContext`, `ActingContextDriftRecord` | purpose changes supersede the tuple and can freeze the current case |
| `BreakGlassReasonModal` | `ActingContext`, `BreakGlassAuditRecord` | elevation requires explicit reason-coded activation and can also deny or revoke explicitly |
| `AccessScopeTransitionReceipt` | `ActingScopeTuple`, `RouteIntentBinding`, selected-anchor contract | the same case anchor and return path survive scope change receipts |
| `ScopeDriftFreezeBanner` | `ActingContextDriftRecord`, `ScopedMutationGate` | stale tuple or visibility drift freezes write posture in place |
| `VisibilityEnvelopeLegend` | `CrossOrganisationVisibilityEnvelope`, `MinimumNecessaryContract.*` | audience tiers explain what remains visible and what must be withheld |
| `MinimumNecessaryPlaceholderBlock` | `CrossOrganisationVisibilityEnvelope`, `MinimumNecessaryContract.*` | hidden fields must look intentionally withheld rather than missing |
| `HubAccessDeniedState` | `ScopedMutationGate`, `AuthorityEvidenceRecord` | denied posture blocks detail more strongly than read-only posture |

## Local scenario bindings

- `north_shore_hub / coordination_desk / direct_care_coordination` is the writable hub tuple
- `riverside_medical / callback_console / practice_follow_up` is the origin-practice read-only tuple
- `elm_park_surgery / delivery_desk / site_delivery` is the servicing-site read-only tuple
- `south_vale_network / intake_desk / direct_care_coordination` is the denied-scope tuple
- `north_shore_hub / coordination_desk / service_recovery_review` is the explicit same-shell freeze path
- `north_shore_hub / escalation_room / direct_care_coordination` plus active break-glass is the expiring elevated path

## Shell laws carried forward

- selected case anchor remains stable across queue, case, alternatives, exceptions, and audit routes from `326`
- ranked queue, option-card anchor, and decision consequences remain authoritative from `327`
- confirmation and practice visibility surfaces continue to mount later under the same access grammar from `329`
- no-slot and reopen recovery surfaces remain same-shell and now inherit explicit scope posture from `331`
