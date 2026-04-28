# 16 Frontend Gateway and Design Contract Architecture

        This view freezes shell law, gateway publication, and design-contract publication in one browser-authority model.

        ## Frontend, Gateway, and Design Contract Architecture

                Design and runtime publication remain locked together across 22 gateway surfaces and 8 design-publication rows.

                ### Linked ADRs

                | ADR | Title | Status |
| --- | --- | --- |
| ADR-016-005 | Audience-specific gateway surfaces with route-family publication instead of one generic BFF | accepted |
| ADR-016-007 | Immutable evidence and artifact pipeline with parity proof, redaction, and mode truth | accepted |
| ADR-016-010 | Persistent shell law, design-contract publication, and same-shell continuity are core architecture | accepted |
| ADR-016-011 | ReleaseApprovalFreeze and publication tuples freeze writable posture | accepted |
| ADR-016-013 | Data classification, masking, and audit disclosure are runtime disclosure controls, not reporting policy only | accepted |
| ADR-016-015 | Publication, continuity proof, watch tuples, and resilience controls are one cross-phase architecture control plane | accepted |
| ADR-016-016 | Embedded NHS App channel remains deferred and non-authoritative in the current baseline | deferred |

                ### Nodes

                | Node | Kind | Primary ADR |
| --- | --- | --- |
| Persistent shells | audience | ADR-016-010 |
| Route-family contracts | gateway | ADR-016-005 |
| DesignContractPublicationBundle | design | ADR-016-010 |
| AudienceSurfaceRuntimeBinding | control | ADR-016-011 |
| Artifact and disclosure posture | design | ADR-016-007 |
| ReleaseRecoveryDisposition | control | ADR-016-011 |
| Deferred embedded bridge | deferred | ADR-016-016 |

                ### Edges

                | From | To | Meaning |
| --- | --- | --- |
| fg_shells | fg_route | shell ownership claims |
| fg_route | fg_design | state and marker vocab |
| fg_design | fg_runtime | design digest in runtime tuple |
| fg_runtime | fg_shells | writable or recovery posture |
| fg_artifact | fg_shells | artifact mode truth |
| fg_deferred | fg_runtime | compatibility only |
