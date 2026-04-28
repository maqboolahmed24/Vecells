# 128 Synthetic Reference Flow

Generated at: 2026-04-14T04:49:44Z

## Mission

This harness seeds and proves one deterministic Phase 0 synthetic reference flow across the current gateway, command API, domain kernel, event spine, projection worker, and shell-facing manifest layers. It keeps the old `seq_059` corpus intact while adding executable per-case traces that later Phase 0 merge and exit work can reuse.

## Runtime Chain

1. Real local HTTP request into `api-gateway` authority evaluation.
2. Real local HTTP request into `command-api` mutation ingress.
3. Canonical domain or orchestrator proof using the already-published Phase 0 backbones.
4. Published event-spine transport mapping and scenario views.
5. Real local HTTP request into `projection-worker` intake and freshness endpoints.
6. Shell continuity proof from the fused route-to-shell authority tuple catalog and this observatory.

## Reference Cases

| Reference case | Class | Route family | Gateway surface | Shell continuity | Gaps |
| --- | --- | --- | --- | --- | --- |
| `RC_FLOW_001` | `nominal` | `rf_intake_self_service` | `gws_patient_intake_web` | The patient shell returns to the same request lineage with a truthful settled posture instead of a reopened draft. | `GAP_REFERENCE_FLOW_EVENT_MAPPING_INTAKE_PROMOTION_STARTED`<br/>`GAP_REFERENCE_FLOW_EVENT_MAPPING_INTAKE_PROMOTION_SUPERSEDED_GRANTS_APPLIED`<br/>`GAP_REFERENCE_FLOW_EVENT_MAPPING_INTAKE_PROMOTION_COMMITTED` |
| `RC_FLOW_002` | `replay` | `rf_patient_requests` | `gws_patient_requests` | The authenticated patient shell stays on the prior request lineage and reuses the authoritative outcome without minting a second request. | `GAP_REFERENCE_FLOW_EVENT_SPINE_REPLAY_MAPPING_PENDING`<br/>`GAP_REFERENCE_FLOW_EVENT_MAPPING_INTAKE_PROMOTION_STARTED`<br/>`GAP_REFERENCE_FLOW_EVENT_MAPPING_INTAKE_PROMOTION_SUPERSEDED_GRANTS_APPLIED`<br/>`GAP_REFERENCE_FLOW_EVENT_MAPPING_INTAKE_PROMOTION_COMMITTED`<br/>`GAP_REFERENCE_FLOW_EVENT_MAPPING_INTAKE_PROMOTION_REPLAY_RETURNED` |
| `RC_FLOW_003` | `duplicate_review` | `rf_support_ticket_workspace` | `gws_support_ticket_workspace` | The support workspace keeps the task in place, exposes duplicate-review debt, and does not silently attach to another request. | `GAP_REFERENCE_FLOW_SURFACE_DUPLICATE_REVIEW_LINKAGE_SEMANTIC_MATCH_ONLY` |
| `RC_FLOW_004` | `quarantine_fallback` | `rf_support_replay_observe` | `gws_support_replay_observe` | Patient-visible continuity remains truthful while support replay observes the same lineage and manual fallback review is opened. | `GAP_REFERENCE_FLOW_SURFACE_SUPPORT_REPLAY_MUTATION_PATH_UNPUBLISHED`<br/>`GAP_REFERENCE_FLOW_SURFACE_SUPPORT_REPLAY_CONTINUES_VIA_READ_ONLY_PUBLISHED_SHELL` |
| `RC_FLOW_005` | `identity_hold` | `rf_patient_secure_link_recovery` | `gws_patient_secure_link_recovery` | The patient recovery shell stays lineage-aware, but mutation stays blocked until identity repair is governed and auditable. | `GAP_REFERENCE_FLOW_SURFACE_PATIENT_SECURE_LINK_RECOVERY_PUBLICATION_BLOCKED`<br/>`GAP_REFERENCE_FLOW_EVENT_MAPPING_REACHABILITY_CHANGED` |
| `RC_FLOW_006` | `confirmation_blocked` | `rf_hub_case_management` | `gws_hub_case_management` | The hub shell keeps the same lineage open, marks confirmation debt explicitly, and does not collapse pending transport into calm completion. | none |

## Assertions

- Transport acknowledgement is captured, but it never becomes business truth by itself.
- Exact replay reuses the prior authoritative request and produces zero new side effects.
- Duplicate review, quarantine fallback, identity hold, and confirmation debt stay first-class machine-readable reference cases.
- Closure blockers are recorded as `LifecycleCoordinator`-owned defer decisions instead of local shell shortcuts.
