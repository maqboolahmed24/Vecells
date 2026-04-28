# 366 Algorithm Alignment Notes

## Task

`seq_366_phase6_use_Playwright_or_other_appropriate_tooling_browser_automation_to_configure_pharmacy_directory_and_dispatch_provider_credentials`

## Goal

Create one governed non-production control plane for pharmacy discovery-source setup and dispatch-provider credential binding, with browser rehearsal for approved admin surfaces and fail-closed verification evidence.

## Object mapping

### `PharmacyProviderCapabilitySnapshot`

Mapped to the 366 directory-source manifest rows.

Each directory-source row freezes:

- environment tuple
- provider identity
- ODS code
- directory source mode
- strategic vs bounded-legacy posture
- supported transport set
- capability evidence references
- `capabilityTupleHash`

This closes the gap where provider capability could otherwise be assumed or remembered informally.

### `DispatchAdapterBinding`

Mapped to the 366 dispatch-provider binding manifest rows.

Each dispatch row freezes:

- environment tuple
- provider identity
- transport mode
- `TransportAssuranceProfile` binding
- expected adapter version from the `par_350` wave
- expected transform contract reference
- provider capability tuple hash
- secret bundle linkage
- `dispatchBindingHash`

This closes the gap where directory identity and dispatch identity could drift independently.

### `TransportAssuranceProfile`

Pulled from `343_phase6_transport_assurance_registry.json`.

366 does not invent transport posture locally.
It binds each dispatch row to the current authoritative transport profile:

- `bars_fhir`
- `supplier_interop`
- `nhsmail_shared_mailbox`
- `mesh`
- `manual_assisted_dispatch`

If a row drifts from the current profile set, verification fails closed.

### Environment baseline

Mapped through one explicit non-production environment family:

- `development_local_twin`
- `integration_candidate`
- `training_candidate`
- `deployment_candidate`

Each environment profile freezes:

- login strategy
- storage-state location outside source control
- automation posture
- evidence capture mode

This keeps browser setup behavior inside the runtime and release law from `platform-runtime-and-release-blueprint.md`.

## Strategic directory posture

366 keeps the strategic current route explicit:

- `dohs_service_search`
- bounded `local_registry_override`

366 keeps legacy compatibility explicit but non-default:

- `eps_dos_legacy`

Legacy rows are never marked fully automated and never become the sole current path for an environment.

## Secret law

The repository stores:

- secret references
- masked fingerprints
- tuple hashes
- evidence references

The repository does not store:

- live credential values
- browser storage state
- raw private keys
- raw mailbox passwords

This aligns 366 with the secret-injection and anti-leak rules in `phase-0-the-foundation-protocol.md`.

## Mode mapping

### `dry_run`

- computes intended configuration without mutating runtime state
- proves the operator pack is deterministic

### `rehearsal`

- writes masked local-twin runtime state
- keeps external environments explicit as manual bridge

### `apply`

- allowed only for the local twin fully automated rows
- proves the configured hash equals the manifest hash

### `verify`

- produces the machine-readable readiness summary
- proves alignment only, not external approval

## Browser automation law

Playwright is used for:

- local portal login and environment-isolated navigation
- directory-source configuration rehearsal
- dispatch-binding configuration rehearsal
- readiness verification inspection

The browser layer is not the source of truth.
The source of truth remains the typed manifest family under `data/config` and `data/contracts`.

## Key fail-closed checks

- no strategic directory source for an environment
- legacy discovery marked fully automated
- missing or cross-environment secret reference
- transport profile drift from `343`
- adapter version drift from `350`
- provider capability tuple drift between directory and dispatch rows
- secret leakage into evidence, logs, traces, or screenshots

## Repository-owned evidence

366 publishes:

- example manifests in `data/config`
- binding contract in `data/contracts`
- provider and verification CSV matrices
- browser-safe readiness summary in `output/playwright/366-credential-portal-state`

That makes the repository, not spreadsheets or operator memory, the control-plane authority.
