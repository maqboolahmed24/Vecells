# 245 Communication Reachability Repair And Controlled Resend

`245` makes callback and clinician-message failure resolve through one governed reachability chain instead of local retry flags.

## Core authorities

- `ReachabilityObservation` is the only intake seam for communication failure, dispute, verification, and drift evidence.
- `ReachabilityAssessmentRecord` is the only current dependency posture.
- `ContactRouteRepairJourney` is the same-shell blocker authority.
- `ContactRouteVerificationCheckpoint` is the only legal repair-completion seam.
- controlled resend, channel change, attachment recovery, and callback reschedule are separate authorization records; they are not implicit dispatch retries.

## Mandatory laws

1. Send acceptance or queued dispatch does not mean the route is healthy.
2. Bounce, invalid route, repeated no-answer, preference drift, demographic drift, dispute, and verification failure append observations and refresh the assessment.
3. `repair_required` or `awaiting_verification` opens or refreshes one live `ContactRouteRepairJourney`.
4. Repair issues only a minimal `contact_route_repair` grant posture.
5. Rebound requires a fresh `ContactRouteSnapshot`, successful verification where required, a fresh clear `ReachabilityAssessmentRecord`, and dependency rebound on the new reachability epoch.
6. Controlled resend is not just another send. It is legal only after the repair chain is clear and the governing gate or terminal evidence chain still authorizes a fresh effect.

## Domain integration

### Callback

- callback failures append observations against one `ReachabilityDependency`
- repeated `no_answer` can now move `CallbackCase` from `no_answer` to `contact_route_repair_pending`
- callback reschedule authorization remains blocked until rebound completes

### Clinician message

- failed or disputed delivery appends observations against one `ReachabilityDependency`
- `ThreadResolutionGate` is driven to `repair_route` when the repair chain dominates
- stale reassurance and stale reply affordances remain suppressed until rebound completes

## Persistence

`245` adds:

- `phase3_communication_repair_bindings`
- `phase3_communication_repair_authorizations`
- `phase3_communication_rebound_records`

These bind the communication object to the canonical reachability dependency, track repair-entry grant rotation, and preserve rebound history for later patient and support projections.
