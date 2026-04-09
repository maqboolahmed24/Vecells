# 12 Developer Experience And Local Bootstrap

Phase 0 requires one-command startup, preview rendering, and deterministic contract regeneration. The workspace baseline therefore makes local bootstrap a first-class graph target rather than a sidecar script collection.

## Canonical Commands

```bash
pnpm bootstrap        # install, validate env, and regenerate generated packages
pnpm dev              # boot the local topology: shells, gateway, services, workers, simulators
pnpm check            # format, lint, typecheck, boundary validation, unit + contract tests
pnpm codegen          # regenerate route, event, live-channel, design, and fixture artifacts
pnpm test:e2e         # Playwright shell verification against local preview
pnpm verify:release   # build, contract parity, migration dry-run, SBOM/provenance checks
```

## Local Bootstrap Law

- `tools/dev-bootstrap` owns environment loading, secret presence checks, simulator wiring, and local service choreography.
- Preview environments are graph targets, not bespoke shell scripts per app.
- Generated packages must be reproducible from source contracts in local and CI flows.
- Secrets, credentials, and provider-specific values are injected at runtime and never committed to source or generated artifacts.
