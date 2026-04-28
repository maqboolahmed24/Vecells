# 425 Model Vendor Project And Key Runbook

## Scope

Task 425 provisions only non-production, governed references for the Phase 8 assistive model-vendor boundary. The repository-selected path is `vecells_assistive_vendor_watch_shadow_twin`, because the current dependency rows mark `dep_assistive_model_vendor_family` as optional, watch-only, and replaceable by simulator.

This runbook does not create production accounts, issue raw API keys, bypass MFA, or mutate a live vendor console.

## Inputs

- `data/config/425_model_vendor_registry.example.yaml`
- `data/config/425_model_vendor_project_manifest.example.json`
- `data/config/425_model_vendor_key_reference_manifest.example.json`
- `data/contracts/425_model_vendor_project_and_key_contract.json`
- `data/analysis/425_project_key_readiness_matrix.csv`
- `data/analysis/credential_capture_checklist.csv#CAPTURE_SEC_ASSISTIVE_PREPROD_VENDOR_KEY`

## Mode Law

- `dry_run`: load manifests, detect the primary provider from repo evidence, and verify masked references.
- `rehearsal`: exercise the local Playwright harness against redacted evidence and local watch-twin rows.
- `verify`: re-check project identity, member binding, scopes, secret references, masked fingerprints, and readiness matrix output.
- `apply`: blocked. Apply may only be added by a future provider-selection artifact with named approver, environment target, intended-use review, subprocessor review, rollback rehearsal, and explicit mutation approval.

## Procedure

1. Run `pnpm validate:425-model-vendor-project-setup`.
2. Confirm primary provider detection returns `vecells_assistive_vendor_watch_shadow_twin`.
3. Confirm every environment has `productionAllowed: false`.
4. Confirm every project has `operationModes.apply: false`.
5. Confirm every service identity has a `member://` binding, owner role, scoped capability references, and a key reference.
6. Confirm every key reference uses a managed locator only and has a `fp_sha256_` masked fingerprint.
7. Run the browser automation specs in dry-run and verify modes.
8. Store only redacted screenshots, traces, and readiness summaries. Do not capture raw keys, secret locators, provider session tokens, or dashboard pages after a secret boundary.

## Approval Gates

- `GATE_P8_PARALLEL_MERGE`
- `GATE_OPTIONAL_ASSISTIVE_ENABLEMENT`
- `LIVE_GATE_ASSISTIVE_INTENDED_USE_REVIEW`
- `LIVE_GATE_MODEL_VENDOR_PROVIDER_SELECTED` for any future external provider

## Failure Handling

If provider detection is ambiguous, if any live-provider environment variable appears in runtime config, if a raw-secret field appears, or if a project enables apply mode, stop the run and leave the assistive capability in watch-only, shadow-only, observe-only, provenance-only, or hidden posture.

## Evidence

Successful dry-run or verify evidence is the tuple of:

- validation output from `tools/analysis/validate_425_model_vendor_project_setup.ts`
- readiness matrix row with `ready_for_dry_run_rehearsal_verify` or blocked placeholder reason
- masked fingerprint rows from the key-reference manifest
- Playwright redacted harness screenshot and JSON summary, when browser automation is run
