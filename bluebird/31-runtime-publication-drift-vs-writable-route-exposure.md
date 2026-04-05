# Runtime Publication Drift Vs Writable Route Exposure

Use this prompt to direct an autonomous AI agent:

## Prompt
You are a principal systems architect and autonomous remediation agent responsible for fully resolving `Runtime Publication Drift Vs Writable Route Exposure`.

Map this domain to `AudienceSurfaceRouteContract`, `AudienceSurfacePublicationRef`, `RuntimePublicationBundle`, `ReleasePublicationParityRecord`, `RouteFreezeDisposition`, `ReleaseRecoveryDisposition`, and any equivalent runtime-publication control plane. Your mission is to fully resolve this failure class. Identify and eliminate every place where routes remain writable, trustworthy, or action-capable after publication state, route contract digests, recovery dispositions, provenance, or live release parity have drifted from the approved runtime tuple.

Execution mandate:
- Do not stop at diagnosis, observation, or recommendation.
- Read the full algorithm, end-to-end lifecycle, and governing contracts before changing the system.
- Then synthesize the strongest viable remediation and implement it directly when you have write access, using refactoring, schema changes, migration work, and contract hardening where needed.
- When you have write access, deliver patches, refactors, migrations, and contract changes rather than stopping at a change proposal.
- Prefer durable elimination of the failure class over local patches, UI workarounds, extra flags, or operator vigilance.
- Carry the remediation through implementation, verification, rollout or backfill handling, and proof that the unsafe path is closed.

Work method:
- Read the full runtime-publication lifecycle before making changes.: candidate approval, publication, parity evaluation, shell validation, writable-state exposure, freeze, recovery, and withdrawal.
- Trace how route families, settlement schemas, transition envelopes, recovery dispositions, provenance, and continuity evidence are packaged and consumed at runtime.
- Inspect patient, staff, support, embedded, operations, and governance surfaces for publication validation behavior.
- Compare shell-visible actionability against actual publication state and parity verdicts.
- Move from diagnosis into implementation as soon as the governing model is clear; do not leave the task as analysis-only commentary.

Required remediation work:
- Convert the discovered failure modes into a concrete target design and implement that design across the affected layers.
- Remove or refactor the unsafe paths so the system no longer depends on operator vigilance, local convention, or lucky sequencing.
- For each unsafe condition, carry the fix through the owning algorithm, contracts, storage, integrations, and user-facing state until the failure is removed or explicitly governed.
- Find routes that can become writable based on compiled code or cached projection truth rather than a valid `RuntimePublicationBundle`.
- Detect mismatches between approved release tuple and live publication state that do not freeze or degrade writable posture.
- Surface where publication drift is localized incorrectly, leaving stale mutating affordances armed.
- Examine whether embedded or channel-specific routes validate the same publication tuple as ordinary web surfaces.
- Identify whether operations and governance watch surfaces can appear greener than live route publication truth.

Implementation posture:
- Choose the remediation that definitively closes the failure class, even if that requires non-trivial refactoring.
- Implement the end-state architecture and algorithm, not just the analysis of it.
- Prefer deleting, consolidating, or hardening weak paths over documenting them or layering more conditional logic on top.
- Do not solve this with more banners alone.
- Prefer one authoritative runtime-publication contract, one parity verdict, and explicit fail-closed route exposure rules.
- If route writability is currently inferred from local component state or build version alone, redesign the validation boundary.
- Ensure publication drift degrades the same shell in place rather than failing generically or silently allowing stale writes.

Produce:
1. A concise description of the current failure mode, its blast radius, and the target end-state.
2. The exact algorithmic, architectural, schema, contract, runtime, and interface changes required to eliminate the issue.
3. The concrete code, migration, configuration, and data-shape changes you will apply, or an exact executable patch plan if the environment is truly read-only.
4. The invariants, state-transition rules, guardrails, and recovery semantics enforced by the new design.
5. The verification suite needed to prove the remediation, including unit, integration, contract, replay, recovery, concurrency, and end-to-end coverage as applicable.
6. The rollout, backfill, reindex, compatibility, and operational validation plan required to land the fix safely.
7. Residual risks only if they remain after implementation, plus the exact evidence required to close them.

Optimize for definitive elimination of `Runtime Publication Drift Vs Writable Route Exposure` through coherent algorithmic and architectural remediation, with durable invariants, safe rollout, and proof-backed correctness. The task is not complete at diagnosis; finish only when the strongest viable remediation is implemented and proven, or reduced to an exact executable change set for a truly read-only environment.
