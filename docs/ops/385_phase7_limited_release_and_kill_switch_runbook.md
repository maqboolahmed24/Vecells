# 385 Phase 7 Limited Release and Kill Switch Runbook

## Before Limited Release

1. Confirm 383 route readiness is promotable for every cohort journey.
2. Confirm 384 environment profile parity is matching for Sandpit, AOS, and live profile.
3. Confirm AOS SCAL evidence is ready and the incident rehearsal ref is present.
4. Confirm the agreed limited-release cohort has the expected ODS rules and patient population rules.
5. Run `pnpm validate:385-phase7-live-control`.

## Enable A Cohort

Evaluate `ChannelReleaseCohort:385:limited-release-pharmacy`. The control plane enables only when telemetry is present, sample size is at or above the guardrail minimum, compatibility and continuity evidence are current, and there is no active freeze.

If evaluation returns `blocked`, do not expand the cohort. Resolve the listed evidence or sample-size failure first.

## Automatic Freeze

The service opens `ChannelReleaseFreezeRecord` when any live guardrail requires a freeze:

- `telemetry_missing`
- `threshold_breach`
- `assurance_slice_degraded`
- `compatibility_drift`
- `continuity_evidence_degraded`

Expansion stays frozen until the record is released under the same manifest version and release approval freeze ref.

## Patient-Safe Route Modes

Use `RouteFreezeDisposition` to degrade the route without changing the manifest:

- `read_only` for pharmacy status
- `placeholder_only` for local appointment management
- `hidden` for records and letters summary
- `redirect_to_safe_route` for waitlist response

The disposition must carry the same `manifestVersionRef` and `releaseApprovalFreezeRef` as the freeze record.

## Kill Switch

Activate the kill switch when live telemetry indicates severe failure, safety issue, or a Service Management decision to stop NHS App jump-off traffic. The control plane sets the cohort to `kill_switch_active`, opens or reuses a freeze record, emits `kill_switch_activation`, and uses the rollback action `disable_jump_off_and_restore_browser_route`.

## Release A Freeze

Release only after a sustained green window, resolved incident/remediation evidence, current compatibility evidence, current continuity evidence, and explicit operator note ref. The release call rejects tuple drift.
