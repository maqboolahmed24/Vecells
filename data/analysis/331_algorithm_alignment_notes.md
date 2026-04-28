# 331 Algorithm Alignment Notes

## Governing runtime objects to UI surfaces

| UI surface | Primary backend/runtime object | Required truth law |
| --- | --- | --- |
| `HubNoSlotResolutionPanel` | `HubFallbackRecord`, `AlternativeOfferSession`, `AlternativeOfferFallbackCard` | no-slot cannot erase prior option context |
| `HubCallbackTransferPendingState` | `CallbackFallbackRecord`, `HubCoordinationException(callback_transfer_blocked)` | callback pending stays unresolved until durable linkage exists |
| `HubReturnToPracticeReceipt` | `HubReturnToPracticeRecord` | return must show linked workflow and urgency carry |
| `HubUrgentBounceBackBanner` | `HubFallbackRecord(fallbackType = urgent_return_to_practice)` | urgent return stays visually different from ordinary coordination |
| `HubRecoveryDiffStrip` | `HubSupplierObservation`, `HubProjectionBackfillCursor`, truth projection reopen | reopen is diff-first and anchor-preserving |
| `HubReopenProvenanceStub` | `AlternativeOfferSession(read_only_provenance)` and preserved candidate anchor | superseded choices remain explanatory, not actionable |
| `HubSupervisorEscalationPanel` | `HubFallbackSupervisorEscalation`, `HubCoordinationException(loop_prevention)` | repeat low-novelty bounce escalates visibly |
| `HubExceptionQueueView` | `HubExceptionWorkItem`, `HubCoordinationException` | exceptions are typed operational work, not dead-route logs |
| `HubExceptionDetailDrawer` | `HubExceptionAuditRow`, current recovery truth | next safe action stays bounded and explicit |

## Local component binding

- `hub-case-052` binds the no-slot + callback pending path from `323`
- `hub-case-031` binds urgent return and loop-prevention escalation from `323`
- `hub-case-041` binds reopen ambiguity and supplier-drift widening from `325`
- `/hub/exceptions` binds the typed backlog surface from `325`

## Shell laws carried forward

- selected case anchor remains stable across queue, case, and exceptions routes from `326`
- decision dock and visible option context remain in place from `327`
- current booked/drift posture still derives from the existing confirmation pane and truth surfaces from `329`
- reminder and manage detail remain out of scope and unchanged from `330`
