# Clinical Workspace

        - Package: `@vecells/clinical-workspace`
        - Artifact id: `app_clinical_workspace`
        - Repo path: `apps/clinical-workspace`
        - Owner: `Triage Workspace` (`triage_workspace`)
        - Topology status: `baseline_required`
        - Defect posture: `resolved`

        ## Ownership notes

        Owns the staff shell and bounded assistive sidecar while triage, booking, and communications truth stay package-owned.

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

        - `blueprint/platform-frontend-blueprint.md#Clinical workspace shell`

- `blueprint/staff-operations-and-support-blueprint.md#Workspace contract`
- `data/analysis/audience_surface_inventory.csv`

        ## Scripts

        - `dev`: `vite --host 127.0.0.1 --port 4301`

- `build`: `tsc -p tsconfig.json --noEmit && vite build`
- `lint`: `eslint src --ext .ts,.tsx`
- `test`: `vitest run --passWithNoTests`
- `typecheck`: `tsc -p tsconfig.json --noEmit`
- `preview`: `vite preview --host 127.0.0.1 --port 4401`

## Stable markers

- Root landmark: `clinical-workspace-shell-root`
- Visual marker: `clinical-workspace::visual`
- Parity marker: `clinical-workspace::parity`
