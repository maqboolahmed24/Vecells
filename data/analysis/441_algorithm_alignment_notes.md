# Phase 9 CAPA And Attestation Workflow Algorithm Alignment

The workflow follows Phase 9 section 9D: EvidenceGapRecord rows become queue records, CAPAAction lifecycle state is version-hash guarded, and assurance pack actions emit AssurancePackActionRecord plus AssurancePackSettlement rows bound to pack hashes, graph verdict, trust, redaction, route intent, scope token, and idempotency key.

The workflow consumes task 440 pack output directly. It blocks stale pack hashes, graph verdict changes, open gaps, incomplete CAPA actions, redaction drift, missing actor role or purpose, self-approval, and stale route publication posture without recalculating pack business rules.

Queue DTOs are intentionally UI-ready for a future governance queue but contain no PHI payloads. They expose graph-backed reason codes, next safe action, blockers, evidence refs, and audit refs.
