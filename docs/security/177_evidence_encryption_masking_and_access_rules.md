# Evidence Encryption, Masking, And Access Rules

Task: `par_177_phase2_track_identity_build_identity_evidence_vault_for_raw_claim_and_telephony_identifier_storage`

## Security Boundary

`IdentityEvidenceVault` is the only approved boundary for raw auth claims, raw token envelopes, phone numbers, caller identifiers, handset proofs, telephony capture material, match evidence, and identity repair signals. The rule is explicit: raw identity evidence may not appear in logs, metrics labels, event payloads, hot operational rows, URLs, DOM attributes, screenshots, or ordinary DTOs.

Operational services must consume only `IdentityEvidenceLocator`, `IdentityEvidenceEnvelope.identityEvidenceEnvelopeId`, `vaultRef`, `claimDigest`, `lookupToken`, `maskedDisplay`, retention metadata, and disclosure metadata. The auth bridge integration enforces `storageRule = vault_reference_only`.

## Encryption Rules

`IdentityEvidenceCiphertext` uses envelope encryption with `AES-256-GCM`. The payload is encrypted with a per-evidence data key. The simulator-backed key manager wraps that data key with the active key-encryption key and persists `encryptedDataKey`, `dataKeyIv`, `dataKeyAuthTag`, `payloadIv`, `payloadAuthTag`, `aadDigest`, and `keyVersionRef`.

The authenticated additional data binds ciphertext to:

| AAD field           | Reason                                                                     |
| ------------------- | -------------------------------------------------------------------------- |
| `vaultRef`          | Prevents moving ciphertext between vault objects.                          |
| `evidenceNamespace` | Prevents namespace confusion between auth, telephony, and repair evidence. |
| `subjectRef`        | Binds the evidence to its upstream subject.                                |
| `claimDigest`       | Detects payload substitution.                                              |
| `policyVersion`     | Keeps future policy migrations explicit.                                   |

Every key version is represented by `IdentityEvidenceKeyVersionRecord`. Future live KMS, HSM, or vault infrastructure must preserve the same `keyVersionRef`, wrapped data key, and readback semantics.

## Append-Only Persistence

The migration creates immutable storage for:

| Table                             | Rule                                                                                                                                                                 |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `identity_evidence_envelopes`     | Append-only `IdentityEvidenceEnvelope` metadata with namespace, retention class, disclosure class, digest, key version, provenance, and previous-envelope reference. |
| `identity_evidence_ciphertexts`   | One ciphertext object per envelope/vault ref with wrapped data key metadata.                                                                                         |
| `identity_evidence_lookup_tokens` | Namespace-scoped lookup hashes. Raw lookup values are never stored.                                                                                                  |
| `identity_evidence_access_audit`  | Append-only `IdentityEvidenceAccessAuditRecord` entries for writes, masked reads, raw reads, lookups, and denials.                                                   |
| `identity_evidence_key_versions`  | Key lifecycle metadata for active and retired key-encryption keys.                                                                                                   |

No update path exists for an existing envelope or ciphertext. Corrections and rotations produce a new append-only envelope with `previousEnvelopeRef`.

## Access Rules

Masked reads are allowed for ordinary operational consumers and return only `maskedDisplay`.

Raw reads require both `privileged = true` and one approved purpose:

| Purpose                      | Allowed reason                                                                           |
| ---------------------------- | ---------------------------------------------------------------------------------------- |
| `identity_binding_authority` | Binding authority needs raw claim evidence for authoritative identity binding decisions. |
| `patient_linker`             | Linkage scoring can use raw evidence only inside privileged matching code.               |
| `telephony_readiness`        | Telephony readiness can evaluate raw phone/caller evidence inside the vault boundary.    |
| `security_audit`             | Security audit can verify ciphertext and digest integrity.                               |
| `break_glass_audit`          | Break-glass review can inspect evidence under audited emergency access.                  |

All denied raw reads append `IdentityEvidenceAccessAuditRecord` with `EVIDENCE_177_RAW_READ_DENIED` and `EVIDENCE_177_PRIVILEGED_PURPOSE_REQUIRED`. All allowed raw reads append `EVIDENCE_177_RAW_READ_ALLOWED` and `EVIDENCE_177_ACCESS_AUDITED`.

## Masking And Redaction

`maskedDisplay` is the only operational display value for evidence. Emails are reduced to a leading local-part character plus masked local-part content. Phone and caller identifiers keep only the minimal country prefix and final digits needed for human recognition.

`redactEvidenceForTelemetry()` recursively replaces sensitive keys, including raw claims, tokens, phone numbers, caller identifiers, NHS numbers, secrets, proofs, cookies, and CSRF material, with `[IDENTITY_EVIDENCE_REDACTED]`. `detectEvidenceLeak()` flags obvious email and phone-number leakage so observability payloads can be tested.

Structured logs, telemetry, and API DTOs must use `redactEvidenceForTelemetry()` before emission. They must fail closed if `detectEvidenceLeak()` returns true.

## Lookup Rules

Lookup and dedupe use namespace-scoped `lookupToken` hashes. `phone_number`, `caller_identifier`, `auth_claim`, `userinfo_claim`, `handset_proof`, `match_evidence`, `telephony_capture`, and `repair_signal` may all publish lookup refs, but the raw lookup input is never persisted.

Sibling tasks must not create side stores for raw telephony identifiers or raw auth claims. They must write new namespaces through this vault or extend the vault contract under a new `PARALLEL_INTERFACE_GAP_PHASE2_EVIDENCE_*` marker.

## Gap Closures

| Gap                                                               | Security closure                                                                               |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `PARALLEL_INTERFACE_GAP_PHASE2_EVIDENCE_ENCRYPTED_APPEND_ONLY_V1` | Raw evidence is centralized in append-only envelopes plus encrypted ciphertext records.        |
| `PARALLEL_INTERFACE_GAP_PHASE2_EVIDENCE_MASKING_HELPERS_V1`       | Shared masking, redaction, and leakage-detection helpers make observability failures testable. |
| `PARALLEL_INTERFACE_GAP_PHASE2_EVIDENCE_ACCESS_AUDIT_V1`          | Every sensitive access path appends an access audit record.                                    |
| `PARALLEL_INTERFACE_GAP_PHASE2_EVIDENCE_TELEPHONY_NAMESPACE_V1`   | Phone, caller, handset, and telephony capture evidence are explicit namespaces now.            |
| `PARALLEL_INTERFACE_GAP_PHASE2_EVIDENCE_LOOKUP_TOKENIZATION_V1`   | Lookup refs are tokenized by namespace and never store raw values.                             |

## External Alignment

This posture aligns with OWASP cryptographic storage guidance for authenticated encryption and key separation, OWASP key management guidance for key lifecycle and rotation compatibility, OWASP logging guidance for excluding sensitive data from logs, and NHS login integration expectations that raw claims and token material are partner-side responsibilities after callback handling.
