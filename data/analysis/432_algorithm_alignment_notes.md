# 432 Phase 9 Assurance Algorithm Alignment Notes

- Source algorithm: `blueprint/phase-9-the-assurance-ledger.md#9A`.
- Canonicalization rule: SHA-256 over JCS-equivalent canonical JSON with sorted object keys, UTC timestamp normalization, finite numbers, and explicit set hashing.
- Ledger invariant: producer provenance, namespace, schema version, normalization version, source sequence, bounded-context ownership, replay decision class, effect key, and previous hash continuity are required.
- Evidence graph invariant: graph edges are typed, scoped, supersession-aware, and hash-stable; complete snapshots are immutable.
- Completeness invariant: graph verdicts are evaluated before pack export, replay, retention, deletion/archive, recovery proof, or authoritative dashboard display.
- Trust invariant: lower-bound slice trust, hard-block provenance, and graph verdict state govern visible dashboards and operations shell posture.
- Compatibility invariant: unsupported schema versions quarantine before ledger append; supported legacy versions normalize through the pinned normalization version.
