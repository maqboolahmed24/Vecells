# 330 Algorithm Alignment Notes

## Summary

This route maps every visible action and message row to the current Phase 5 manage, reminder, and continuity truth chain.
Nothing on the route widens calmness from local UI state.

## CTA alignment

- `Request a different time`
  - governing objects: `NetworkManageCapabilities`, current continuity evidence, `HubManageSettlement(result = provider_pending)`
  - visible posture: button is present only while capability is live; otherwise the route shifts to explicit pending or read-only posture
- `Update access details`
  - governing objects: `NetworkManageCapabilities`, same-shell settlement chain, current appointment anchor
  - visible posture: applied settlement is recorded in the timeline and the settlement panel
- `Cancel this appointment`
  - governing objects: `NetworkManageCapabilities`, same-shell settlement chain
  - visible posture: destructive copy stays inside the route instead of a quiet toast
- `Repair contact route`
  - governing objects: reminder delivery failure, reachability dispute, contact repair journey, capability refresh
  - visible posture: repair keeps appointment anchor and selected timeline row visible
- `Refresh manage status`
  - governing objects: stale capability, reconciliation review, or identity recheck posture
  - visible posture: last safe summary remains visible while writable posture is withheld
- `Request callback instead`
  - governing objects: callback fallback path, current cluster binding, optional provider-pending settlement
  - visible posture: callback fallback remains a separate governed action, not a reminder row alias

## Timeline row alignment

- `reminder_scheduled`
  - authority: current reminder plan and current route snapshot
- `reminder_delivered`
  - authority: current delivery evidence
- `reminder_failed`
  - authority: current delivery evidence dispute or failure
- `reminder_suppressed`
  - authority: current reminder truth withheld because confirmation or trust is provisional
- `callback_fallback`
  - authority: callback fallback path for the current appointment
- `manage_settlement`
  - authority: same-shell `HubManageSettlement`

## Recovery laws enforced

- stale or blocked manage posture demotes the existing panel in place
- reminder and callback rows remain in one thread instead of forking into appointment-only banners
- read-only posture keeps the appointment summary visible but suppresses unsafe calmness
- contact-route repair and refresh keep the current appointment anchor and selected message context
