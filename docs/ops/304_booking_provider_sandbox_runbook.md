# 304 Booking Provider Sandbox Runbook

## Purpose

This runbook tells operators how to converge the Phase 4 booking-provider sandbox registry without relying on tribal knowledge. The source of truth is the generated manifest set plus the current provider binding identity from the booking capability engine.

Controlled artifacts:

- `ops/providers/304_provider_sandbox_registry.yaml`
- `ops/providers/304_provider_callback_manifest.yaml`
- `ops/providers/304_provider_environment_matrix.csv`
- `data/analysis/304_provider_setup_gap_register.json`
- `data/analysis/PHASE4_INTERFACE_GAP_PROVIDER_SANDBOX_PORTAL_AUTOMATION.json`

## Environment classes

| Environment | Meaning | Mutation posture |
| --- | --- | --- |
| `local_twin` | Fully local rehearsal environment for portal and callback setup | Fully automated |
| `sandbox_twin` | Repo-owned non-production twin that mirrors the portal flow | Fully automated |
| `supported_test_candidate` | Supplier-issued supported test tenant | Manual bridge unless supplier-approved automation exists |
| `integration_candidate` | Direct-care onboarding candidate, such as GP Connect | Manual bridge |
| `ops_manual_twin` | Operations-only routing row with no supplier portal mutation | Registry only |

## Guardrails

1. Never place raw credentials, certificate bodies, or portal session tokens in the repo, screenshots, traces, or notes.
2. Every change must stay bound to the current `providerAdapterBindingRef` and `providerAdapterBindingHash`.
3. Treat environment labels as safety rails. A supported-test or integration candidate row must never be relabeled to look like live.
4. Automated browser proof is allowed only on the local or sandbox twins owned by this repo.

## Bootstrap

Run the deterministic bootstrap:

```bash
node --experimental-strip-types /Users/test/Code/V/scripts/providers/304_bootstrap_provider_sandboxes.ts
```

Optional focused bootstrap:

```bash
node --experimental-strip-types /Users/test/Code/V/scripts/providers/304_bootstrap_provider_sandboxes.ts --sandbox-id sandbox_304_vecells_local_gateway_local_twin
```

What bootstrap does:

- regenerates the three source-controlled manifest files from the shared helper
- resolves the current provider binding for each supported provider row
- converges the local and sandbox portal twins onto the intended callback URL and binding hash
- records a runtime summary in `.artifacts/provider-sandboxes/304`

What bootstrap does not do:

- mutate real supplier supported-test portals
- upload certificates
- widen a manual bridge row into an automated row

## Manual-bridge rows

The following rows remain manual bridge by design:

- `sandbox_304_optum_im1_supported_test`
- `sandbox_304_tpp_im1_patient_supported_test`
- `sandbox_304_tpp_im1_transaction_supported_test`
- `sandbox_304_gp_connect_integration_candidate`

Smallest-safe manual bridge:

1. Open the supplier portal or onboarding surface under approved non-production credentials.
2. Apply only the values already present in the generated registry and callback manifest.
3. Capture masked evidence showing the target environment label, callback target if one exists, and the matching binding hash.
4. Confirm the row back against `ops/providers/304_provider_sandbox_registry.yaml`.

If the portal shows anything outside the generated manifest, stop and treat it as configuration drift.

## Reset

Use reset only on the repo-owned twins:

```bash
node --experimental-strip-types /Users/test/Code/V/scripts/providers/304_reset_provider_sandboxes.ts
```

Optional focused reset:

```bash
node --experimental-strip-types /Users/test/Code/V/scripts/providers/304_reset_provider_sandboxes.ts --sandbox-id sandbox_304_vecells_local_gateway_sandbox_twin
```

Reset removes local runtime registrations from `.artifacts/provider-sandboxes/304`. It does not delete the source-controlled manifests and it must not be used to imply rollback on a real supplier tenant.

## When to stop

Stop and escalate if any of the following occurs:

- the portal shows a binding hash that does not match the generated registry
- a callback row lacks an explicit verification mode
- a manual bridge row appears to need live or production credentials
- a trace, screenshot, or log captures raw secret material

## Reference points

Local implementation authority:

- `docs/architecture/279_phase4_provider_capability_matrix_and_adapter_seam.md`
- `docs/architecture/283_provider_capability_matrix_and_binding_compiler.md`
- `docs/architecture/287_booking_commit_and_confirmation_truth.md`
- `docs/architecture/292_booking_reconciliation_and_confirmation_worker.md`

Official secondary references checked on 20 April 2026:

- [Interface Mechanism 1 API standards](https://digital.nhs.uk/developer/api-catalogue/interface-mechanism-1-standards)
- [Interface mechanisms guidance](https://digital.nhs.uk/services/digital-services-for-integrated-care/im1-pairing-integration/interface-mechanisms-guidance)
- [IM1 Pairing integration](https://digital.nhs.uk/services/digital-services-for-integrated-care/im1-pairing-integration)
- [GP Connect: Appointment Management - FHIR API](https://digital.nhs.uk/developer/api-catalogue/gp-connect-appointment-management-fhir)
