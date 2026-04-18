# 277 Phase 3 To Phase 4 Boundary

        Phase 3 closes the Human Checkpoint. Phase 4 starts from the lawful objects and continuity contracts already minted by Phase 3. It does **not** reopen triage truth.

        ## Phase 4 consumes from Phase 3

        - `DecisionEpoch`, `DecisionSupersessionRecord`, and `TaskCompletionSettlementEnvelope`
        - lawful `BookingIntent` and `PharmacyIntent` handoff seeds
        - same-shell continuity, trust, and route-publication law from the staff and patient shells
        - the merged queue or callback or consequence posture from `270` and `271`
        - the formal exit verdict and carry-forward boundary from this task

        ## Phase 4 must not redefine

        - queue determinism or duplicate authority
        - the one-writer many-readers mutation law
        - the same-shell fail-closed recovery model
        - the rule that `LifecycleCoordinator` remains the only request-closure authority
        - the separation between simulator-backed proof and live-provider readiness

        ## Phase 4 entry tasks

        | Owner task | Work item | Category | Risk if absent | Next action |
| --- | --- | --- | --- | --- |
| seq_278 | Freeze BookingCase kernel, state machine, and intent lineage contract | phase4_boundary | Phase 4 implementation could drift if the BookingCase kernel is not frozen before executable work continues. | Publish the BookingCase freeze pack exactly as the lawful consumer of Phase 3 BookingIntent handoff seeds. |
| seq_279 | Freeze provider capability matrix, adapter profiles, and confirmation gates | phase4_boundary | Capability truth could fork if Phase 4 local booking infers supplier behaviour locally. | Publish the capability compiler and projection freeze pack before local booking commit paths land. |
| seq_280 | Freeze slot snapshot, offer scoring, commit, and manage contracts | phase4_boundary | Reservation truth and confirmation truth could drift if slot, offer, and manage semantics are not frozen before implementation. | Publish the slot-to-manage contract pack including reservation and confirmation truth boundaries. |
| seq_281 | Open the Phase 4 local-booking implementation gate with exact ownership | phase4_boundary | Parallel implementation could overlap or duplicate ownership if the gate is not explicit. | Approve only the ready Phase 4 tracks and keep all other work machine-readably deferred. |
| par_282 | Implement durable BookingCase backend kernel | phase4_execution | Booking intent would remain a lawful seed without the durable case state machine needed for Phase 4 execution. | Land BookingCase records, transitions, migrations, and request-lease enforcement against the frozen 278 contract. |
| par_283 | Implement capability compiler and audience-aware capability resolution engine | phase4_execution | Provider capability projection would remain static and Phase 4 flows could infer capability locally. | Land the versioned capability matrix, adapter bindings, and audience-aware projection engine from the 279 freeze pack. |
