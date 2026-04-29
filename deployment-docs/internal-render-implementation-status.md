# Internal Render Implementation Status

Updated: 2026-04-29.

## Git Baseline

- Dirty workspace preserved in branch `maqbool/internal-render-deployment-baseline`.
- Preservation commit: `1ff0e4e`.
- Local `main` was fast-forwarded to `origin/main` and merged with the preserved baseline.
- Local ignored `prompt/` files that blocked the fast-forward were moved to `.codex-runtime/prompt-backups/20260428T232006Z/prompt`.

## Runtime Readiness

- Root Node is constrained to Node 24 in `package.json`, with `.node-version` pinned to `24.14.1`.
- HTTP service configs now support explicit service/admin hosts.
- Service ports accept service-specific env vars and Render-style `PORT`.
- Default local host remains `127.0.0.1`.
- Render can set `HOST=0.0.0.0` for deployable HTTP surfaces.

## Protected Entrypoint

- Package: `services/internal-entrypoint`.
- Public routes:
  - `GET /health`
  - `GET /`
  - `GET|POST /login`
  - `GET|POST /logout`
- Authenticated routes:
  - `GET /internal`
  - `GET /apps/patient-web/`
  - `GET /apps/clinical-workspace/`
  - `GET /apps/ops-console/`
  - `GET /apps/hub-desk/`
  - `GET /apps/pharmacy-console/`
  - `GET /apps/support-workspace/`
  - `GET /apps/governance-console/`
  - `GET|POST /reset-client-state`

Required Render env vars:

- `INTERNAL_TEST_PASSWORD_HASH`
- `SESSION_SECRET`

Required non-secret Render env vars:

- `NODE_ENV=production`
- `VECELLS_ENVIRONMENT=internal`
- `RELEASE_RING=internal`
- `HOST=0.0.0.0`
- `INTERNAL_DATA_MODE=synthetic-disposable`

## Data Mode

Mode A: synthetic/disposable.

- No Render database for the first deployment.
- No laptop database dependency.
- No seed command is required.
- Browser state reset is available through the protected entrypoint.
- Real patient data is forbidden.

## Smoke Status

- Local internal-entrypoint smoke passed on `127.0.0.1:7300`.
- Hosted Render smoke passed on `https://vecells-internal-entrypoint.onrender.com`.
- Render service ID: `srv-d7ou1rbeo5us738giuqg`.
- Render Blueprint ID: `exs-d7ou0hgg4nts7386d6t0`.
- Current hosted service state: suspended as of 2026-04-29 13:13 UTC.
- See `internal-render-smoke-report.md` for the route-level checks.
