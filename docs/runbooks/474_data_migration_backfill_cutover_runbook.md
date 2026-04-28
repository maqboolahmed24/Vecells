# Task 474 Data Migration, Backfill, and Cutover Runbook

Cutover decision: `ready_with_constraints`
Migration tuple hash: `924077097e5931ba2b70d3c23031c841594c9e3b299879b7991f8a0a4b5cebf1`
Runtime bundle: `rpb::local::authoritative`
Production execution permitted: `false`

## Ordered Ladder

| Order | Step | Owner | Settlement | Rollback decision |
| --- | --- | --- | --- | --- |
| 1 | Freeze release, reference data, and read-path digests | release-governance | dry_run_exact | crd_474_patient_status |
| 2 | Apply additive schema and event-lineage columns | platform-data | dry_run_exact | crd_474_patient_status |
| 3 | Run projection backfill with shadow compare | platform-projections | waiting | crd_474_pharmacy_console |
| 4 | Verify compatible read paths and feature-flag timing | platform-runtime | blocked | crd_474_patient_status |
| 5 | Approve dry run only | release-governance | dry_run_exact | crd_474_pharmacy_console |
| 6 | Execute production cutover | release-governance | blocked | crd_474_pharmacy_console |

## Operating Rule

Dry-run approval may be recorded using the bound execution tuple. Production cutover remains disabled until release wave authority, exact projection convergence, compatible read paths, and rollback/fallback bindings are all exact.
