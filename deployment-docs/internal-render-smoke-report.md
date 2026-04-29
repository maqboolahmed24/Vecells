# Internal Render smoke report

Status: local runtime smoke passed; hosted Render smoke passed.

Date: 2026-04-29

## Local runtime smoke

Command shape:

```bash
HOST=127.0.0.1 INTERNAL_ENTRYPOINT_HOST=127.0.0.1 INTERNAL_ENTRYPOINT_PORT=7300 VECELLS_ENVIRONMENT=local pnpm --dir services/internal-entrypoint start
```

Results:

- `/health` returned `200` with JSON `ok: true`.
- Anonymous `/internal` returned the password page and did not expose the internal menu.
- Wrong password POST to `/login` returned `401` and displayed the access-denied message.
- Correct local test password POST to `/login` returned `303` and set the HTTP-only session cookie.
- Authenticated `/internal` returned `200` and displayed the internal test menu.
- Authenticated `/apps/patient-web/` returned `200`, injected the internal synthetic-data banner, and served rewritten app assets.
- Authenticated POST to `/reset-client-state` returned `200` with the browser-state reset page.
- POST to `/logout` returned `303` and cleared the session cookie.

## Hosted Render smoke

Service URL:

`https://vecells-internal-entrypoint.onrender.com`

Render service:

- Blueprint: `vecells-internal-entrypoint`
- Web service: `vecells-internal-entrypoint`
- Service ID: `srv-d7ou1rbeo5us738giuqg`
- Blueprint ID: `exs-d7ou0hgg4nts7386d6t0`
- First deploy commit: `b40b0ca`
- Plan observed in Dashboard: Free

Results:

- `/health` returned `200` with JSON `ok: true`.
- Anonymous `/` returned `200` with the password page.
- Anonymous `/` did not expose the internal app menu.
- Anonymous `/apps/patient-web/` returned the password page.
- Wrong password POST to `/login` returned `401` and displayed the access-denied message.
- Correct internal test password POST to `/login` returned `303` and set the session cookie.
- Authenticated `/internal` returned `200` and displayed the internal menu.
- Authenticated POST to `/reset-client-state` returned `200` with the browser-state reset page.
- POST to `/logout` returned `303` and cleared the session cookie.
- Each authenticated app surface returned `200`, showed the internal test banner, and served a rewritten app asset:
  - patient web;
  - clinical workspace;
  - ops console;
  - hub desk;
  - pharmacy console;
  - support workspace;
  - governance console.

Visible Render logs showed:

- service start command ran successfully;
- the service started on `0.0.0.0:10000`;
- environment was `internal`;
- data mode was `synthetic-disposable`;
- surface count was `7`;
- service became live at the primary URL;
- no visible plaintext password, password hash, or session secret.

## Remaining Smoke Boundary

This is still an internal smoke only. It does not prove production readiness, does not validate real provider integrations, and does not authorize real patient data.
