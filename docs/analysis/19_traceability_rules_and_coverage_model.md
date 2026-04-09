# Traceability Rules And Coverage Model

## Deterministic Inputs

The explorer consumes the requirement registry, checklist-backed task inventory, milestone graph, ADR set, state and object atlases, external dependency inventory, and seq_018 risk posture. No trace row is created from checklist prose alone.

## Coverage Rules

- Every requirement gets at least one trace row.
- Invariants and test obligations must carry `test` or `gate` coverage.
- Deferred Phase 7 requirements stay on deferred scope rows and are represented through `deferred_placeholder` coverage until their deferred implementation tasks become active.
- External-dependency requirements prefer inventory, provisioning, simulator, configuration, and integration tasks before generic gates.
- Frontend continuity, shell, route, accessibility, and writable-posture requirements must carry both surface and verification coverage.
- Empty prompt files do not invalidate the roadmap task, but they downgrade grounding strength to `partial` or `inferred_gap_closure` and surface in the orphan-task export.

## Coverage Strength Semantics

- `direct`: task title, phase, and domain all align with the requirement role.
- `supporting`: task is an intended chain element, but the match is broader or shared.
- `partial`: the task probably contributes, but the prompt spec or task title is still broad.
- `inferred_gap_closure`: fallback mapping created to avoid ungrounded checklist drift.
