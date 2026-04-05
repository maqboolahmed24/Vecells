# Gateway and BFF Boundary Enforcement

Use this prompt to direct an autonomous AI agent:

## Prompt
You are a principal systems architect and autonomous remediation agent responsible for fully resolving `Gateway and BFF Boundary Enforcement`.

Map this domain to `GatewayBffSurface`, `FrontendContractManifest`, `AudienceSurfaceRouteContract`, `AudienceSurfacePublicationRef`, `RuntimePublicationBundle`, `ProjectionQueryContract`, and any route-family-specific query or command surface exposed to browsers. Your mission is to fully resolve this failure class. Identify and eliminate every place where the gateway or BFF boundary is under-enforced, allowing shells to infer writability, publication posture, or recovery semantics from convention rather than from typed contracts.

Execution mandate:
- Do not stop at diagnosis, observation, or recommendation.
- Read the full algorithm, end-to-end lifecycle, and governing contracts before changing the system.
- Then synthesize the strongest viable remediation and implement it directly when you have write access, using refactoring, schema changes, migration work, and contract hardening where needed.
- When you have write access, deliver patches, refactors, migrations, and contract changes rather than stopping at a change proposal.
- Prefer durable elimination of the failure class over local patches, UI workarounds, extra flags, or operator vigilance.
- Carry the remediation through implementation, verification, rollout or backfill handling, and proof that the unsafe path is closed.

Work method:
- Read the runtime, release, and frontend contract blueprints before making changes.
- Trace how a browser route resolves query contracts, writable posture, publication state, command settlement, and recovery disposition.
- Distinguish domain services, projection composition, gateway concerns, and shell-only presentation logic.
- Inspect whether direct backend surfaces bypass the intended BFF contract layer.
- Move from diagnosis into implementation as soon as the governing model is clear; do not leave the task as analysis-only commentary.

Required remediation work:
- Convert the discovered failure modes into a concrete target design and implement that design across the affected layers.
- Remove or refactor the unsafe paths so the system no longer depends on operator vigilance, local convention, or lucky sequencing.
- For each unsafe condition, carry the fix through the owning algorithm, contracts, storage, integrations, and user-facing state until the failure is removed or explicitly governed.
- Find route families where the gateway does not authoritatively declare writable posture, settlement schema, or recovery behavior.
- Detect cases where frontend code reconstructs business capability from route names, flags, or projection shape instead of typed contracts.
- Surface places where publication, release, channel, or assurance posture can drift without the BFF failing closed.
- Examine whether command and projection boundaries are clean or whether the gateway has become a second domain layer.
- Identify where internal APIs expose more than the browser-facing contract should allow.

Implementation posture:
- Choose the remediation that definitively closes the failure class, even if that requires non-trivial refactoring.
- Implement the end-state architecture and algorithm, not just the analysis of it.
- Prefer deleting, consolidating, or hardening weak paths over documenting them or layering more conditional logic on top.
- Do not move all business logic into the BFF.
- Prefer a thin but authoritative contract boundary that composes projections, publishes route posture, and refuses stale or withdrawn writable state.
- If the current gateway leaks too much domain knowledge or too little contract truth, rebalance it around typed route-family contracts.
- Ensure shells consume explicit publication, settlement, and recovery metadata rather than guessing.

Produce:
1. A concise description of the current failure mode, its blast radius, and the target end-state.
2. The exact algorithmic, architectural, schema, contract, runtime, and interface changes required to eliminate the issue.
3. The concrete code, migration, configuration, and data-shape changes you will apply, or an exact executable patch plan if the environment is truly read-only.
4. The invariants, state-transition rules, guardrails, and recovery semantics enforced by the new design.
5. The verification suite needed to prove the remediation, including unit, integration, contract, replay, recovery, concurrency, and end-to-end coverage as applicable.
6. The rollout, backfill, reindex, compatibility, and operational validation plan required to land the fix safely.
7. Residual risks only if they remain after implementation, plus the exact evidence required to close them.

Optimize for definitive elimination of `Gateway and BFF Boundary Enforcement` through coherent algorithmic and architectural remediation, with durable invariants, safe rollout, and proof-backed correctness. The task is not complete at diagnosis; finish only when the strongest viable remediation is implemented and proven, or reduced to an exact executable change set for a truly read-only environment.
