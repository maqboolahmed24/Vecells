# 52 Design Contract Publication Strategy

## Summary

Seq_052 publishes `9` current design bundles over `19` browser-visible route families, backed by `7` token export artifacts, `8` fail-closed lint rules, and `27` structural evidence rows.

## Token Export Strategy

- One current `TokenKernelLayeringPolicy` now governs every exported design artifact.
- Shells select only published `profile.*` variants through `ProfileSelectionResolution`; route-local visual meaning is blocked.
- Any drift in primitive groups, semantic aliases, composite tokens, or profile selections invalidates downstream bundles.

## Bundle Compilation Strategy

- Each audience surface now publishes exactly one `DesignContractPublicationBundle` keyed to the stable seq_050 design bundle handle.
- Bundle digests remain stable with seq_050 manifest identity while seq_052 fills in the token, vocabulary, telemetry, artifact, and structural-evidence layers.
- Route families group exactly as frozen in seq_050: patient public entry, patient authenticated shell, patient transaction and recovery, clinical workspace, support, hub, pharmacy, operations, and governance/admin.

## Lint Verdict Strategy

- Publication now fails closed on token lattice drift, mode drift, semantic drift, automation or telemetry alias drift, artifact posture drift, surface-role drift, or stale structural evidence.
- Structural evidence is now a first-class linted input rather than a detached screenshot folder.
- Writable or calmly trustworthy posture still requires runtime parity from seq_051 in addition to these passing design verdicts.

## Gap Closures

- Finding `116`: token export, bundle composition, and runtime tuple linkage are now machine-readable and digest-backed.
- Finding `117`: DOM markers, selected anchors, and telemetry names now share one vocabulary spine.
- Finding `118`: structural evidence and lint verdicts are now part of design publication itself.
- Finding `120`: artifact-mode posture is bundled with the same semantics, telemetry, and automation authority.

## Source Anchors

- `blueprint/phase-0-the-foundation-protocol.md#1.37A DesignContractPublicationBundle`
- `blueprint/phase-0-the-foundation-protocol.md#1.37B DesignContractLintVerdict`
- `blueprint/design-token-foundation.md#Machine-readable export contract`
- `blueprint/canonical-ui-contract-kernel.md#Canonical contracts`
- `blueprint/platform-runtime-and-release-blueprint.md#FrontendContractManifest`
- `blueprint/forensic-audit-findings.md#Finding 116`
- `blueprint/forensic-audit-findings.md#Finding 117`
- `blueprint/forensic-audit-findings.md#Finding 118`
- `blueprint/forensic-audit-findings.md#Finding 120`
