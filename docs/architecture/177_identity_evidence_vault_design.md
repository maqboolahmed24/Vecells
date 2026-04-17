# Identity Evidence Vault Design

Task: `par_177_phase2_track_identity_build_identity_evidence_vault_for_raw_claim_and_telephony_identifier_storage`

## Purpose

The identity evidence vault is the only boundary that may store raw NHS login claims, userinfo claims, phone numbers, caller identifiers, handset proofs, telephony capture evidence, and future identity-sensitive evidence. Operational services receive only envelope refs, vault refs, salted digests, tokenized lookup hashes, and masked display hints.

The implementation lives in `services/command-api/src/identity-evidence-vault.ts` and exposes `createIdentityEvidenceVaultApplication()`.

## Authoritative Objects

| Object | Rule |
| --- | --- |
| `IdentityEvidenceEnvelope` | Append-only metadata matching the task 170 contract. It carries `evidenceNamespace`, `evidenceKind`, `sourceChannel`, `subjectRef`, `claimDigest`, `maskedDisplay`, `keyVersionRef`, retention class, disclosure class, and provenance. |
| `IdentityEvidenceCiphertext` | Encrypted payload object. It stores AES-256-GCM ciphertext, payload IV/tag, wrapped data key, wrapping-key version, and AAD digest. |
| `IdentityEvidenceLookupToken` | Tokenized lookup index. It stores namespace plus `sha256:` token hash and never stores the raw lookup value. |
| `IdentityEvidenceAccessAuditRecord` | Append-only read, write, lookup, and deny audit trail for sensitive evidence access. |
| `IdentityEvidenceKeyVersionRecord` | KMS-facing key-version metadata so live KMS/HSM can replace the simulator without changing envelope semantics. |

## Namespaces

| Namespace | Evidence kind | Default retention | Default disclosure |
| --- | --- | --- | --- |
| `auth_claim` | `nhs_login_claim_digest` | `identity_binding_evidence` | `masked_operational` |
| `userinfo_claim` | `nhs_login_claim_digest` | `identity_binding_evidence` | `masked_operational` |
| `phone_number` | `sms_seed_digest` | `continuation_seed` | `masked_operational` |
| `caller_identifier` | `telephony_capture_digest` | `continuation_seed` | `masked_operational` |
| `handset_proof` | `secure_link_digest` | `continuation_seed` | `masked_operational` |
| `match_evidence` | `staff_assertion_digest` | `identity_binding_evidence` | `audit_only` |
| `telephony_capture` | `telephony_capture_digest` | `audit_worm` | `audit_only` |
| `repair_signal` | `system_repair_signal` | `repair_signal` | `masked_operational` |

## Write Flow

1. Caller submits raw evidence through `writeEvidence()`.
2. The vault serializes evidence deterministically and derives `claimDigest`.
3. The simulator KMS generates a random data key, encrypts payload with AES-256-GCM, wraps the data key with the active key-encryption key, and records `keyVersionRef`.
4. The vault writes one immutable `IdentityEvidenceEnvelope` and one immutable ciphertext object.
5. Optional lookup values are tokenized as namespace-scoped hashes.
6. A write audit record is appended.
7. The caller receives only `IdentityEvidenceLocator` with envelope ref, vault ref, digest, key version, namespace, retention class, disclosure class, and masked display.

## Read Flow

Masked reads are allowed for ordinary operational purposes and return only `maskedDisplay`.

Raw reads require both `privileged = true` and an approved purpose: `identity_binding_authority`, `patient_linker`, `telephony_readiness`, `security_audit`, or `break_glass_audit`. Denied raw reads append an audit record and return no raw evidence.

## Redaction Helpers

`redactEvidenceForTelemetry()` recursively replaces values for sensitive keys such as raw claims, tokens, phone numbers, caller identifiers, NHS numbers, cookies, CSRF secrets, and proofs with `[IDENTITY_EVIDENCE_REDACTED]`. `detectEvidenceLeak()` flags obvious phone-number and email leakage in testable telemetry payloads.

## Auth Bridge Integration

`createAuthBridgeEvidenceVaultPort()` adapts this vault to the auth bridge `IdentityEvidenceVaultPort`. It stores raw claims and raw token envelopes only inside the vault and returns the envelope ref as the evidence ref consumed by downstream binding and session seams.

## Persistence

Migration `services/command-api/migrations/092_phase2_identity_evidence_vault.sql` adds:

| Table | Purpose |
| --- | --- |
| `identity_evidence_key_versions` | Key version and lifecycle metadata. |
| `identity_evidence_envelopes` | Append-only identity evidence envelope metadata. |
| `identity_evidence_ciphertexts` | Encrypted evidence payloads and wrapped data keys. |
| `identity_evidence_lookup_tokens` | Namespace-scoped tokenized lookup refs. |
| `identity_evidence_access_audit` | Write, read, lookup, and denial audit records. |

## Gap Closures

| Gap | Closure |
| --- | --- |
| `PARALLEL_INTERFACE_GAP_PHASE2_EVIDENCE_ENCRYPTED_APPEND_ONLY_V1` | Raw evidence is encrypted into append-only envelope and ciphertext records. |
| `PARALLEL_INTERFACE_GAP_PHASE2_EVIDENCE_MASKING_HELPERS_V1` | Shared redaction and leakage-detection helpers make raw-value logging testable. |
| `PARALLEL_INTERFACE_GAP_PHASE2_EVIDENCE_ACCESS_AUDIT_V1` | Every write, masked read, raw read, lookup, and denial appends an audit record. |
| `PARALLEL_INTERFACE_GAP_PHASE2_EVIDENCE_TELEPHONY_NAMESPACE_V1` | Phone numbers, caller identifiers, handset proofs, and telephony captures are explicit vault namespaces now. |
| `PARALLEL_INTERFACE_GAP_PHASE2_EVIDENCE_LOOKUP_TOKENIZATION_V1` | Search and dedupe use namespace-scoped `sha256:` lookup tokens, never raw values. |

## References

- OWASP Cryptographic Storage Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html
- OWASP Key Management Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Key_Management_Cheat_Sheet.html
- OWASP Logging Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
- NHS login API catalogue: https://digital.nhs.uk/developer/api-catalogue/nhs-login
