# Phase 9 Assurance Ingest Service

Service version: 435.phase9.assurance-ingest-service.v1
Producer: producer:assistive-rollout
Accepted decision: accepted
Duplicate decision: idempotent_replay
Snapshot: aegs_435_30101b5abca6bc1d
Graph hash: fd3e569d3f5721d249db2d5c182b60ff36d8e4e4c1bbee1ec4324f6231d783dd
Graph watermark: e2a83d57d28f14275e79ed2e8243e8041cd8c053286a79534d8afde1870617b9
Rebuild hash: 22d407523ee3acbc1aa0f9c6e1df1824da659f5691ef18c6f522b0e4a860b972

## Guarantees

- Producer, namespace, schema, sequence, tenant, bounded-context, and normalization metadata are validated before acceptance.
- Checkpoint, ledger entry, evidence artifact, and graph staging are updated together before an accepted receipt is returned.
- Duplicate same-hash events are idempotent replays; duplicate different-hash, out-of-order, unsupported, cross-tenant, and malformed inputs quarantine.
- Graph snapshots are deterministic, immutable, hash-addressable, and queryable by tenant and scope.
- Rebuild from accepted raw inputs yields the same ledger and graph hash.
