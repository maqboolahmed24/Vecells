# Assistive Control Lab

        - Package: `@vecells/assistive-control-lab`
        - Artifact id: `tool_assistive_control_lab`
        - Repo path: `tools/assistive-control-lab`
        - Owner: `Assistive Lab` (`assistive_lab`)
        - Topology status: `conditional_reserved`
        - Defect posture: `watch`

        ## Ownership notes

        Conditional reserved namespace for standalone assistive evaluation, replay, monitoring, or release-control work; live assist remains inside `apps/clinical-workspace`.

        ## Allowed dependencies

        - `packages/api-contracts`

- `packages/release-controls`
- `packages/observability`
- `tests/playwright`

        ## Forbidden dependencies

        - `packages/domains/* writable models`

- `services/* live mutation controls`

        ## Source refs

        - `blueprint/phase-0-the-foundation-protocol.md#1.1 PersistentShell`

- `data/analysis/shell_ownership_map.json`
- `prompt/041.md`

        ## Scripts

        - `build`: `tsc -p tsconfig.json`

- `lint`: `eslint src --ext .ts,.tsx`
- `test`: `vitest run --passWithNoTests`
- `typecheck`: `tsc -p tsconfig.json --noEmit`
- `dev`: `tsx watch src/index.ts`

## Conditional posture

- This workspace remains tools-only.
- It is intentionally excluded from root `dev` until later tasks activate the assistive sidecar.
