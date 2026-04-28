# Task 474 Algorithm Alignment Notes

Generated at 2026-04-28T00:00:00.000Z.

## Source Alignment

- `SchemaMigrationPlan`, `ProjectionBackfillPlan`, `ReadPathCompatibilityWindow`, `ProjectionReadinessVerdict`, `RuntimePublicationBundle`, `ReleasePublicationParityRecord`, and `ReleaseRecoveryDisposition` are represented as machine-readable records under `data/migration/`.
- The release/runtime tuple is read from tasks 472 and 473 plus the existing release candidate tuple. Missing future wave authority is not inferred.
- Production cutover is fail-closed; task 474 permits dry-run approval only until tasks 476 and 482 publish exact wave authority.
- Hashes use stable sorted JSON with explicit null handling and are tied to WORM/audit references for privileged decisions.

## Edge Cases Covered

- Contractive patient-status column removal is blocked while the legacy read path is active.
- Backfill cursor restart proves zero duplicate WORM rows after crash/resume.
- Reference-data manifests reject unmasked PHI and tenant-crossing identifiers without committing raw values.
- Rollforward-only FHIR index hardening is constrained by a manual fallback route.
- Staff workspace convergence is exact while pharmacy console remains stale, disabling destructive cutover.
- A synthetic poison record is quarantined without blocking the whole tenant.
- New command schema feature flag is blocked before read-path compatibility starts.

## Current Decision

Cutover decision: `ready_with_constraints`
Migration tuple hash: `924077097e5931ba2b70d3c23031c841594c9e3b299879b7991f8a0a4b5cebf1`
Dry run permitted: `true`
Production cutover permitted: `false`
Projection plan hash: `e698cc973ab7941ee0fc692732469b2fac8c6723f52ed39969107c3a2e4faa43`
