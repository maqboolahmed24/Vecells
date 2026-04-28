# Phase 9 Assurance Ingest Algorithm Alignment

The service accepts only registered producers whose namespace, schema, tenant, bounded-context, and normalization metadata match the frozen Phase 9 assurance contracts.

Checkpointing is exactly-once across producer, namespace, schema, tenant, and source sequence. Same-hash duplicates return idempotent replay receipts; conflicting or out-of-order inputs quarantine without appending ledger rows.

Accepted envelopes are normalized into AssuranceLedgerEntry records using deterministic canonical payload and input-set hashes. Previous-hash continuity is enforced before acceptance.

Evidence-producing events materialize immutable EvidenceArtifact rows, stage typed AssuranceEvidenceGraphEdge inputs, and seal AssuranceEvidenceGraphSnapshot records with deterministic edge ordering and Merkle graph hashes.

Read APIs enforce tenant, role, and purpose-of-use constraints. Logs contain only ids and hashes, never event payloads or PHI fields.
