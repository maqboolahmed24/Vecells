# 335 MESH Secret And Certificate Handling

## Scope

This document covers mailbox credentials, certificate handling, masked operator evidence, and browser automation posture for task `335`.

## Hard rules

- No raw password, shared key, token, certificate body, or private key may be committed.
- The repo may store only:
  - secret references
  - environment variable names
  - vault paths
  - certificate fingerprint references
  - masked fingerprints derived from those references
- Playwright screenshots, traces, and logs must not expose:
  - `secret://`
  - `vault://`
  - `certfp://`
  - certificate PEM bodies
  - private-key PEM bodies

## Repository posture

The tracked artifacts intentionally keep references such as:

- `env://...`
- `secret://...`
- `vault://...`
- `certfp://...`

These are control-plane pointers only. They are not secrets.

The browser twin renders only masked derivatives such as `sha256:...`.

## Certificate handling

Use the MESH certificate reference and CSR subject as operational inputs, not as committed blobs.

For Path to Live API onboarding:

- capture the CSR subject in the required MESH format
- track the reference or fingerprint only
- keep keystores, CSRs, exported certificates, and trust bundles outside source control

Operationally, this means:

- the manifest can point to `certfp://mesh/...`
- the operator evidence page can show a masked hash
- the actual certificate material remains in the approved operational store

## Browser-auth state

Playwright documentation warns that stored auth state can contain cookies and headers that allow impersonation.

For `335` that means:

- no committed `playwright/.auth` state
- no real NHS portal cookies in tracked artifacts
- no captured browser state from smartcard or HSCN sessions in the repo
- the local twin uses a masked fake login only

## Manual bridge boundaries

The following remain outside unattended automation:

- NHS mailbox-admin submission
- MESH UI account grant
- MOLES mailbox lookup or message tracking that depends on smartcard or HSCN access

Those steps are still represented in the manifests and gap files, but they are not replayed inside CI.

## Trace and screenshot discipline

- record traces only against the local masked twin
- fail validation if output artifacts contain secret-reference tokens or certificate bodies
- treat local screenshots as evidence of manifest alignment, not as evidence of live NHS onboarding

## Minimum-necessary payload posture

Route seeds and verification payloads are deliberately safe fixtures.

They may carry:

- environment identity
- route purpose
- workflow ID
- correlation and dedupe shapes

They may not carry:

- patient demographics
- NHS number
- appointment narrative that could identify a patient

## Required operator checks before any real onboarding

1. Confirm the environment is `path_to_live_deployment`, not live.
2. Confirm the mailbox row matches the intended organisation and route purpose.
3. Confirm the workflow group and workflow IDs against the current NHS worksheet.
4. Confirm the CSR subject or certificate fingerprint reference is the one named in the manifest.
5. Confirm that any browser session or evidence bundle created during manual bridge work stays outside the repository.
