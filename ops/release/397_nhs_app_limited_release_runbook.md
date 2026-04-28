# 397 NHS App Limited Release Runbook

## Scope

This runbook governs limited release, route freeze, kill switch, full-release expansion, monthly pack generation, and change-notice handling for the NHS App embedded channel.

## Operating Steps

1. Validate `data/config/397_channel_release_cohort_manifest.example.json` and confirm the manifest tuple matches the current release approval freeze.
2. Enable only cohorts declared as `ChannelReleaseCohort`; do not use ad hoc feature flags for journey exposure.
3. Monitor `ReleaseGuardrailPolicy:397:nhs-app-limited-release` for telemetry missing, threshold breach, assurance slice degradation, compatibility drift, and continuity degradation.
4. On any freeze trigger, open or reuse a `ChannelReleaseFreezeRecord` and resolve each journey through `RouteFreezeDisposition`.
5. If severity crosses rollback posture, activate `KillSwitch:397:disable-nhs-app-jump-off-without-redeploy`; this disables jump-off without redeploy and keeps browser safe routes available.
6. Release a freeze only with an explicit operator note, the same manifest tuple, and a fresh green window of at least `P7D`.
7. Generate the monthly `NHSAppPerformancePack` from aggregate event contracts and run redaction checks before export.
8. Submit a typed `JourneyChangeNotice` before any affected journey changes: minor changes require one month; significant or new journeys require three months.

## Freeze Dispositions

| Journey                       | Disposition              | Patient-safe behavior                                                            |
| ----------------------------- | ------------------------ | -------------------------------------------------------------------------------- |
| `jp_start_medical_request`    | `placeholder_only`       | Show unavailable summary and route to existing request list or practice contact. |
| `jp_request_status`           | `read_only`              | Keep status readable while blocking unsafe write actions.                        |
| `jp_manage_local_appointment` | `redirect_to_safe_route` | Send users to the browser appointment safe route.                                |
| `jp_pharmacy_status`          | `read_only`              | Keep pharmacy status summary readable.                                           |

## Evidence

Browser rehearsal evidence is written to `output/playwright/397_*` and must not include raw JWTs, grant IDs, patient identifiers, NHS numbers, or PHI query strings.
