# 16 Data Event Storage and Integration Architecture

        This view keeps data truth, eventing, evidence, storage, and adapter settlement aligned.

        ## Data, Event, Storage, and Integration Architecture

                The current baseline depends on 20 external dependencies but keeps domain truth, settlement, and replay authority inside the append-only platform spine.

                ### Linked ADRs

                | ADR | Title | Status |
| --- | --- | --- |
| ADR-016-001 | Vecells-first domain truth with FHIR only at the representation boundary | accepted |
| ADR-016-006 | Append-only state transition and event spine with projection-first browser reads | accepted |
| ADR-016-007 | Immutable evidence and artifact pipeline with parity proof, redaction, and mode truth | accepted |
| ADR-016-009 | Integrations remain adapter-seamed, capability-matrix bound, and proof-settled | accepted |
| ADR-016-013 | Data classification, masking, and audit disclosure are runtime disclosure controls, not reporting policy only | accepted |

                ### Nodes

                | Node | Kind | Primary ADR |
| --- | --- | --- |
| Ingress and evidence capture | data | ADR-016-007 |
| Canonical domain aggregates | domain | ADR-016-001 |
| Append-only event spine | data | ADR-016-006 |
| Projection read models | storage | ADR-016-006 |
| FHIR and partner representations | integration | ADR-016-001 |
| Artifact and audit stores | storage | ADR-016-007 |
| External adapter seams | integration | ADR-016-009 |

                ### Edges

                | From | To | Meaning |
| --- | --- | --- |
| de_ingress | de_domain | normalized submissions and snapshots |
| de_domain | de_events | authoritative milestones |
| de_events | de_projections | browser read truth |
| de_domain | de_fhir | derived representations only |
| de_ingress | de_artifact | immutable artifacts and redactions |
| de_fhir | de_adapters | partner exchange bundles |
