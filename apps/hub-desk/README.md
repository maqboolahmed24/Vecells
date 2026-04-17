# Hub Desk

        - Package: `@vecells/hub-desk`
        - Artifact id: `app_hub_desk`
        - Repo path: `apps/hub-desk`
        - Owner: `Hub Coordination` (`hub_coordination`)
        - Topology status: `baseline_required`
        - Defect posture: `resolved`

        ## Ownership notes

        Owns hub queue and case-management shell residency; booking, callback, and practice acknowledgements cross the seam only through contracts.

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

        - `blueprint/staff-operations-and-support-blueprint.md#Hub work`

- `blueprint/phase-0-the-foundation-protocol.md#5.6 Booking, waitlist, hub, and pharmacy continuity algorithm`
- `data/analysis/route_family_inventory.csv`

        ## Scripts

        - `dev`: `vite --host 127.0.0.1 --port 4303`

- `build`: `tsc -p tsconfig.json --noEmit && vite build`
- `lint`: `eslint src --ext .ts,.tsx`
- `test`: `vitest run --passWithNoTests`
- `typecheck`: `tsc -p tsconfig.json --noEmit`
- `preview`: `vite preview --host 127.0.0.1 --port 4403`

## Stable markers

- Root landmark: `hub-desk-shell-root`
- Visual marker: `hub-desk::visual`
- Parity marker: `hub-desk::parity`
