# 28 Mesh Live Gate And Approval Strategy

        Section A — `Mock_now_execution`

        Mock-now execution is fully enabled. The local twin, mailroom console, and dry-run harness work without real mailbox ownership, real credentials, or real workflow approval.

        Section B — `Actual_provider_strategy_later`

        Current posture: **blocked**.

        | gate_id | status | title | reason |
| --- | --- | --- | --- |
| MESH_LIVE_GATE_PHASE0_EXTERNAL_READY | blocked | Current-baseline external readiness gate cleared | Phase 0 entry remains withheld and GATE_EXTERNAL_TO_FOUNDATION is still blocked. |
| MESH_LIVE_GATE_WORKFLOW_SET_TRACEABLE | pass | Workflow set is source traceable to bounded-context needs | Every candidate workflow row is bound to route families, bounded contexts, and business-flow summaries. |
| MESH_LIVE_GATE_OWNER_ODS_KNOWN | review_required | Mailbox owner ODS posture is known | Placeholder ODS rows exist in the pack, but partner-specific owner ODS still needs confirmation before real submission. |
| MESH_LIVE_GATE_MANAGER_MODE_DECIDED | review_required | Third-party mailbox manager posture is decided | The form shape and register exist, but the real owner-managed versus third-party-managed posture is still placeholder-only. |
| MESH_LIVE_GATE_PATH_TO_LIVE_NEED_STATED | pass | Path to Live versus local sandbox posture is explicit | The pack separates local sandbox, Path to Live-like rehearsal, and live mailbox need by workflow row and gate policy. |
| MESH_LIVE_GATE_API_ONBOARDING_COMPLETE | blocked | Live API onboarding is complete for any live API mailbox request | Official guidance requires API onboarding before a live MESH API mailbox, and that onboarding is not yet complete. |
| MESH_LIVE_GATE_MESH_TEAM_LIAISON_READY | review_required | Workflow request liaison with MESH or Spine DevOps is recorded | The workflow-request dossier is prepared, but the named MESH-team contact is still empty. |
| MESH_LIVE_GATE_NAMED_APPROVER_PRESENT | blocked | Named approver and environment target are present | Real submission remains fail-closed until a named approver and target environment are explicitly provided. |
| MESH_LIVE_GATE_MUTATION_AND_SPEND_ACK | blocked | Real mutation and spend acknowledgements are enabled | Any real mailbox or workflow submission remains blocked until both mutation and spend guards are explicitly enabled when applicable. |
| MESH_LIVE_GATE_MINIMUM_NECESSARY_REVIEW | review_required | Minimum-necessary payload and proof review is current | The route matrix encodes the proof law, but a live payload minimisation review is not yet attached. |
| MESH_LIVE_GATE_FINAL_POSTURE | blocked | Current submission posture | The pack is ready for mock-now execution and dry-run preparation only; live mailbox and workflow submission stays blocked. |

        ## Required environment gates

        `MESH_NAMED_APPROVER`, `MESH_ENVIRONMENT_TARGET`, `MESH_MAILBOX_OWNER_ODS`, `MESH_MANAGING_PARTY_MODE`, `MESH_WORKFLOW_TEAM_CONTACT`, `MESH_API_ONBOARDING_COMPLETE`, `MESH_MINIMUM_NECESSARY_REVIEW_REF`, `ALLOW_REAL_PROVIDER_MUTATION`, `ALLOW_SPEND`

        ## Submission law

        - Do not submit a real mailbox request unless the workflow set is source-traceable.
        - Do not request a live API mailbox until API onboarding is complete.
        - Do not request new workflow IDs unless the MESH-team liaison and business-flow statement are present.
        - Do not mutate a real provider unless `ALLOW_REAL_PROVIDER_MUTATION=true`.
        - Do not proceed down any commercial or managed-service path unless `ALLOW_SPEND=true`.
