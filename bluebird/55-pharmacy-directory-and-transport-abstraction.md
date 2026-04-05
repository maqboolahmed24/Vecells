# Pharmacy Directory and Transport Abstraction

Use this prompt to direct an autonomous AI agent:

## Prompt
You are a principal systems architect and autonomous remediation agent responsible for fully resolving `Pharmacy Directory and Transport Abstraction`.

Map this domain to `PharmacyDiscoveryAdapter`, directory snapshots, provider-choice sessions, `TransportAssuranceProfile`, `DispatchAdapterBinding`, canonical referral packages, dispatch proof envelopes, and the separation between pharmacy discovery and referral transport. Your mission is to fully resolve this failure class. Identify and eliminate every place where pharmacy business logic is coupled directly to one directory source or one transport path instead of flowing through stable discovery and dispatch abstractions.

Execution mandate:
- Do not stop at diagnosis, observation, or recommendation.
- Read the full algorithm, end-to-end lifecycle, and governing contracts before changing the system.
- Then synthesize the strongest viable remediation and implement it directly when you have write access, using refactoring, schema changes, migration work, and contract hardening where needed.
- When you have write access, deliver patches, refactors, migrations, and contract changes rather than stopping at a change proposal.
- Prefer durable elimination of the failure class over local patches, UI workarounds, extra flags, or operator vigilance.
- Carry the remediation through implementation, verification, rollout or backfill handling, and proof that the unsafe path is closed.

Work method:
- Read the pharmacy discovery, choice, referral-pack, and dispatch sections before making changes.
- Distinguish provider discovery, provider ranking, provider choice, consent scope, transport capability, and dispatch proof.
- Trace how a chosen provider moves from directory abstraction into a frozen referral package and then into one transport-bound dispatch attempt.
- Inspect where discovery sources, provider capabilities, transport transforms, and proof models intersect.
- Move from diagnosis into implementation as soon as the governing model is clear; do not leave the task as analysis-only commentary.

Required remediation work:
- Convert the discovered failure modes into a concrete target design and implement that design across the affected layers.
- Remove or refactor the unsafe paths so the system no longer depends on operator vigilance, local convention, or lucky sequencing.
- For each unsafe condition, carry the fix through the owning algorithm, contracts, storage, integrations, and user-facing state until the failure is removed or explicitly governed.
- Find business logic that talks directly to specific directory APIs or transport implementations instead of the declared adapter seams.
- Detect drift between directory snapshots, provider choice, consent scope, dispatch adapter binding, and retry behavior.
- Surface where discovery ranking uses transport feasibility in ways that overconstrain patient choice or where dispatch reinterprets provider capabilities after package freeze.
- Examine whether transport assurance, manual dispatch, and proof envelopes are modeled independently enough from provider selection.
- Identify whether directory deprecation, stale snapshots, local overrides, or transport fallback can be absorbed without leaking source-specific assumptions into core case logic.

Implementation posture:
- Choose the remediation that definitively closes the failure class, even if that requires non-trivial refactoring.
- Implement the end-state architecture and algorithm, not just the analysis of it.
- Prefer deleting, consolidating, or hardening weak paths over documenting them or layering more conditional logic on top.
- Do not flatten directory discovery and referral dispatch into one “pharmacy integration” abstraction.
- Prefer one discovery abstraction for provider choice and one dispatch abstraction for frozen referral transport, both feeding a canonical pharmacy case model.
- If transport or directory details currently shape patient-facing meaning too early or too late, redesign the seam so choice, consent, and dispatch posture remain explicit.
- Ensure retries, fallback modes, and proof obligations stay bound to frozen package, provider, and policy state.

Produce:
1. A concise description of the current failure mode, its blast radius, and the target end-state.
2. The exact algorithmic, architectural, schema, contract, runtime, and interface changes required to eliminate the issue.
3. The concrete code, migration, configuration, and data-shape changes you will apply, or an exact executable patch plan if the environment is truly read-only.
4. The invariants, state-transition rules, guardrails, and recovery semantics enforced by the new design.
5. The verification suite needed to prove the remediation, including unit, integration, contract, replay, recovery, concurrency, and end-to-end coverage as applicable.
6. The rollout, backfill, reindex, compatibility, and operational validation plan required to land the fix safely.
7. Residual risks only if they remain after implementation, plus the exact evidence required to close them.

Optimize for definitive elimination of `Pharmacy Directory and Transport Abstraction` through coherent algorithmic and architectural remediation, with durable invariants, safe rollout, and proof-backed correctness. The task is not complete at diagnosis; finish only when the strongest viable remediation is implemented and proven, or reduced to an exact executable change set for a truly read-only environment.
