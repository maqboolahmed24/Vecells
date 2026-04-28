# 354 Pharmacy Exception Taxonomy and Queue Rules

## Queue families

The pharmacy operations surface is split into six canonical families:

- `pharmacy_active_cases_projection`
- `pharmacy_waiting_for_choice_projection`
- `pharmacy_dispatched_waiting_outcome_projection`
- `pharmacy_bounce_back_projection`
- `pharmacy_dispatch_exception_projection`
- `pharmacy_provider_health_projection`

Queue membership is derived only from upstream truth families. No frontend filter is allowed to decide that a case belongs to or leaves a queue.

## Exception taxonomy

### `discovery_unavailable`

- all currently relevant directory sources are unavailable or failed
- severity is `critical`
- evidence comes from choice truth plus source snapshot refs

### `no_eligible_providers_returned`

- choice truth exists but no visible provider remains
- severity is `warning`
- this stays distinct from raw discovery failure because a successful but empty search is still meaningful

### `dispatch_failed`

- dispatch attempt failed, was rejected, or moved into a disputed rejection posture
- severity is `critical`

### `acknowledgement_missing`

- dispatch is still pending proof before the formal proof deadline
- severity is `urgent`
- this is operational debt, not automatic completion failure

### `outcome_unmatched`

- outcome truth remains unmatched after ingest and review
- severity is `urgent`

### `no_outcome_within_configured_window`

- a confirmed dispatch has exceeded the configured 24-hour outcome window
- severity is `urgent`

### `conflicting_outcomes`

- contradiction score or distinct outcome classifications indicate real conflict
- severity is `critical`

### `reachability_repair_required`

- patient reachability repair is still open
- severity is `urgent` or `critical` when identity repair blocks the route

### `consent_revoked_after_dispatch`

- consent revocation exists after the case has already been dispatched
- severity is `critical`

### `dispatch_proof_stale`

- dispatch proof is expired, disputed, or older than the proof deadline posture allows
- severity is `critical`

## Queue ordering rules

- severity sorts before queue age for the default priority order
- critical work is always surfaced ahead of urgent, warning, and routine work
- queue age then breaks ties within the same severity
- provider health uses the same priority rule, then provider key for deterministic ordering

## Multi-membership rules

A case may appear in more than one operational dimension when the truth requires it. Examples:

- waiting for outcome and stale proof
- waiting for outcome and consent revoked after dispatch
- bounce-back and reachability repair required
- waiting for choice and discovery unavailable

The backend keeps those memberships explicit. It does not force mutual exclusivity.

## Practice visibility rules

- practice visibility is minimum-necessary and audience-safe
- the view includes provider choice, dispatch posture, patient instruction posture, outcome summary refs, blockers, and repair posture
- the view excludes raw transport traces, low-level mailbox logs, and free-form clinical payloads

## Provider health rules

Provider health is first-class and summarizes:

- discovery availability
- dispatch health
- acknowledgement debt
- stale proof backlog
- unmatched or conflicting outcomes
- reachability repair load
- consent revocation debt

Provider health is guidance for work prioritization. It is not a substitute for full audit evidence.

## Changed-since-seen rules

- deltas are computed from durable projection ids and versions
- added, changed, removed, and unchanged are explicit result classes
- ephemeral socket events, notification toasts, and browser restore state are never used as the source of truth

## Operational guidance reinforced by current NHS sources

- GP Connect Update Record remains the structured route when supported
- the dedicated monitored GP email address is a safety-net when GP Connect is unavailable or a new pharmacy workflow is not yet supported there
- MESH and directory evidence improve confidence in route availability, but they do not on their own settle a pharmacy case
