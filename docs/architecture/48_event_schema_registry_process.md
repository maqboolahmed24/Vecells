# 48 Event Schema Registry Process

- Task: `seq_048`
- Captured on: `2026-04-11`
- Generated at: `2026-04-13T14:51:07+00:00`

## Envelope Law

- Every canonical event carries tenant, contract, namespace, schema version, source/governing context, governing aggregate or lineage, correlation, and privacy posture.
- Raw PHI, phone numbers, message bodies, transcript text, and binary payloads are forbidden. Schemas require governed artifact refs or masked descriptors only.
- Replay consumers, analytics consumers, and assurance consumers share one canonical event contract for the same business fact.

## Compatibility Process

- `additive_only` contracts: `134`
- `new_version_required` contracts: `50`
- `namespace_break` contracts: `8`
- Additive changes may add optional fields or values only when replay determinism remains intact.
- Mandatory-field changes, payload meaning shifts, or replay-token changes require a new version with replay proof.
- Namespace breaks are the only legal in-place family retirement mechanism.

## Normalization Process

- Active normalization rules: `25`
- Required alias families are covered: `ingest.*`, `tasks.*`, `fallback.review_case.*`, and `external.confirmation.gate.*`.
- External callbacks and object-store ingress now normalize into canonical request, intake, communication, confirmation, or telephony contracts before any downstream consumer can rely on them.

## Blocked Schema Diffs

- `DRIFT_SCHEMA_ASSISTIVE_CONTINUITY_NO_REPLAY_PROOF` on `assistive.session.continuity.updated`: A candidate schema removed continuityFrameRef and would make replayed assistive posture indistinguishable from live activity.
- `DRIFT_SCHEMA_CONFIRMATION_GATE_VENDOR_NAMESPACE` on `confirmation.gate.confirmed`: A vendor-local confirmation namespace would bypass the canonical gate contract and break replay-safe downstream consumption.
- `DRIFT_SCHEMA_PATIENT_RECEIPT_DEGRADED_RAW_BODY` on `patient.receipt.degraded`: Attempted to add raw message body text to a patient receipt event instead of a governed artifact reference.
- `DRIFT_SCHEMA_REQUEST_CLOSURE_BLOCKERS_LOCAL_LABELS` on `request.closure_blockers.changed`: A candidate schema tried to publish route-local blocker labels rather than the canonical blocker-set hash and named reason codes.

## Runtime Publication Fit

- Active schema artifacts live under `packages/event-contracts/schemas/` and are diffable, checksum-backed, and validator-friendly.
- `validate_event_registry.py` fails if any minimum event family is missing, any alias leaks through as active authority, or any schema artifact loses its contract/version binding.
