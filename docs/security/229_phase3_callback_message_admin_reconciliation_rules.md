# 229 Phase 3 Callback, Message, and Admin Reconciliation Rules

## Edge verification and replay resistance

1. Provider callbacks, delivery receipts, and webhook retries must reconcile through `AdapterReceiptCheckpoint`.
2. Callback attempts and message dispatches are keyed by canonical fences; same-fence retries must reuse the existing attempt or dispatch.
3. Divergent same-fence evidence opens governed replay or collision review instead of rewriting history.

## Patient-visible promise discipline

1. `CallbackExpectationEnvelope` is the sole patient-visible callback promise and repair guide.
2. `ThreadExpectationEnvelope` is the sole patient-visible reply, repair, and awaiting-review posture.
3. Confidence scores may widen pending or repair posture, but may never manufacture answered, delivered, reviewed, or completed truth without evidence and a resolution gate.

## Mutation gating

1. Route presence does not imply write authority.
2. Callback, message, advice, and admin mutations must validate the active route binding, release posture, trust posture, and current unsuperseded `DecisionEpoch`.
3. Staff-originated admin actions also require live lease and workspace consistency context.

## Least-privilege disclosure

1. Patient and staff shells may expose only the currently published expectation, evidence, and completion summaries appropriate to the active visibility tier.
2. Detached completion pages, local success toasts, or support-local acknowledgements are not authority-bearing records.
3. Repair blockers such as reachability, identity, consent, or external confirmation must surface as the dominant next action instead of hiding inside diagnostics.

## Boundary integrity

1. `SelfCareBoundaryDecision` is the sole classifier of self-care, bounded admin, or clinician re-entry.
2. Admin subtype labels cannot redefine clinical meaning or widen operational authority.
3. `AdminResolutionCompletionArtifact` is required for any completed admin consequence.
4. `AdminResolutionSettlement.result = completed` is invalid without the matching typed artifact and current `boundaryTupleHash`.

## Reopen and safety preemption

1. New symptoms, safety preemption, material evidence, invalidated advice, delivery dispute on an active dependency, or unstable dependency sets reopen boundary review.
2. When reopen is required, stale admin or self-care consequence remains visible as provenance but freezes in place.
3. `LifecycleCoordinator` remains the only request-closure authority after these domain settlements complete.
