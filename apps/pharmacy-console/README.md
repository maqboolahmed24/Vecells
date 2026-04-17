# Pharmacy Console

        - Package: `@vecells/pharmacy-console`
        - Artifact id: `app_pharmacy_console`
        - Repo path: `apps/pharmacy-console`
        - Owner: `Pharmacy` (`pharmacy`)
        - Topology status: `baseline_required`
        - Defect posture: `resolved`

        ## Ownership notes

        Closes the starter-shape omission for the servicing-site shell and keeps dispatch proof inside package and service seams.

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

        - `blueprint/pharmacy-console-frontend-architecture.md#Mission frame`

- `docs/architecture/04_surface_conflict_and_gap_report.md`
- `data/analysis/gateway_surface_matrix.csv`

        ## Scripts

        - `dev`: `vite --host 127.0.0.1 --port 4304`

- `build`: `tsc -p tsconfig.json --noEmit && vite build`
- `lint`: `eslint src --ext .ts,.tsx`
- `test`: `vitest run --passWithNoTests`
- `typecheck`: `tsc -p tsconfig.json --noEmit`
- `preview`: `vite preview --host 127.0.0.1 --port 4404`

## Stable markers

- Root landmark: `pharmacy-console-shell-root`
- Visual marker: `pharmacy-console::visual`
- Parity marker: `pharmacy-console::parity`
