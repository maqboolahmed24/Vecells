# 197 Access Narrowing, Hold, And Resume Privacy Rules

The claim/resume UI is allowed to hold place, not to over-disclose. Every posture renders from `PatientAudienceCoverageProjection`, `AccessGrantScopeEnvelope`, and `PatientIdentityHoldProjection` before any patient-visible detail appears.

## Disclosure Rules

| Posture family                             | Allowed                                                                  | Suppressed                                                                 |
| ------------------------------------------ | ------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| `claim_pending`                            | Request anchor, route context, last-safe summary, masked account context | Writable detail, message bodies, attachments, raw grant IDs                |
| `read_only`                                | Status, safe summary, return target                                      | Editing controls, raw identifiers, internal reason payloads                |
| `identity_hold`                            | Last-safe summary and corrective next step                               | PHI-bearing narrative, attachment previews, message bodies, subject hashes |
| `rebind_required`                          | Safe summary and rebind action                                           | Previously available detail until release settles                          |
| `wrong_patient_freeze`                     | Safe context and support action                                          | Any new patient detail or writable control                                 |
| `stale_link_mapped` / `stale_grant_mapped` | Settled destination and safe context                                     | Retry stale token path, second claim path                                  |
| `promoted_draft_mapped`                    | Current request truth destination                                        | Mutable draft editing                                                      |

## Patient Copy Rules

Patient-facing copy never prints raw grant IDs, subject hashes, internal reason-code payloads, full identifiers, or security jargon. Internal reason codes appear only as deterministic non-PHI attributes and in documentation/test artifacts. The live UI uses plain-language titles while keeping the underlying `data-reason-code` for automation.

## Replay And Recovery

Duplicate clicks, refreshes, stale links, cross-device replay, and promoted draft links map to the already-settled outcome through `AccessGrantRedemptionRecord` and `AccessGrantSupersessionRecord`. They do not reopen claim or draft editing.

## Wrong-Patient Freeze

Wrong-patient suspicion freezes writable action and suppresses all PHI-bearing detail even if the user previously had broader access. The UI preserves only a safe request anchor and corrective support route. This avoids both silent context loss and unsafe continuation.
