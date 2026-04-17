# 147 Masking And Route Truth Boundary

This task separates three truths that must not collapse into each other:

1. what the patient chose
2. what ordinary surfaces may display
3. what later delivery or callback flows may treat as route truth

## Protected capture vs ordinary surface

Protected capture rows may store:

- raw SMS destination
- raw phone destination
- raw email destination
- normalized protected destination values
- append-only source evidence and change lineage

Ordinary draft, receipt, and status surfaces may only consume:

- `preferredChannel`
- masked destination summaries
- contact timing preference
- voicemail choice
- explicit follow-up permission state
- language, translation, and accessibility summary
- completeness state and machine-readable reason codes

Raw destinations are forbidden in:

- logs
- telemetry payloads
- analytics payloads
- DOM markers
- URLs
- ordinary patient or staff summaries

## Route truth boundary

Contact-preference capture is not reachability clearance.

- A captured email address does not imply deliverability.
- A captured phone number does not imply callback safety.
- A captured SMS number does not imply that transport acceptance later means the route is healthy.

The only bridge produced here is `Phase1ContactRouteSnapshotSeed`, which carries:

- the route kind
- the route and route-version refs
- the normalized-address ref
- masked destination for display parity
- conservative freshness posture
- `verificationState = unverified`

Later delivery-dependent flows must still:

1. mint an actual `ContactRouteSnapshot` from the seed
2. bind any active delivery or callback dependency to that snapshot
3. settle `ReachabilityAssessmentRecord` truth independently

That keeps preference selection, route authority, and current reachability risk separate, which is the fail-closed rule the Phase 1 and Phase 0 blueprints both require.
