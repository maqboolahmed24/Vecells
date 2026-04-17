# Identity Authority And Evidence Vault Rules

Status: frozen for Phase 2 trust kernel  
Primary contracts: `170_identity_authority_rules.json`, `170_identity_evidence_envelope.schema.json`

## Authority Rule

`IdentityBindingAuthority` is the sole writer for `IdentityBinding`. No other component may append, supersede, freeze, or release binding state. The capability engine, patient-link service, access-grant service, local session authority, auth bridge, evidence vault, and support console must treat identity binding changes as authority signals only.

| Component                  | Binding mutation | Trust posture role                                     |
| -------------------------- | ---------------- | ------------------------------------------------------ |
| `IdentityBindingAuthority` | Allowed          | Sole authoritative binding writer.                     |
| `CapabilityDecisionEngine` | Forbidden        | Emits `CapabilityDecision` and review signals.         |
| `PatientLink`              | Forbidden        | Emits posture and conflict signals.                    |
| `AccessGrantService`       | Forbidden        | Issues grants within decision ceilings.                |
| `LocalSessionAuthority`    | Forbidden        | Owns session freshness only.                           |
| `AuthBridge`               | Forbidden        | Produces context candidates and vault references.      |
| `SupportOverrideConsole`   | Forbidden        | Narrows or recovers posture through authority signals. |
| `IdentityEvidenceVault`    | Forbidden        | Stores encrypted append-only evidence envelopes.       |

The rule is intentionally conservative: if a component is not explicitly listed as the authority, it is a non-writer.

## Evidence Vault Boundary

Identity evidence is an encrypted, append-only vault concern. Hot operational rows, analytics, route profiles, UI events, and capability decisions may carry only:

| Allowed outside vault | Purpose                                         |
| --------------------- | ----------------------------------------------- |
| `vaultRef`            | Opaque pointer to encrypted evidence storage.   |
| `evidenceEnvelopeRef` | Join reference for authority and audit.         |
| `claimDigest`         | Salted digest for dedupe and audit correlation. |
| `maskedDisplay`       | Support-safe masked display hints.              |
| `disclosureClass`     | Controls where references can appear.           |
| `retentionClass`      | Controls retention and WORM alignment.          |
| `keyVersionRef`       | Cryptographic lineage without exposing content. |

Raw NHS login claims, phone values, telephony identifiers, email values, challenge inputs, and tokens must not appear in hot operational rows or emitted events. The evidence envelope schema avoids direct payload fields and stores only references, digests, classes, and masked hints outside the vault.

## Append-Only Semantics

Every `IdentityEvidenceEnvelope` has an `appendOnlySequence` and optional `previousEnvelopeRef`. Updates are represented by appending a new envelope, not editing an existing record. Authority decisions reference the relevant envelope sequence and binding fence rather than copying evidence values into authority events.

## Manual Override And Identity Repair

Manual override is a narrowing mechanism. It can:

| Action                                         | Allowed effect                                        |
| ---------------------------------------------- | ----------------------------------------------------- |
| Mark a posture as `repair_hold`.               | Downgrade decisions to `recover_only` or `deny`.      |
| Emit `IdentityRepairRequested`.                | Ask `IdentityBindingAuthority` to review.             |
| Release a support-visible recovery affordance. | Keep grants at `continuation_recovery_only` or below. |

Manual override cannot:

| Prohibited action                                 | Reason                                                     |
| ------------------------------------------------- | ---------------------------------------------------------- |
| Append or supersede `IdentityBinding`.            | Only authority writes binding.                             |
| Promote a route from `recover_only` to `allow`.   | Capability engine must re-evaluate after authority action. |
| Expose evidence payloads.                         | Support and operations surfaces remain masked.             |
| Treat local session freshness as patient linkage. | Session authority and patient-link posture are separate.   |

## Age And Policy Restrictions

Age and policy restrictions are modeled as `IdentityContext.restrictions` with a `decisionBias` of `step_up_required`, `recover_only`, or `deny`. They do not mutate identity binding. A restricted posture can block authenticated request access even when session and patient-link posture would otherwise satisfy the route profile.

## Security Invariants

The validator enforces these invariants:

1. `CapabilityDecision.decision` is exactly `allow | step_up_required | recover_only | deny`.
2. Only `IdentityBindingAuthority` can set binding mutation booleans to true.
3. Route profiles reference the evidence boundary as `vault_reference_only`.
4. Future protected records and booking profiles are present and denied by default.
5. Unknown protected routes deny by default.
6. Visual atlas diagrams have adjacent parity tables so no trust meaning exists only in graphics.
