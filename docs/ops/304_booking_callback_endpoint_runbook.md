# 304 Booking Callback Endpoint Runbook

## Purpose

This runbook covers callback-endpoint registration, verification, and replay-safe proof for the booking-provider sandboxes defined in task `304`.

The callback source of truth is:

- `ops/providers/304_provider_callback_manifest.yaml`
- `ops/providers/304_provider_sandbox_registry.yaml`

## Verification modes

| Mode | Meaning | Expected proof |
| --- | --- | --- |
| `hmac_sha256` | Repo-owned callback endpoint with HMAC validation | Registered row plus replay-safe receipt smoke |
| `hmac_sha256_local_component` | Local-component-backed callback | Registered row plus replay-safe receipt smoke |
| `read_after_write_followup` | No supplier callback; truth comes from later authoritative read | Correct binding hash and authoritative-read policy only |
| `ssp_direct_response_only` | Direct-care request/response without supplier webhook | Direct response plus later authoritative read or manage proof |
| `manual_settlement_queue` | Manual outcome queue, not a supplier callback | Manual-only posture must stay explicit |

## Verification command

```bash
node --experimental-strip-types /Users/test/Code/V/scripts/providers/304_verify_provider_callbacks.ts
```

Focused verification:

```bash
node --experimental-strip-types /Users/test/Code/V/scripts/providers/304_verify_provider_callbacks.ts --sandbox-id sandbox_304_vecells_local_gateway_local_twin
```

The verification summary is written to:

- `.artifacts/provider-sandboxes/304/304_provider_callback_verification_summary.json`

In the local provider-portal twin, the same operation is surfaced through the `Verify all callback rows` action on the callback registry page.

## What counts as verified

### Supplier-callback rows

For `supplier_callback` rows, verification succeeds only when:

1. bootstrap has already registered the expected callback URL for the current binding hash
2. the replay smoke records the exact decision-class chain:
   - `accepted_new`
   - `semantic_replay`
   - `stale_ignored`
3. the callback remains bound to the intended environment and adapter identity

### Read-after-write rows

For `authoritative_read_after_write` rows, verification means:

- the row explicitly carries no callback URL
- the environment and binding identity match the registry
- the row points to the correct authoritative-read and confirmation policy

### Manual or unsupported rows

For `manual_attestation` and `not_supported` rows, verification is posture validation, not webhook execution. The manifest must make the limitation explicit so later tasks do not overclaim automation.

## Browser proof

The Playwright portal twin proves:

- login and navigation to the provider sandbox surface
- masked callback target convergence for the automated twins
- callback verification results rendered in the browser without exposing raw secrets
- clear manual-bridge banners for the unsupported supplier-portal rows

Expected browser artifacts:

- screenshots under `output/playwright`
- trace zips under `output/playwright`

## Failure handling

| Failure | Meaning | Response |
| --- | --- | --- |
| Missing runtime registration | Bootstrap has not converged the row, or the binding hash changed | Re-run bootstrap and compare the manifest row against the current capability engine output |
| Wrong binding hash | Drift between the portal and the current booking adapter binding | Treat as stop-the-line config drift |
| Missing verification mode | The callback row is incomplete | Fix the manifest before any external traffic resumes |
| Manual bridge row presented as automated | Unsafe scope expansion | Revert to manual-bridge posture and update the gap register |

## Reference points

Local implementation authority:

- `packages/domains/booking/src/phase4-booking-capability-engine.ts`
- `services/command-api/src/replay-collision-authority.ts`
- `docs/architecture/287_booking_commit_and_confirmation_truth.md`
- `docs/architecture/292_booking_reconciliation_and_confirmation_worker.md`

Official secondary references checked on 20 April 2026:

- [GP Connect: Appointment Management - FHIR API](https://digital.nhs.uk/developer/api-catalogue/gp-connect-appointment-management-fhir)
- [Interface Mechanism 1 API standards](https://digital.nhs.uk/developer/api-catalogue/interface-mechanism-1-standards)
- [Interface mechanisms guidance](https://digital.nhs.uk/services/digital-services-for-integrated-care/im1-pairing-integration/interface-mechanisms-guidance)
- [FHIR R4 Appointment](https://hl7.org/fhir/r4/appointment.html)
- [FHIR R4 Slot](https://hl7.org/fhir/r4/slot.html)
