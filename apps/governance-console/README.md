# Governance Console

        - Package: `@vecells/governance-console`
        - Artifact id: `app_governance_console`
        - Repo path: `apps/governance-console`
        - Owner: `Governance Admin` (`governance_admin`)
        - Topology status: `baseline_required`
        - Defect posture: `resolved`

        ## Ownership notes

        Closes the governance/admin omission and makes release, access, config, and communications review a first-class shell rather than an operations subpanel.

        ## Allowed dependencies

        - `packages/api-contracts`

- `packages/design-system`
- `packages/observability`
- `packages/release-controls`

        ## Forbidden dependencies

        - `packages/domains/*`

- `services/*`
- `packages/fhir-mapping`
- `tools/** private entrypoints`

        ## Source refs

        - `blueprint/governance-admin-console-frontend-blueprint.md#Shell and route topology`

- `docs/architecture/04_surface_conflict_and_gap_report.md`
- `data/analysis/shell_ownership_map.json`

        ## Scripts

        - `dev`: `vite --host 127.0.0.1 --port 4306`

- `build`: `tsc -p tsconfig.json --noEmit && vite build`
- `lint`: `eslint src --ext .ts,.tsx`
- `test`: `vitest run --passWithNoTests`
- `typecheck`: `tsc -p tsconfig.json --noEmit`
- `preview`: `vite preview --host 127.0.0.1 --port 4406`

## Stable markers

- Root landmark: `governance-console-shell-root`
- Visual marker: `governance-console::visual`
- Parity marker: `governance-console::parity`
