# Support Workspace

        - Package: `@vecells/support-workspace`
        - Artifact id: `app_support_workspace`
        - Repo path: `apps/support-workspace`
        - Owner: `Support` (`support`)
        - Topology status: `baseline_required`
        - Defect posture: `resolved`

        ## Ownership notes

        Closes the support-shell omission and records that replay, observe, and assisted capture remain support work rather than operations or governance drift.

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

        - `blueprint/staff-operations-and-support-blueprint.md#Support route contract`

- `docs/architecture/04_surface_conflict_and_gap_report.md`
- `data/analysis/gateway_surface_matrix.csv`

        ## Scripts

        - `dev`: `vite --host 127.0.0.1 --port 4305`

- `build`: `tsc -p tsconfig.json --noEmit && vite build`
- `lint`: `eslint src --ext .ts,.tsx`
- `test`: `vitest run --passWithNoTests`
- `typecheck`: `tsc -p tsconfig.json --noEmit`
- `preview`: `vite preview --host 127.0.0.1 --port 4405`

## Stable markers

- Root landmark: `support-workspace-shell-root`
- Visual marker: `support-workspace::visual`
- Parity marker: `support-workspace::parity`
