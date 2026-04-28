# 16 Domain Runtime and Control Plane Architecture

        This view captures lifecycle ownership, continuity proof, and cross-domain control-plane law.

        ## Domain Runtime and Control Plane

                The control plane stitches 41 state machines into one cross-domain lifecycle and continuity model.

                ### Linked ADRs

                | ADR | Title | Status |
| --- | --- | --- |
| ADR-016-001 | Vecells-first domain truth with FHIR only at the representation boundary | accepted |
| ADR-016-006 | Append-only state transition and event spine with projection-first browser reads | accepted |
| ADR-016-008 | LifecycleCoordinator, route intent, and command settlement are the only legal cross-domain mutation spine | accepted |
| ADR-016-012 | Assurance evidence, readiness, and recovery posture share one operational authority model | accepted |
| ADR-016-014 | Assistive capability stays optional, sidecar-bound, human-controlled, and kill-switchable | accepted |
| ADR-016-015 | Publication, continuity proof, watch tuples, and resilience controls are one cross-phase architecture control plane | accepted |

                ### Nodes

                | Node | Kind | Primary ADR |
| --- | --- | --- |
| Request and lineage kernel | domain | ADR-016-001 |
| Booking, hub, pharmacy, comms, support | domain | ADR-016-006 |
| LifecycleCoordinator | control | ADR-016-008 |
| Continuity and shell proof | control | ADR-016-010 |
| Release and publication tuples | control | ADR-016-011 |
| Assurance and resilience tuples | control | ADR-016-012 |
| Optional assistive sidecar | optional | ADR-016-014 |
| Cross-phase architecture control plane | control | ADR-016-015 |

                ### Edges

                | From | To | Meaning |
| --- | --- | --- |
| dr_lineage | dr_domains | governing aggregate truth |
| dr_domains | dr_lifecycle | milestones and signals |
| dr_lifecycle | dr_continuity | same-shell authority |
| dr_release | dr_continuity | publication and trust fence |
| dr_assurance | dr_release | watch and readiness parity |
| dr_assistive | dr_domains | artifact-only assist |
| dr_arch_cp | dr_release | shared tuple law |
| dr_arch_cp | dr_assurance | continuity and resilience parity |
