# 330 Network Manage And Message Timeline Spec

## Intent

`Network_Appointment_Timeline_Workspace` is the Phase 5 patient manage surface for booked network appointments.
It keeps appointment summary, reminder truth, callback fallback, same-shell settlement, and contact-route repair inside one current shell family.

This route is not:

- a detached notification centre
- a clone of local manage
- a chat thread
- a generic support redirect

## Route family

- primary route: `/bookings/network/manage/:scenarioId`
- current scenario set:
  - `network_manage_330_live`
  - `network_manage_330_applied`
  - `network_manage_330_provider_pending`
  - `network_manage_330_contact_repair`
  - `network_manage_330_stale_recoverable`
  - `network_manage_330_read_only`
  - `network_manage_330_reconciliation_required`
  - `network_manage_330_identity_recheck`
  - `network_manage_330_unsupported_reschedule`

## Surface regions

1. `NetworkAppointmentManageView`
   Summary-first appointment card with the current appointment anchor and current message context.
2. `NetworkManageCapabilityPanel`
   One leased authority panel for capability state, read-only posture, and blockers.
3. `MessageTimelineClusterView`
   One conversation timeline that keeps reminder rows, callback fallback, and manage settlement in the same grammar.
4. `ReminderDeliveryStateCard`
   Secondary rail summary for current reminder and delivery posture.
5. `HubManageSettlementPanel`
   Same-shell settlement receipt for applied, provider-pending, stale-recoverable, blocked, reconciliation-required, identity-recheck, and unsupported outcomes.
6. `ContactRouteRepairInlineJourney`
   Inline repair branch that preserves appointment anchor and current message context.
7. `NetworkManageReadOnlyState`
   Explicit read-only explanation when confirmation truth, supplier drift, stale continuity, or unsupported capability blocks normal actionability.
8. `NetworkManageActionPanel`
   Next-safe-action area with only tuple-safe actions.

## Authoritative laws

- Manage actionability is derived from current capability, continuity evidence, and current truth tuple.
- Reminder notices and reminder failures stay in the unified timeline instead of detached banners.
- Callback fallback remains a separate governed path even when it renders in the same timeline.
- Same-shell settlement must explain blocked, stale, provider-pending, unsupported, identity, and reconciliation outcomes without widening calmness.
- Contact-route repair preserves appointment anchor and selected message context.
- Read-only posture keeps the appointment summary visible while demoting stale or unsafe CTAs in place.

## Mandatory DOM markers

- `data-network-manage`
- `data-manage-capability`
- `data-reminder-row`
- `data-message-timeline`
- `data-manage-settlement`
- `data-contact-repair`

## CTA map

- `Request a different time`
  Governing objects: `NetworkManageCapabilities`, current continuity evidence, `HubManageSettlement(provider_pending)`
- `Update access details`
  Governing objects: `NetworkManageCapabilities`, current continuity evidence, `HubManageSettlement(applied)`
- `Cancel this appointment`
  Governing objects: `NetworkManageCapabilities`, current continuity evidence, same-shell settlement publication
- `Repair contact route`
  Governing objects: reminder delivery failure, reachability assessment, contact repair journey, capability refresh
- `Refresh manage status`
  Governing objects: stale capability or reconciliation/identity recovery posture
- `Request callback instead`
  Governing objects: callback fallback path, current timeline cluster, provider-pending settlement when used

## Timeline grammar

- `reminder_scheduled`
  Reminder plan exists and is still bound to the current route and truth tuple.
- `reminder_delivered`
  Delivery evidence is current and can support reminder calmness.
- `reminder_failed`
  Delivery failure remains visible until repair settles.
- `reminder_suppressed`
  Reminder promise is intentionally withheld while confirmation or trust is provisional.
- `callback_fallback`
  Separate fallback path, rendered in the same cluster but not merged into reminder semantics.
- `manage_settlement`
  Same-shell command result, never a detached toast.

## Responsive posture

- desktop: summary/manage main pane plus detail rail
- mobile: one-column order remains summary -> capability -> timeline -> settlement/repair -> actions
- folded mission stack: sticky tray uses the current next-safe action and must not obscure focus

## Confirmation handoff

`patient-network-confirmation` now opens the matching 330 route family:

- pending confirmation -> `network_manage_330_read_only`
- practice informed / practice acknowledged -> `network_manage_330_live`
- disputed / supplier drift -> `network_manage_330_reconciliation_required`
