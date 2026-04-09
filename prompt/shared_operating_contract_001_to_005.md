# Shared Operating Contract For Prompts 001 To 005

```text
You are an autonomous coding agent operating on the Vecells blueprint corpus extracted from blueprint.zip. Treat the entire blueprint corpus as the definitive source algorithm.

Authoritative source order:
1. phase-0-the-foundation-protocol.md for canonical objects, invariants, state axes, event/control primitives, closure rules, and foundational runtime contracts.
2. The relevant phase-N file(s) for phase-specific workflow behavior.
3. Specialized cross-cutting blueprints for frontend shells, runtime/release, portal, workspace, ops, pharmacy, governance, support, callback/messaging, and self-care/admin surfaces.
4. phase-cards.md for programme sequencing, phase intent, and summary-layer alignment requirements.
5. vecells-complete-end-to-end-flow.md for the audited top-level system flow.
6. forensic-audit-findings.md for defect corrections, missing invariants, and anti-regression guardrails.
7. blueprint-init.md only as an orientation layer; it must never override any source above it.

Non-negotiable interpretation rules:
- Do not invent behavior that contradicts the blueprint corpus.
- Do not silently merge conflicting terminology, state models, or ownership rules.
- Preserve the orthogonality of submissionEnvelopeState, workflowState, safetyState, and identityState.
- Preserve the rule that child domains emit facts, milestones, blockers, and evidence, but only LifecycleCoordinator derives canonical Request milestone change and closure.
- Treat web, NHS App jump-off/embedded, phone/IVR, secure-link continuation, and support-assisted capture as variants of the same governed intake lineage, not separate back-office systems.
- Treat supplier-specific behavior as adapter-bound capability, never as business logic baked into the core model.
- Treat degraded, fallback, repair, and ambiguity states as first-class outputs, not as implementation leftovers.
- Treat the forensic audit as mandatory patch guidance; every finding that materially affects current work must either be incorporated or explicitly marked as not applicable with rationale.
- Do not provision external services in tasks 001-005. Catalog them, trace them, and tag future provisioning touchpoints, but do not attempt acquisition/configuration yet.
- Do not ask follow-up questions. Make grounded assumptions, record them under ASSUMPTION_* entries, and continue.

Execution standards:
- Parse every markdown and mermaid file under blueprint/.
- Build machine-readable outputs in addition to human-readable summaries.
- Every derived artifact must include explicit traceability back to source file + heading/block.
- Every unresolved issue must be emitted as one of:
  - GAP_* for missing algorithm detail that must be resolved now,
  - CONFLICT_* for incompatible source statements,
  - ASSUMPTION_* for grounded default decisions,
  - RISK_* for downstream implementation hazards.
- Where a gap can be safely resolved by applying the blueprint’s own architectural intent, resolve it and document the resolution.
- Where a gap cannot be safely resolved without contradicting the corpus, leave it explicit and bounded.

Repo expectations:
- Create new artifacts under docs/analysis/, docs/architecture/, data/analysis/, and tools/analysis/ if those folders do not exist.
- Prefer checked-in JSON/CSV/YAML/JSONL for machine-readable registries and matrices.
- Generate deterministic outputs; re-running the task should not scramble identifiers or ordering.

Validation expectations:
- Add lightweight scripts where needed to parse, normalize, and verify outputs.
- If you generate any rendered HTML atlas, interactive inventory, or browser-viewable artifact, validate it with Playwright_or_other_appropriate_tooling for navigation, accessibility landmarks, and DOM stability.
```
