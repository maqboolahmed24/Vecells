# Prompt 03: Render Runtime Readiness, Node, Host, Port, Env

Run this after Prompt 02 has produced a validated deployment baseline branch.

```text
You are Codex working in /Users/test/Code/V.

Goal:
Make the runtime code Render-ready without creating render.yaml yet. Focus on Node version pinning, host/port binding, env documentation, and local compatibility.

Non-negotiable constraints:
- Cross-check official Render docs before citing behavior:
  - https://render.com/docs/web-services
  - https://render.com/docs/node-version
- Do not create Render resources.
- Do not create render.yaml in this prompt.
- Do not commit secrets or password values.
- Keep local dev/test behavior working.

Must read first:
- deployment-docs/01-project-audit.md
- deployment-docs/02-render-internal-strategy.md
- deployment-docs/07-verified-links.md
- output/result from Prompt 02

Known blockers to verify:
- services/api-gateway binds 127.0.0.1
- services/command-api binds 127.0.0.1
- services/projection-worker binds 127.0.0.1
- services/notification-worker binds 127.0.0.1
- services/adapter-simulators binds 127.0.0.1
- root package.json has no engines field
- no .nvmrc or .node-version was present during audit

Execution steps:
1. Inspect service config/runtime files:
   - services/api-gateway/src/config.ts
   - services/api-gateway/src/runtime.ts
   - services/command-api/src/config.ts
   - services/command-api/src/runtime.ts
   - services/projection-worker/src/config.ts
   - services/projection-worker/src/runtime.ts
   - services/notification-worker/src/config.ts
   - services/notification-worker/src/runtime.ts
   - services/adapter-simulators/src/index.ts
2. Add a Render-compatible host config pattern:
   - local default can remain 127.0.0.1;
   - deployed host must support 0.0.0.0;
   - service public port should support process.env.PORT where appropriate.
3. Avoid breaking integration tests that use port 0.
4. Add or update tests for host/port parsing if practical.
5. Pin Node consistently:
   - GitHub uses Node 24.
   - local observed Node was v24.10.0.
   - Render docs currently default new Node services to Node 24.14.1, but pinning avoids drift.
   - Choose a conservative Node 24 pin after checking package/tool compatibility.
6. Update env docs/templates without adding secrets:
   - .env.example if needed;
   - deployment-docs docs if a discovered fact changed.

Validation commands:
- pnpm --dir services/api-gateway typecheck
- pnpm --dir services/api-gateway test
- pnpm --dir services/command-api typecheck
- pnpm --dir services/command-api test
- pnpm --dir services/projection-worker typecheck
- pnpm --dir services/projection-worker test
- pnpm --dir services/notification-worker typecheck
- pnpm --dir services/notification-worker test
- pnpm --dir services/adapter-simulators typecheck
- pnpm --dir services/adapter-simulators test
- NX_TUI=false pnpm typecheck
- NX_TUI=false pnpm build
- NX_TUI=false pnpm test

Deliverables:
- Files changed.
- Exact host/port behavior after the change.
- Validation results.
- Updated blocker list.
- Next prompt to run: Prompt 04.

Acceptance criteria:
- Services can bind 0.0.0.0 for Render.
- Public Render service can use process.env.PORT.
- Local tests still pass.
- Node version is pinned.
- No Render Blueprint or resources have been created.
```

