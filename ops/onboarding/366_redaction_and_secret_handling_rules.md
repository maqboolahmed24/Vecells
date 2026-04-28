# 366 Redaction And Secret Handling Rules

This document defines the 366 secret-handling boundary for pharmacy directory and dispatch-provider configuration.

## Core law

The repository may contain secret references, tuple hashes, masked fingerprints, and evidence handles.
The repository may not contain live secret values, session tokens, private keys, raw mailbox passwords, or browser storage state.

## Allowed tracked forms

- `secret://...` reference locators inside example manifests
- masked fingerprints such as `sha256:...`
- environment-safe bundle identifiers
- tuple hashes and dispatch binding hashes
- PHI-safe operator notes

## Forbidden tracked forms

- raw `client_secret` values
- `password=` pairs
- `Bearer ...` tokens
- PEM private keys
- raw certificate bodies
- `playwright/.auth` browser state files

## Browser automation rules

- each non-production environment uses its own browser context
- browser contexts must be clean-slate and isolated
- no browser storage state is committed to source control
- screenshots and traces are captured only after the secret boundary
- secret-bearing steps render masked fingerprints only
- HAR capture remains off for 366

## Secret boundary behavior

The harness and specs must treat the following as secret-bearing:

- credential reference selection
- client certificate or private-key bundle association
- mailbox password or shared-key association
- any step that could expose a vault locator or privileged operator secret

When the secret boundary is active:

- do not capture screenshots
- do not start traces
- do not emit raw form dumps to logs

After the boundary:

- capture safe summary evidence only
- verify the rendered page contains no raw secret locators
- prefer masked fingerprints and tuple hashes over operator prose

## Environment handling

### `development_local_twin`

- fully automated mutation is allowed
- only masked local twin values may surface in browser evidence

### `integration_candidate`

- manual bridge required
- request packs may be prepared
- final submit remains human-gated

### `training_candidate`

- manual bridge required
- training evidence must stay masked

### `deployment_candidate`

- verify-only posture
- no unattended mutation

## Audit posture

Every consequential mutation must preserve:

- environment target
- named operator or owner role
- secret bundle identifier
- tuple hash or dispatch binding hash
- verification timestamp

Audit records must be PHI-safe and secret-safe.

## Practical checklist

- confirm every secret reference resolves to the same environment as the row using it
- confirm only masked fingerprints render in browser pages
- confirm traces start after the secret boundary, not before
- confirm screenshots and traces contain no `secret://` text
- confirm browser storage state is ephemeral and outside source control
- confirm manual bridge rows remain explicit and are not silently marked verified
