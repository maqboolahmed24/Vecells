# NHS App Channel Activation Runbook

Generated: 2026-04-28T00:00:00.000Z

## Authority

Use data/channel/486_nhs_app_manifest_activation_plan.json, data/channel/486_nhs_app_channel_enablement_command.json, and data/channel/486_nhs_app_channel_enablement_settlement.json as the activation authority. Do not enable NHS App exposure from a feature flag, route label, or dashboard-only note.

## Activation sequence

1. Confirm the manifest version is approved and matches the live NHS App environment profile.
2. Confirm SCAL, security, clinical safety, privacy, incident rehearsal, route contracts, embedded coverage, runtime publication, release watch tuple, and route freeze disposition all bind to the same tuple.
3. Confirm the limited-release tenant, cohort, wave, and journey scope exactly match the command.
4. Confirm every embedded route has route coverage, hidden supplier chrome, safe return, no raw sensitive telemetry, and governed fallback for unsupported download, print, or browser handoff behavior.
5. Confirm monthly data generation and journey-change notice obligations are current.
6. Settle the command into WORM audit before any patient exposure changes.
7. On any mismatch, keep the channel deferred or hidden and use the RouteFreezeDisposition safe route.

## Active result

- Plan: manifest_activation_plan_486_approved_embedded
- Manifest: nhsapp-manifest-v0.1.0-freeze-374
- Decision: approved
- Settlement: applied
- Channel exposure: enabled
