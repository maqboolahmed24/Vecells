# 366 Pharmacy Directory And Dispatch Credentials Runbook

This runbook operationalizes the Phase 6 non-production control plane for pharmacy directory sources and dispatch-provider bindings.

The source of truth is the typed 366 manifest set:

- `data/config/366_directory_source_manifest.example.json`
- `data/config/366_dispatch_provider_binding_manifest.example.json`
- `data/config/366_secret_reference_manifest.example.json`
- `data/contracts/366_directory_and_dispatch_binding_contract.json`

These manifests are the lasting truth.
The portal harness and browser automation rehearse and verify the same manifests; they do not replace them.

## Purpose

Use this runbook to:

- review environment-specific directory-source rows
- review dispatch-provider credential references and adapter bindings
- rehearse `dry_run`, `rehearsal`, `apply`, and `verify` modes
- prepare named-operator handoff where browser automation must stop at a manual bridge
- capture safe evidence without leaking raw secret locators, values, or privileged storage state

## Algorithm anchors

This runbook is bound to:

- `PharmacyProviderCapabilitySnapshot`
- `DispatchAdapterBinding`
- `TransportAssuranceProfile`
- the package-freeze to dispatch-plan law from Phase 6

Discovery ranking remains separate from transport choice.
Directory-source setup proves provider lookup posture and capability evidence.
Dispatch binding setup proves transport readiness and adapter alignment.

## Environment profiles

### `development_local_twin`

- automation posture: `fully_automated`
- use for: end-to-end rehearsed local mutation against the masked portal twin
- allowed modes: `dry_run`, `rehearsal`, `apply`, `verify`
- evidence posture: safe screenshots and traces only after the secret boundary

### `integration_candidate`

- automation posture: `manual_bridge_required`
- use for: request-pack preparation and tuple verification before supplier-admin or onboarding submission
- allowed modes: `dry_run`, `rehearsal`, `verify`
- evidence posture: masked summary only, no final unattended submit

### `training_candidate`

- automation posture: `manual_bridge_required`
- use for: operator training and request-pack rehearsal
- allowed modes: `dry_run`, `rehearsal`, `verify`
- evidence posture: masked summary only

### `deployment_candidate`

- automation posture: `manual_bridge_required`
- use for: release-candidate preflight only
- allowed modes: `dry_run`, `verify`
- evidence posture: masked summary only

## Mode semantics

### `dry_run`

- computes intended directory and dispatch mutations
- writes no runtime state
- use before any operator review or browser rehearsal

### `rehearsal`

- writes only the local twin runtime hashes
- keeps integration, training, and deployment rows explicit as manual bridges
- use to prove flow continuity and artifact hygiene

### `apply`

- allowed only for `development_local_twin`
- writes current runtime tuple hashes for fully automated rows
- must never widen to manual-bridge environments

### `verify`

- checks tuple alignment, secret reference coverage, transport profile alignment, and runtime readiness
- produces the machine-readable readiness summary
- does not imply provider approval or clinical completion

## Operator sequence

1. Materialize the tracked 366 artifacts.
2. Review `366_provider_inventory_template.csv` and `366_nonprod_provider_binding_matrix.csv`.
3. Run the browser setup rehearsal for the local twin.
4. Confirm that only masked fingerprints appear in the browser and outputs.
5. Run readiness verification.
6. For `integration_candidate`, `training_candidate`, or `deployment_candidate`, assemble the request pack and stop at the manual bridge.
7. Record the operator name, environment target, and evidence bundle outside the repo-owned manifests if a real external approval flow begins.

## Commands

Tracked artifact refresh:

```bash
pnpm exec tsx ./scripts/pharmacy/366_materialize_directory_dispatch_artifacts.ts
```

Dry run:

```bash
pnpm exec tsx ./scripts/pharmacy/366_bootstrap_directory_and_dispatch_credentials.ts --mode dry_run
```

Local twin apply:

```bash
pnpm exec tsx ./scripts/pharmacy/366_bootstrap_directory_and_dispatch_credentials.ts --mode apply
```

Readiness verification:

```bash
pnpm exec tsx ./scripts/pharmacy/366_verify_directory_and_dispatch_readiness.ts
```

Browser setup rehearsal:

```bash
pnpm exec tsx ./tools/browser-automation/366_configure_directory_and_dispatch_credentials.spec.ts --run
```

Browser readiness proof:

```bash
pnpm exec tsx ./tools/browser-automation/366_verify_directory_and_dispatch_readiness.spec.ts --run
```

Validator:

```bash
pnpm validate:366-directory-and-dispatch-config
```

## Fail-closed rules

- if a dispatch row references a provider capability tuple hash that is not current for the same environment, verification fails closed
- if a transport profile or expected adapter version drifts from the current `par_350` wave, verification fails closed
- if a secret reference is missing or points across environments, verification fails closed
- if a legacy discovery row becomes the only current path for an environment, verification fails closed
- if browser evidence contains raw secret locators, client secrets, passwords, or private-key material, verification fails closed

## Manual-bridge boundary

The following remain operator-gated in 366:

- supplier-admin onboarding for `supplier_interop`
- training mailbox or endpoint setup for `mesh`
- deployment-candidate tuple promotion

For these rows, browser automation may:

- log in
- navigate
- assemble safe evidence
- prove tuple alignment
- stop before any irreversible external mutation

Browser automation may not:

- submit live onboarding requests unattended
- store privileged cookies in source control
- claim approval merely because a portal form was completed

## Rollback and reset

To clear the local twin runtime state and rerun the rehearsal:

```bash
rm -rf ./.artifacts/provider-config/366 ./output/playwright/366-credential-portal-state
pnpm exec tsx ./scripts/pharmacy/366_bootstrap_directory_and_dispatch_credentials.ts --mode rehearsal
```

The manifest files remain the source of truth during rollback.
Runtime state and browser evidence are disposable.
