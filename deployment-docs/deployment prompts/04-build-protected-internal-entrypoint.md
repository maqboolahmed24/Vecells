# Prompt 04: Build Protected Internal Entrypoint

Run this after Prompt 03 has made service runtime behavior Render-ready.

```text
You are Codex working in /Users/test/Code/V.

Goal:
Create the single public internal tester entrypoint with password protection. This entrypoint should be the only URL nontechnical testers need.

Non-negotiable constraints:
- Internal team test only, not official launch.
- No real patient data.
- No raw password or secret committed.
- Do not rely on Render Enterprise IP allowlisting.
- Do not expose seven ungated public app URLs as the tester flow.
- Do not create render.yaml yet unless the user explicitly combines this with Prompt 06.

Must read first:
- deployment-docs/02-render-internal-strategy.md
- deployment-docs/05-internal-access-control.md
- deployment-docs/07-verified-links.md
- output/result from Prompt 03

Design requirements:
- One public web app/service.
- Anonymous user sees only a password page.
- Correct password opens an internal menu for:
  - patient web
  - clinical workspace
  - ops console
  - hub desk
  - pharmacy console
  - support workspace
  - governance console
- Every authenticated page shows internal/non-production warning text.
- Logout clears session.
- Use secure HTTP-only cookies in production.
- Use hash comparison, not plaintext password storage.
- Use env vars:
  - INTERNAL_TEST_PASSWORD_HASH or equivalent
  - SESSION_SECRET
- Use generated/documented local dev defaults only if they are explicitly non-secret and not valid for Render.

Implementation guidance:
1. Inspect existing app/service conventions before choosing location.
2. Prefer minimal code that fits the repo:
   - a small Node service can serve built static app directories under stable paths;
   - avoid adding a large auth framework for this temporary internal gate;
   - avoid a marketing landing page.
3. If adding a new app/service package, register it in:
   - pnpm-workspace.yaml if needed;
   - project.json/Nx if the repo pattern requires it;
   - root scripts only if needed.
4. Add tests for:
   - anonymous access blocked;
   - wrong password blocked;
   - correct password sets session;
   - logout clears session;
   - app menu routes render.
5. Add deployment docs for how to generate password hash and session secret without committing them.

Validation:
- pnpm install --frozen-lockfile if package files changed.
- Targeted typecheck/build/test for the new entrypoint.
- NX_TUI=false pnpm typecheck
- NX_TUI=false pnpm build
- NX_TUI=false pnpm test

Security review:
- Search changed files for plaintext passwords, SESSION_SECRET values, and accidental real URLs/secrets.
- Confirm cookies are Secure in production and HTTP-only.
- Confirm no unauthenticated route exposes app content.

Deliverables:
- Entrypoint path/package name.
- URL paths it serves locally.
- Required env vars.
- Validation results.
- Any limitations.
- Next prompt to run: Prompt 05.

Acceptance criteria:
- The protected internal entrypoint works locally.
- Nontechnical testers can use one URL and one password.
- No secret value is committed.
- Existing app builds/tests remain green.
```

