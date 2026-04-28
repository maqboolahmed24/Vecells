# 305 Provider Capability Evidence Runbook

## Purpose

`seq_305` turns the provider capability matrix into a dated evidence ledger. Every capability claim is tied back to:

- the exact `providerCapabilityMatrixRef`
- the current `providerAdapterBindingRef` and `providerAdapterBindingHash`
- the resolved `capabilityTupleHash`
- one observed environment and one evidence artifact
- masked credential and prerequisite metadata

The 305 ledger does not widen provider semantics. It proves the already-frozen booking capability model from prompts `283`, `291`, and `304`.

## Source artifacts

- `data/providers/305_provider_capability_evidence_registry.json`
- `data/providers/305_provider_capability_evidence_matrix.csv`
- `data/providers/305_provider_test_credential_manifest.json`
- `data/providers/305_provider_prerequisite_registry.json`

## Runtime evidence artifacts

- `.artifacts/provider-evidence/305/305_capability_evidence_capture_summary.json`
- `.artifacts/provider-evidence/305/305_capability_evidence_validation_summary.json`
- `.artifacts/provider-evidence/305/observations/*.json`

## Capture flow

1. Regenerate the source-controlled artifacts.

```bash
node --experimental-strip-types /Users/test/Code/V/scripts/providers/305_capture_capability_evidence.ts
```

2. Review the capture summary.

- `automatedSandboxIds` must contain the two repo-owned local-gateway twins.
- `reviewRequiredSandboxIds` must contain the Optum IM1, TPP IM1 patient, TPP IM1 transaction, and GP Connect rows.
- callback verification for the fully automated twins must remain replay-safe and report `accepted_new`, `semantic_replay`, and `stale_ignored`.

3. Inspect the observation payload for any row that changed.

- confirm `providerAdapterBindingHash` still matches the current provider setup
- confirm the `capabilityTupleHash` is present for every claim row
- confirm evidence status is `current`, `review_required`, or `manual_attested` as expected
- confirm no screenshot, HTML, or trace artifact contains raw `secret://`, `vault://`, or `env://` references

## Manual-bridge policy

The following rows remain explicit manual bridges and must stay `review_required` until a lawful unattended evidence path exists:

- `sandbox_304_optum_im1_supported_test`
- `sandbox_304_tpp_im1_patient_supported_test`
- `sandbox_304_tpp_im1_transaction_supported_test`
- `sandbox_304_gp_connect_integration_candidate`

For these rows, the operator workflow is:

1. compare the generated registry row against the real supplier portal
2. capture masked evidence only
3. keep the evidence row `review_required`
4. attach the narrow provider-specific gap artifact if the portal still cannot be exercised automatically

Do not promote these rows to `current` merely because the code matrix says the behavior exists.

## Playwright proof

Use the browser harness whenever the evidence itself is browser-mediated.

```bash
node --experimental-strip-types /Users/test/Code/V/tests/playwright/305_provider_capability_evidence_capture.spec.ts --run
node --experimental-strip-types /Users/test/Code/V/tests/playwright/305_provider_portal_capability_observation.spec.ts --run
```

Expected output artifacts:

- `output/playwright/305-provider-capability-evidence-capture.png`
- `output/playwright/305-provider-capability-evidence-capture-trace.zip`
- `output/playwright/305-provider-portal-capability-observation.png`
- `output/playwright/305-provider-portal-capability-observation-trace.zip`

## Validation

Run the local 305 validator after every capture refresh.

```bash
node --experimental-strip-types /Users/test/Code/V/scripts/providers/305_validate_capability_evidence.ts
node --experimental-strip-types /Users/test/Code/V/tools/analysis/validate_305_provider_capability_evidence.ts
```

Validation fails if:

- a live capability row lacks evidence
- the wrong provider or environment is linked to a claim
- prerequisite facts required by the booking engine are missing
- stale or manual-bridge evidence is presented as fully verified
- raw secret material leaks into a tracked artifact or browser proof

## Recovery and drift handling

When 305 validation fails:

1. rerun the capture script to converge the source artifacts
2. rerun the Playwright portal evidence specs to refresh browser proof
3. inspect provider-specific gap files for the affected row
4. if the binding hash changed, treat the old evidence as drifted and do not reuse it
5. if a credential expiry posture moved to review-required, refresh the owner checkpoint before any further supplier testing
