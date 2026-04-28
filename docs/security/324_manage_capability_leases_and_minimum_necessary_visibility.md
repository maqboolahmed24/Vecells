# 324 Manage Capability Leases And Minimum Necessary Visibility

## Security posture

`par_324` fails closed on stale truth instead of leaving stale patient-manage affordances or stale practice visibility live.

## Manage lease controls

`NetworkManageCapabilities` degrades immediately when any of the following are no longer current:

- acknowledgement debt is open
- continuity validation is blocked or degraded
- supplier drift or manage freeze is active
- contact-route trust or reachability trust requires repair
- subject binding is stale
- publication posture is stale
- session lease is expired
- embedded release freeze or rollback posture is active
- identity hold is active

The degraded lease stays read-only and carries typed `blockedReasonRefs` plus one `fallbackRouteRef`. No later UI layer is allowed to recover that capability locally.

## Same-shell mutation controls

- Every manage mutation produces one `HubManageSettlement`.
- `details_update` may not carry clinically meaningful free text through this path. If clinical content is present, the engine settles `unsupported_capability` and keeps the case in the same shell.
- Accepted or pending mutations immediately degrade the prior lease to `post_mutation_refresh_required` so the shell cannot keep rendering stale interactive posture.

## Practice visibility controls

- `PracticeVisibilityProjection` is generated only from the current `CrossOrganisationVisibilityEnvelope`, current `ActingScopeTuple`, current policy evaluation, and current minimum-necessary audience projection.
- The projection carries allowed and hidden field refs explicitly. Origin-practice surfaces may not reconstruct hidden chronology or hub-only notes from adjacent objects.
- Projection refresh is monotone: older acknowledgement generations and older envelope versions are rejected by invariant checks before write.

## Reminder and re-ack controls

- Reminder plans never imply ordinary reassurance until confirmation is authoritative and route trust is still current.
- Reminder delivery failure, expiry, or dispute reopens practice acknowledgement debt through the continuity service and appends a new `PracticeVisibilityDeltaRecord`.
- Reminder failure cannot quietly thaw manage posture because the reopened acknowledgement debt and reminder recovery posture keep the shell in explicit recovery.

## Current boundary

The final patient-facing timeline renderer is still owned by `330`. `324` therefore stores canonical reminder timeline publications and exposes them through the query surface, but does not allow the renderer to invent or suppress reminder truth locally.
