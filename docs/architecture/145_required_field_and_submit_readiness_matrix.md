# 145 Required Field And Submit Readiness Matrix

The authoritative field inventory is published in [145_required_field_matrix.csv](/Users/test/Code/V/data/analysis/145_required_field_matrix.csv). It is copied from the frozen seq_140 question contract and records the exact `visibilityPredicate`, `requiredWhen`, type grammar, normalization target, summary renderer, and supersession policy the backend enforces.

## Required-field discipline

- Required-field truth is bundle-owned. The browser may surface local hints, but the backend decides what is currently visible, required, superseded, or inactive.
- `RequiredFieldMeaningMap` is the only machine-readable view later shell tracks should consume for field-state truth.
- A hidden answer may still exist in audit history, but `FIELD_SUPERSEDED_HIDDEN_ANSWER` means it is excluded from payload and summary truth.

## Submit-readiness cases

The canonical readiness scenarios are published in [145_submit_readiness_cases.json](/Users/test/Code/V/data/analysis/145_submit_readiness_cases.json). The cases freeze the current Phase 1 truth:

- browser/self-service routine submit can be `submit_ready`
- unresolved urgent decisions fail closed
- unresolved attachment state fails closed
- quarantined or retry-required attachments move to review or blocked posture
- embedded contact-authority gaps remain blocked
- deterministic replay must return the same verdict hash

## Stable blocker codes

| Scope | Codes |
| --- | --- |
| `field` | `QUESTION_KEY_UNKNOWN`, `FIELD_REQUIRED`, `FIELD_CARDINALITY_INVALID`, `FIELD_TYPE_INVALID`, `FIELD_VALUE_EMPTY`, `FIELD_VALUE_NOT_ALLOWED`, `FIELD_SUPERSEDED_HIDDEN_ANSWER` |
| `field_group` | `CONTACT_PREFERENCE_ENUM_INVALID` |
| `step` | `REQUEST_TYPE_STEP_INCOMPLETE` |
| `attachment` | `ATTACHMENT_STATE_UNRESOLVED`, `ATTACHMENT_SUBMIT_BLOCKED` |
| `contact_authority` | `CONTACT_AUTHORITY_BLOCKED`, `GAP_RESOLVED_CONTACT_AUTHORITY_PHASE1_SELF_SERVICE_MINIMUM_V1` |
| `submit_preflight` | `INTAKE_CONVERGENCE_INVALID`, `REQUEST_TYPE_UNSUPPORTED`, `BUNDLE_COMPATIBILITY_BLOCKED`, `BUNDLE_COMPATIBILITY_REVIEW_REQUIRED`, `IDENTITY_CONTEXT_BLOCKED`, `CHANNEL_CAPABILITY_BLOCKED`, `URGENT_DECISION_PENDING`, `URGENT_DIVERSION_REQUIRED`, `URGENT_ALREADY_DIVERTED` |

## Readiness law

- `shape_valid` means incremental draft structure is acceptable; it does not mean promotion is legal.
- `shape_invalid` means the saved draft already violates the typed field contract.
- `submit_ready` means the active `SubmissionEnvelope` satisfies form completeness and the broader promotion-readiness law.
- `submit_review_required` means the draft is shaped correctly but a bounded review condition remains, such as attachment policy or bundle migration review.
- `submit_blocked` means the draft may not promote on the current tuple.
