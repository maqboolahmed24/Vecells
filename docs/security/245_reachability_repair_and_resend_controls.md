# 245 Reachability Repair And Resend Controls

## Control posture

- send success does not imply reachable route
- stale or broken contact-route posture suppresses stale reply and callback affordances
- `contact_route_repair` is the only repair-entry grant issued by `245`
- controlled resend, channel change, attachment recovery, and callback reschedule return blocked posture until the repair chain is clear

## Fail-closed rules

1. A message or callback failure never edits calm health flags directly.
2. Duplicate repair requests return the current `ContactRouteRepairJourney`; they do not fork a second repair branch.
3. Duplicate resend or reschedule authorization returns the existing live authorization on the same reachability epoch.
4. Route edits alone do not restore actionability.
5. Repair completes only after a fresh snapshot, successful verification where required, a clear assessment, and dependency rebound on the current reachability epoch.

## Governing checks

- `ReachabilityAssessmentRecord.routeAuthorityState` must be `current`
- `ReachabilityAssessmentRecord.assessmentState` must be `clear`
- `ReachabilityDependency.repairState` must be `none`
- the active repair journey must be closed
- the governing `ThreadResolutionGate` or `CallbackResolutionGate` or the terminal evidence chain must still authorize the new effect

## Accepted mock-now limits

- secure-message and telephony transports are still simulator-backed
- external demographic or preference drift feeds are still represented as authoritative observations rather than live upstream subscriptions
