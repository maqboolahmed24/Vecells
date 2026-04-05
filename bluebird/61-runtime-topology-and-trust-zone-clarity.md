# Runtime Topology and Trust-Zone Clarity

Use this prompt to direct an autonomous AI agent:

## Prompt
You are a principal systems architect and autonomous remediation agent responsible for fully resolving `Runtime Topology and Trust-Zone Clarity`.

Map this domain to `RuntimeTopologyManifest`, `GatewayBffSurface`, `AudienceSurfaceRouteContract`, `AudienceSurfacePublicationRef`, `RuntimePublicationBundle`, `DependencyDegradationProfile`, tenant isolation, egress allowlists, assurance slices, and the runtime workload families the repository names: public edge, shell delivery, command, projection, integration, data, and assurance or security planes. Your mission is to fully resolve this failure class. Identify and eliminate every place where runtime boundaries, workload ownership, and trust zones are under-modeled or allowed to blur.

Execution mandate:
- Do not stop at diagnosis, observation, or recommendation.
- Read the full algorithm, end-to-end lifecycle, and governing contracts before changing the system.
- Then synthesize the strongest viable remediation and implement it directly when you have write access, using refactoring, schema changes, migration work, and contract hardening where needed.
- When you have write access, deliver patches, refactors, migrations, and contract changes rather than stopping at a change proposal.
- Prefer durable elimination of the failure class over local patches, UI workarounds, extra flags, or operator vigilance.
- Carry the remediation through implementation, verification, rollout or backfill handling, and proof that the unsafe path is closed.

Work method:
- Read the runtime, release, and canonical route-contract sections before making changes.
- Distinguish ingress exposure, browser-facing surface delivery, command execution, projection assembly, external integration, data storage, and assurance or security workloads.
- Trace how runtime publication, provenance, tenant isolation, and assurance trust affect each plane.
- Inspect whether failure domains, fallback modes, and trust boundaries are explicit or implied.
- Move from diagnosis into implementation as soon as the governing model is clear; do not leave the task as analysis-only commentary.

Required remediation work:
- Convert the discovered failure modes into a concrete target design and implement that design across the affected layers.
- Remove or refactor the unsafe paths so the system no longer depends on operator vigilance, local convention, or lucky sequencing.
- For each unsafe condition, carry the fix through the owning algorithm, contracts, storage, integrations, and user-facing state until the failure is removed or explicitly governed.
- Find places where public-edge, gateway, command, projection, and integration concerns are collapsed into one runtime boundary.
- Detect where trust assumptions are globalized instead of slice-bounded, workload-bounded, or audience-surface-bounded.
- Surface missing or weak tenant-isolation, egress, service-identity, or data-store boundary declarations.
- Examine whether degraded dependencies and untrusted assurance slices can affect more runtime planes than intended.
- Identify whether route publication, writable posture, and recovery modes depend on topology facts that are not actually published as runtime contracts.

Implementation posture:
- Choose the remediation that definitively closes the failure class, even if that requires non-trivial refactoring.
- Implement the end-state architecture and algorithm, not just the analysis of it.
- Prefer deleting, consolidating, or hardening weak paths over documenting them or layering more conditional logic on top.
- Do not recommend more infrastructure layers by reflex.
- Prefer clear workload-family boundaries, explicit trust and degradation contracts, and one governed entry plane with separate internal responsibility planes.
- If a runtime boundary is too broad, split it. If two planes differ only operationally but share the same trust model and failure domain, keep them together.
- Ensure topology and trust posture are machine-readable and auditable rather than tribal knowledge in deployment docs.

Produce:
1. A concise description of the current failure mode, its blast radius, and the target end-state.
2. The exact algorithmic, architectural, schema, contract, runtime, and interface changes required to eliminate the issue.
3. The concrete code, migration, configuration, and data-shape changes you will apply, or an exact executable patch plan if the environment is truly read-only.
4. The invariants, state-transition rules, guardrails, and recovery semantics enforced by the new design.
5. The verification suite needed to prove the remediation, including unit, integration, contract, replay, recovery, concurrency, and end-to-end coverage as applicable.
6. The rollout, backfill, reindex, compatibility, and operational validation plan required to land the fix safely.
7. Residual risks only if they remain after implementation, plus the exact evidence required to close them.

Optimize for definitive elimination of `Runtime Topology and Trust-Zone Clarity` through coherent algorithmic and architectural remediation, with durable invariants, safe rollout, and proof-backed correctness. The task is not complete at diagnosis; finish only when the strongest viable remediation is implemented and proven, or reduced to an exact executable change set for a truly read-only environment.
