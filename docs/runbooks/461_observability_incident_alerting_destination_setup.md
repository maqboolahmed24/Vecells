# Phase 9 Operational Destination Setup

This runbook covers the deterministic local setup for task 461. It does not contain real credentials, webhook URLs, or production endpoint material.

## Scope

- Governance route: `/ops/config/destinations`
- Canonical contract: `OperationalDestinationBinding`
- Fake receiver: `/phase9/fake-alert-receiver`
- Downstream readiness surfaces: `/ops/overview`, `/ops/incidents`, `/ops/assurance`, `/ops/release`, `/ops/resilience`

## Procedure

1. Open the governance console at `/ops/config/destinations?state=normal`.
2. Select the tenant, environment, destination class, and vault reference.
3. Use `Test delivery` to send a synthetic payload to the local fake receiver.
4. Confirm the receiver log contains only schema, class, severity, tenant, environment, hashes, correlation ID, idempotency key, and receiver reference.
5. Confirm the redaction rail says inline secret material is false and fail-closed policy covers stale secret, stale redaction policy, stale runtime publication, and missing verification.
6. Check the downstream readiness strip in governance and the ops console surfaces.

## Local Commands

```bash
pnpm test:phase9:alerting-destinations
pnpm validate:461-phase9-alerting-destinations
```

## Failure Fixtures

- `missing_secret`: verification blocks before receiver call.
- `denied_scope`: tenant/environment scope fails closed.
- `stale_destination`: runtime publication freshness blocks testing.
- `delivery_failed`: fake receiver rejects delivery and fallback remains required.
- `permission_denied`: operator permission blocks configuration.

## Safety Rules

- Use vault refs only.
- Use local fake receivers only.
- Do not log raw endpoints, tokens, credentials, PHI, or free-text payloads.
- Treat dashboard/readiness links as projections, not authority.
