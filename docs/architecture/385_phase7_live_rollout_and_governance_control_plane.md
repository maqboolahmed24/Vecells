# 385 Phase 7 Live Rollout and Governance Control Plane

## Scope

The live control plane governs NHS App channel rollout after the route-readiness verifier and the environment/telemetry service are already green. It is intentionally downstream of task 383 and 384 truth:

- `RouteReadinessResult` and `PromotionReadinessResult` remain the route and continuity evidence authority.
- `NHSAppEnvironmentProfile`, `ChannelTelemetryPlan`, and `SCALBundle` remain the environment, privacy-safe telemetry, and assurance-pack authority.
- `ChannelReleaseCohort`, `ReleaseGuardrailPolicy`, `ChannelReleaseFreezeRecord`, `RouteFreezeDisposition`, `NHSAppPerformancePack`, and `JourneyChangeNotice` are the live rollout objects introduced here.

## Release Gates

`ChannelReleaseCohort` can move to `enabled` only when all of the following are true under the same manifest and release approval freeze tuple:

- environment profile parity is `matching`
- every cohort journey is `promotable`
- telemetry is present and backed by the 384 event contracts
- compatibility evidence is current
- continuity evidence is current
- release guardrail sample size and error thresholds are green
- no active `ChannelReleaseFreezeRecord` exists for the same cohort tuple

## Freeze Law

The control plane opens a `ChannelReleaseFreezeRecord` automatically when telemetry is missing, a threshold is breached, an assurance slice is degraded or quarantined, compatibility drifts, or continuity evidence degrades. Expansion is frozen immediately and the record carries the manifest version, release approval freeze ref, affected cohort, affected journeys, trigger type, assurance refs, continuity refs, state, and operator note ref.

`RouteFreezeDisposition` is resolved only from an active freeze record with the same tuple. Supported patient-safe modes are `hidden`, `read_only`, `placeholder_only`, and `redirect_to_safe_route`.

## Operational Decisions

Live decisions are auditable through `LiveControlAuditEvent` records for enable, blocked, freeze, release, rollback recommendation, and kill-switch activation. Kill-switch activation uses the cohort `killSwitchRef` and moves the cohort to `kill_switch_active` without a redeploy.

Rollback recommendation is separate from kill switch. It is emitted when guardrail observations exceed severe thresholds or a safety issue appears; the rollback action is `disable_jump_off_and_restore_browser_route`.

## Monthly Pack

`NHSAppPerformancePack` is generated from the 384 `ChannelTelemetryPlan` and event contract refs. It contains journey usage, completion rates, drop-offs, guardrail breaches, incident summaries, accessibility issues, and safety issues. Raw JWTs, grants, patient identifiers, and PHI query strings stay outside the pack because event validation remains owned by task 384.

## Change Notices

`JourneyChangeNotice` records minor, significant, and new-journey changes against a manifest version. Minor changes require `P1M`; significant and new-journey changes require `P3M`. Notices with insufficient lead time are stored as `blocked_lead_time` and audited.
