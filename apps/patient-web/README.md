# Patient Web

        - Package: `@vecells/patient-web`
        - Artifact id: `app_patient_web`
        - Repo path: `apps/patient-web`
        - Owner: `Patient Experience` (`patient_experience`)
        - Topology status: `baseline_required`
        - Defect posture: `watch`

        ## Ownership notes

        Owns patient-shell residency, including embedded reuse, while all lifecycle truth remains in packages and services.

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

        - `blueprint/phase-0-the-foundation-protocol.md#0A. Delivery skeleton and repository architecture`

- `blueprint/platform-frontend-blueprint.md#Shell and route-family ownership rules`
- `data/analysis/shell_ownership_map.json`

        ## Scripts

        - `dev`: `vite --host 127.0.0.1 --port 4300`

- `build`: `tsc -p tsconfig.json --noEmit && vite build`
- `lint`: `eslint src --ext .ts,.tsx`
- `test`: `vitest run --passWithNoTests`
- `typecheck`: `tsc -p tsconfig.json --noEmit`
- `preview`: `vite preview --host 127.0.0.1 --port 4400`

## Stable markers

- Root landmark: `patient-web-shell-root`
- Visual marker: `patient-web::visual`
- Parity marker: `patient-web::parity`
