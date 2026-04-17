# Ops Console

        - Package: `@vecells/ops-console`
        - Artifact id: `app_ops_console`
        - Repo path: `apps/ops-console`
        - Owner: `Operations` (`operations`)
        - Topology status: `baseline_required`
        - Defect posture: `resolved`

        ## Ownership notes

        Owns operations board and drill-down shell frames while governance handoff stays explicit and reversible.

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

        - `blueprint/operations-console-frontend-blueprint.md#Canonical route family`

- `docs/architecture/04_surface_conflict_and_gap_report.md`
- `data/analysis/route_family_inventory.csv`

        ## Scripts

        - `dev`: `vite --host 127.0.0.1 --port 4302`

- `build`: `tsc -p tsconfig.json --noEmit && vite build`
- `lint`: `eslint src --ext .ts,.tsx`
- `test`: `vitest run --passWithNoTests`
- `typecheck`: `tsc -p tsconfig.json --noEmit`
- `preview`: `vite preview --host 127.0.0.1 --port 4402`

## Stable markers

- Root landmark: `ops-console-shell-root`
- Visual marker: `ops-console::visual`
- Parity marker: `ops-console::parity`
