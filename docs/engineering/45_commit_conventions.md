# 45 Commit Conventions

        Vecells commit history must communicate architectural intent. Generic labels such as `update`, `misc`, and `chore` are not part of the allowed taxonomy.

        ## Header Format

        ```text
        type(scope)!: short imperative summary
        ```

        - `type` must be one of the approved types below.
        - `scope` is optional but recommended. Use a bounded context, workspace, or subsystem such as `patient-web`, `release-controls`, or `topology`.
        - `!` marks a breaking or high-risk change and triggers extra footer requirements.
        - Keep the summary between 10 and 88 characters and avoid a trailing period.

        ## Allowed Types

        | Type | Use when |
        | --- | --- |
        | `arch` | Architecture decisions, topology law, boundary rules, ADR-aligned structural changes. |

| `scaffold` | Generated scaffolds, deterministic builders, workspace skeleton changes, contract-first placeholders. |
| `feat` | New user-visible or operator-visible behavior within an approved architectural seam. |
| `fix` | Behavior correction, regression repair, or bug fix. |
| `test` | New or improved verification, fixtures, or Playwright coverage without primary product behavior change. |
| `docs` | Documentation-only changes, including standards and operating docs. |
| `security` | Secret handling, auth hardening, redaction, vulnerability remediation, or security control changes. |
| `release` | Release-control, provenance, parity, deployment, watch, or recovery posture changes. |
| `migration` | Schema, contract, data, or compatibility migration work. |

        ## Required Footers

        Every commit must include:

        ```text
        Task: seq_045
        Refs: prompt/045.md, prompt/AGENT.md, docs/architecture/41_repository_topology_rules.md
        ```

        ## Risk Footers

        Commits with type `release`, type `migration`, or a breaking `!` header must also include:

        ```text
        Risk: route-intent, release-control, migration, or trust-posture impact
        Validation: pnpm check; pnpm test:e2e
        ```

        ## Examples

        ```text
        scaffold(topology): add deterministic engineering standards generator

        Task: seq_045
        Refs: prompt/045.md, docs/architecture/41_repository_topology_rules.md
        ```

        ```text
        release(release-controls)!: tighten live mutation evidence gate

        Task: seq_061
        Refs: prompt/061.md, docs/architecture/15_verification_ladder_and_quality_gate_strategy.md
        Risk: release-control and trust-posture enforcement changed
        Validation: pnpm check; pnpm verify:release
        ```
