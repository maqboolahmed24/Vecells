# Database And State Plan

User input: no paid online storage preference, not sure what exact database means, use best option, Render account exists.

## Current Local State

The repo defines local emulators, not a simple production database connection:

- domain Postgres emulator: `vecells_domain` on local port `6543`
- FHIR Postgres emulator: `vecells_fhir` on local port `6544`
- NATS event spine emulator
- Valkey cache/live transport emulator
- MinIO object storage emulator

These are good for local development and contract validation. They are not automatically reachable from Render.

## Important Constraint

A database running on a laptop is not a good backend for a Render-hosted internal test app.

Reasons:

- Render services cannot safely rely on a developer laptop being online.
- Exposing a laptop database to Render would require tunneling or firewall work.
- Nontechnical testers would see outages whenever the laptop sleeps, changes networks, or the tunnel drops.
- It is harder to secure and audit than Render-managed state.

## Render Data Choices

### Choice A: No durable cloud database for first internal test

Use fixture/synthetic/local-mode behavior. This is cheapest and fastest.

Accept if:

- testers are validating navigation, UI, shell continuity, and internal workflow feel;
- losing state between deploys is acceptable;
- no tester enters real patient or production-like data.

Do not accept if:

- testers need durable submissions;
- testers need multi-user state;
- you need realistic queue/booking/event behavior.

### Choice B: Render Free Postgres

Use Render Postgres for short-lived internal state.

Accept if:

- 30-day database expiry is okay;
- 1 GB capacity is enough;
- no backups is acceptable;
- the team understands this is throwaway internal test storage.

This is the best default if testers need persistence and the team does not want to buy storage yet.

### Choice C: Paid Render Postgres

Use if:

- internal testing will run longer than 30 days;
- data matters;
- backups are required;
- team members will rely on the environment daily.

This is the best option for a serious internal pilot, but it conflicts with "not buying online storage" unless the team approves cost.

## Recommendation For The First Deployment

Start with Choice A unless a tester flow explicitly requires durable shared state. If shared state is required, use Choice B and label it clearly as expiring test storage.

Do not use laptop-hosted Postgres for the Render deployment.

## Data Safety Rules

- Use only synthetic data.
- Do not enter real patient details.
- Do not connect real provider systems.
- Do not store real secrets in Git.
- Treat all Render Free Postgres data as disposable.
- Add a visible internal/test banner in the protected entrypoint.

## Future Mapping Work

Before a production-like internal pilot, map these local emulator responsibilities to Render-compatible services:

| Local component | Current local file | Render direction |
| --- | --- | --- |
| Domain store | `infra/data-storage/local/data-storage-emulator.compose.yaml` | Render Postgres or explicit service DB |
| FHIR store | `infra/data-storage/local/data-storage-emulator.compose.yaml` | Render Postgres, likely separate schema/database |
| Event spine | `infra/event-spine/local/event-spine-emulator.compose.yaml` | NATS private service or omit |
| Cache/live transport | `infra/cache-live-transport/local/cache-live-transport-emulator.compose.yaml` | Render Key Value/Valkey or omit |
| Object storage | `infra/object-storage/local/object-storage-emulator.compose.yaml` | external object store or private MinIO service only if needed |

## Migration Readiness

Current deployment docs do not define database migrations. A later task must answer:

- Which service owns schema creation?
- Which env var names carry database connection strings?
- Are domain and FHIR stores separate Render databases or schemas in one database?
- What is the seed/reset command for internal testers?
- How do we wipe test data safely?

