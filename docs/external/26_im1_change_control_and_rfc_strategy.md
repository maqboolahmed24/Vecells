# 26 IM1 Change Control And RFC Strategy

        The RFC watch closes the gap where later AI or other major scope changes could otherwise reuse stale IM1 paperwork.

        ## Section A — `Mock_now_execution`

        The rehearsal studio surfaces RFC trigger classes beside licence readiness and live gates so future scope changes are visible before any supplier action happens.

        ### Trigger register

        | Trigger | Change class | RFC required | Required delta | Why |
| --- | --- | --- | --- | --- |
| RFC_AI_EXPANSION | AI or assistive decision support added to an assured IM1 flow | yes | Updated SCAL, hazard log, DPIA, and model/supplier assurance documentation. | Official IM1 guidance names AI and significant functional enhancements as explicit RFC triggers. |
| RFC_ROUTE_FAMILY_WIDEN | New patient or staff route family begins using the assured IM1 capability set | yes | Updated route-family matrix, capability digest, and booking-truth guardrail statement. | Route widening changes the assured use case and can invalidate earlier pairing posture. |
| RFC_NEW_PROVIDER_SUPPLIER | A new provider supplier or foundation supplier is targeted | yes | Refreshed roster evidence, supplier-specific compatibility review, and updated licence register. | Supplier-specific pairing posture cannot be inferred from an earlier supplier. |
| RFC_MUTATION_SCOPE_WIDEN | Writable booking or manage actions widen beyond the earlier assured surface | yes | Updated BookingProviderAdapterBinding evidence, control-plane proof, and degraded-mode review. | Widening mutable scope changes truth, safety, and rollback semantics. |
| RFC_SAMD_BOUNDARY_CHANGE | Medical-device or SaMD boundary changes | yes | Updated clinical safety case, hazard log, and regulatory evidence. | The public prerequisites form explicitly calls out added scrutiny for software as a medical device. |
| RFC_DATA_FLOW_OR_SUBPROCESSOR_CHANGE | New patient-data processing path, UK processing statement change, or material subprocessor change | yes | Updated DPIA, privacy notice, DSPT/ISMS posture, and residency statement. | Changes to the information-governance pack can invalidate the earlier assured posture. |
| RFC_NO_CHANGE | Documentation refresh only with no use-case or functional change | no | Refresh the evidence index only. | Not every evidence refresh is an RFC, but freshness must still be tracked. |

        ## Section B — `Actual_provider_strategy_later`

        Later real change control must use the official RFC path and carry updated SCAL plus associated documentation whenever the assured IM1 use case has materially changed.

        ### Gate linkage

        | Gate | Status | Reason |
| --- | --- | --- |
| LIVE_GATE_EXTERNAL_FOUNDATION_WITHHELD | blocked | Seq_020 still reports the downstream external-readiness gate as withheld. |
| LIVE_GATE_CREDIBLE_MVP_AND_BOUNDED_USE_CASE | blocked | The rehearsal dossier is ready, but the pack still treats the real provider path as later and gated. |
| LIVE_GATE_PROVIDER_CAPABILITY_MODEL_FROZEN | review_required | The capability model is defined, but supplier-path evidence and seq_036 freeze work are not complete yet. |
| LIVE_GATE_SAFETY_PRIVACY_ARCHITECTURE_CURRENT | review_required | Current artifacts exist, but the IM1-specific evidence bundle still needs later approval freshness. |
| LIVE_GATE_NAMED_SPONSOR_AND_COMMERCIAL_OWNER | blocked | The pack carries placeholders only for sponsor and commercial owner. |
| LIVE_GATE_IM1_NOT_PHASE2_IDENTITY_SHORTCUT | pass | The pack explicitly fences IM1 away from patient ownership, grant redemption, and baseline continuity. |
| LIVE_GATE_NAMED_APPROVER_PRESENT | blocked | The dry-run profile still uses an approver placeholder. |
| LIVE_GATE_ENVIRONMENT_TARGET_PRESENT | blocked | The pack defaults to placeholder environment labels and requires explicit later confirmation. |
| LIVE_GATE_PROVIDER_ROSTER_REFRESH_REQUIRED | blocked | The actual-provider dry-run must fetch the current official roster before any real preparation occurs. |
| LIVE_GATE_MUTATION_FLAG_ENABLED | blocked | Real provider mutation remains disabled by default. |
