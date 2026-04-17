# Adapter Simulators

        - Package: `@vecells/adapter-simulators`
        - Artifact id: `service_adapter_simulators`
        - Repo path: `services/adapter-simulators`
        - Owner: `Platform Integration` (`platform_integration`)
        - Topology status: `baseline_required`
        - Defect posture: `clean`

        ## Ownership notes

        Non-authoritative local integration lab for unavailable or manual providers; never a substitute for live-provider proof.

        ## Allowed dependencies

        - `packages/api-contracts`

- `packages/event-contracts`
- `packages/fhir-mapping`
- `packages/test-fixtures`
- `packages/observability`

        ## Forbidden dependencies

        - `apps/*`

- `packages/domains/* private internals`
- `live-provider credentials`

        ## Source refs

        - `docs/external/38_local_adapter_simulator_backlog.md`

- `docs/external/39_manual_approval_checkpoint_register.md`
- `prompt/041.md`

        ## Scripts

        - `build`: `tsc -p tsconfig.json`

- `lint`: `eslint src --ext .ts,.tsx`
- `test`: `vitest run --passWithNoTests`
- `typecheck`: `tsc -p tsconfig.json --noEmit`
- `dev`: `tsx watch src/index.ts`
