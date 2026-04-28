# 337 Network + Local Appointment Family Merge

## Visual mode

`Unified_Appointment_Family_Workspace`

## Intent

This task merges the Phase 4 local-booking family and the Phase 5 hub-managed family into one patient-facing appointment grammar without collapsing their authoritative sources. The patient should see one appointments workspace, one request-detail downstream rail, one route-entry rule, and one continuity model even though local and network work still resolve through different child objects.

## Authoritative mapping

| Family row | Truth authority | Supporting surface | Manage entry result |
| --- | --- | --- | --- |
| `family_local_confirmed` | `BookingConfirmationTruthProjection` | `PatientAppointmentManageProjection` | local manage or local read-only |
| `family_network_live` | `HubOfferToConfirmationTruthProjection` | `PatientNetworkManageProjection330` | network manage or network read-only |
| `family_waitlist_fallback_due` | local waitlist provenance under `BookingConfirmationTruthProjection` | `PatientBookingWorkspaceEntryProjection` | hub choice / callback recovery |
| `family_callback_follow_on` | `HubOfferToConfirmationTruthProjection` | `PatientNetworkAlternativeChoiceProjection` | current network choice set |

## Implemented family grammar

- `UnifiedAppointmentFamilyResolver` produces one stable row family for `/appointments` and request-detail downstream cards.
- `PatientAppointmentFamilyRow` renders shared row structure while allowing truthful accent and status differences.
- `AppointmentFamilyStatusChip` keeps equivalent wording aligned across local and network truth.
- `AppointmentManageEntryResolver` chooses local manage, network manage, read-only, or callback recovery from current truth and capability instead of stale CTA state.
- `AppointmentFamilyTimelineBridge` keeps reminder, continuity, and fallback rows inside one timeline grammar.
- `HubFallbackRibbon` keeps hub takeover explicit when local waitlist calmness is no longer lawful.
- `NetworkLocalContinuityBinder` and `HubLocalReturnAnchorReceipt` preserve the selected family anchor and return target when the patient moves into hub follow-on work and back.

## Laws locked by 337

1. Object presence never implies calm confirmation. Confirmed wording comes from `BookingConfirmationTruthProjection` or `HubOfferToConfirmationTruthProjection`, not from child-route existence.
2. Equivalent truths use equivalent wording. Local and network confirmed rows both say `Appointment confirmed`; network-only nuances such as `Practice informed` remain secondary disclosure.
3. Pending network truth stays pending, not recovery, unless confirmation truth itself is blocked.
4. Waitlist fallback does not reopen stale local controls. The safe route becomes the hub-managed choice family and the workspace preserves the local provenance.
5. Request detail and the appointments workspace share the same row resolver, so downstream calmness and actions cannot drift between shells.

## Route resolution

- `/appointments` now renders the unified family workspace inside the existing patient shell route.
- `/requests/:requestRef` now renders `PatientRequestDownstreamWorkRail` with the same family rows.
- Local family rows route to `/bookings/:bookingCaseId/manage`.
- Network family rows route to `/bookings/network/manage/:scenarioId`.
- Fallback and callback family rows route to `/bookings/network/:offerSessionId`.
- All child-route launches carry the family ref, entry source, request context where relevant, and a return target for continuity.

## Timeline and continuity

- Local rows bridge booking truth, manage posture, and reminder posture.
- Network rows bridge reminder, callback, and manage settlement clusters from the network manage preview.
- Waitlist rows bridge local need/provenance with callback-safe hub follow-on.
- Returning from hub choice into `/appointments` shows `HubLocalReturnAnchorReceipt` and restores the same selected family row.

## Files of record

- Runtime: `/Users/test/Code/V/apps/patient-web/src/patient-appointment-family-workspace.model.ts`
- UI: `/Users/test/Code/V/apps/patient-web/src/patient-appointment-family-workspace.tsx`
- Shell integration: `/Users/test/Code/V/apps/patient-web/src/patient-shell-seed.tsx`
- Request-detail integration: `/Users/test/Code/V/apps/patient-web/src/patient-home-requests-detail-routes.tsx`
- Playwright proof: `/Users/test/Code/V/tests/playwright/337_appointment_family_list_and_detail.spec.ts`, `/Users/test/Code/V/tests/playwright/337_appointment_manage_entry_resolution.spec.ts`, `/Users/test/Code/V/tests/playwright/337_appointment_family_timeline_and_recovery.spec.ts`

