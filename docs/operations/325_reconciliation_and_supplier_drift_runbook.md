# 325 Reconciliation And Supplier Drift Runbook

## Purpose

This runbook is for governed operator and worker actions around:

- reconciliation-required commit attempts
- imported confirmation disputes
- supplier drift after booking
- typed hub exception backlog work
- projection backfill for open hub cases

## Worker Surfaces

Use the worker service routes exposed by the 325 service definitions:

- `POST /reconciliation/claim`
- `POST /reconciliation/resolve`
- `POST /backfill/open-case-truth`
- `POST /mirror/observations`
- `POST /exceptions/open`
- `POST /exceptions/claim`
- `POST /exceptions/process`

## Reconciliation Sweep

1. Claim one attempt through `POST /reconciliation/claim`.
2. If imported supplier evidence is authoritative and binding-safe, resolve with `confirmed_from_imported_evidence`.
3. If evidence is contradictory or wrong-case, resolve with `manual_dispute`.
4. If the worker still lacks lawful truth, resolve with `stalled_retryable`.

Do not open a second commit path by hand while the attempt remains in `reconciliation_required` or while its exception work is still active.

## Supplier Drift

When the supplier reports cancellation, reschedule, or other drift:

1. Ingest the payload through `POST /mirror/observations`.
2. Confirm the latest checkpoint shows `manageFreezeState = frozen`.
3. Confirm the latest truth projection is `blocked_by_drift` or otherwise widened into recovery.
4. If practice re-acknowledgement is required, confirm a new visibility debt exists before a new manage surface is exposed.

## Exception Processing

Claim exception work through `POST /exceptions/claim`.

Allowed follow-up actions:

- `retry`
- `escalate`
- `resolve`
- `suppress`

Use `retry` only when a future supplier poll, imported confirmation, or continuity refresh can still change the posture safely.

Use `escalate` when:

- a supplier contradiction persists
- a stale owner lease repeats
- backfill ambiguity still blocks safe repair

## Backfill

Run `POST /backfill/open-case-truth` for one open case during rollout, migration rehearsal, or targeted repair.

Expected outcomes:

- `no_change`: current durable lineage already matches the published truth
- `repaired`: missing refs or stale blockers were repaired without calming unsupported posture
- `ambiguous`: lineage conflict remains and manual supervision is required

Do not suppress `ambiguous` backfill outcomes just to clear dashboards. They are release-blocking until resolved or explicitly governed.
