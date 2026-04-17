# 43 Service Scaffold Map

        ## Mission

        Scaffold the canonical runtime service skeletons for the API gateway, command API, projection worker, and notification worker with explicit runtime boundaries, typed configuration, observability hooks, and readiness-first contract seams.

        ## Summary

        - Visual mode: `Runtime_Service_Map`
        - Service count: `4`
        - Route count: `8`
        - Topic count: `14`
        - Package count: `13`
        - Degraded dependency count: `4`

        ## Service Register

        | Service | Owner | Workload family | Ports (service/admin) | Routes | Publishes | Truth boundary |
        | --- | --- | --- | --- | --- | --- | --- |
        | `api-gateway` | `platform_runtime` | `gateway_ingress` | `7100` / `7200` | `2` | `2` | Ingress policy only. The gateway does not own mutation settlement, projection freshness truth, or provider delivery truth. |
| `command-api` | `platform_runtime` | `mutation_command_ingress` | `7101` / `7201` | `2` | `2` | Command acceptance is not settlement truth. Finality requires downstream settlement, projection freshness, and external proof where contracts demand it. |
| `projection-worker` | `platform_runtime` | `projection_read_derivation` | `7102` / `7202` | `2` | `2` | Projection output is derived read state only. It never becomes the write authority and it never hides freshness or continuity debt. |
| `notification-worker` | `platform_integration` | `notification_dispatch_and_settlement` | `7103` / `7203` | `2` | `3` | Dispatch acceptance is not delivery truth. Provider callbacks, resend policy, and settlement evidence stay explicit and can fail closed. |

        ## Runtime Conventions

        - Every service owns separate service and admin ports and exposes `/health`, `/ready`, and `/manifest` from the admin listener.
        - Every work route propagates `x-correlation-id` and `x-trace-id` headers and emits structured JSON logs.
        - No service reaches into another context's private internals; imports remain pinned to shared contracts or public domain entrypoints only.
        - Command acceptance, projection update, and notification dispatch remain seams, not proof of final truth.

        ## Service Detail

        ### API Gateway

                - Repo path: `services/api-gateway`
                - Purpose: Own ingress HTTP, auth/session edge adapters, request correlation, rate limiting, and release-aware route-to-BFF handoff without becoming a hidden truth owner.
                - Truth boundary: Ingress policy only. The gateway does not own mutation settlement, projection freshness truth, or provider delivery truth.
                - Composition root: `services/api-gateway/src/runtime.ts#createRuntime`

                | Method | Path | Contract family | Purpose |
                | --- | --- | --- | --- |
                | `GET` | `/ingress/surfaces` | `GatewayBffSurface` | Expose shell-facing gateway surfaces, route families, and ingress policy seams. |
| `GET` | `/ingress/release-awareness` | `ReleaseGateEvidence` | Expose release ring, publication watch, and route-freeze awareness hooks. |

                | Dependency id | Ambiguity class | Degraded default | Manual fallback |
                | --- | --- | --- | --- |
                | `dep_nhs_login_rail` | Auth Authority Pending | Freeze the route in claim-pending or auth-read-only posture until writable authority is re-proven for the same subject and route intent. | Route to support-assisted recovery or a secure-link continuation path without widening identity truth. |

### Command API

                - Repo path: `services/command-api`
                - Purpose: Own mutation command ingress, validation, idempotency envelope reservation, route-intent hooks, mutation gates, and outbox publication seams without implementing feature logic yet.
                - Truth boundary: Command acceptance is not settlement truth. Finality requires downstream settlement, projection freshness, and external proof where contracts demand it.
                - Composition root: `services/command-api/src/runtime.ts#createRuntime`

                | Method | Path | Contract family | Purpose |
                | --- | --- | --- | --- |
                | `POST` | `/commands/submit` | `MutationCommandContract` | Reserve idempotency, validate route-intent hooks, and queue outbox publication. |
| `GET` | `/commands/contracts` | `MutationCommandContract` | Expose the mutation contract seam, settlement ladder, and outbox publication shape. |

                | Dependency id | Ambiguity class | Degraded default | Manual fallback |
                | --- | --- | --- | --- |
                | `dep_nhs_login_rail` | Auth Authority Pending | Freeze the route in claim-pending or auth-read-only posture until writable authority is re-proven for the same subject and route intent. | Route to support-assisted recovery or a secure-link continuation path without widening identity truth. |
| `dep_pds_fhir_enrichment` | Governed Enrichment Withheld | Keep enrichment fully off and rely on local matching only; do not widen patient identity confidence from incomplete or legally unapproved PDS signals. | Support-assisted correction or governed local review without changing the baseline identity contract. |

### Projection Worker

                - Repo path: `services/projection-worker`
                - Purpose: Own event consumption, rebuild/backfill hooks, projection freshness markers, stale-read posture, and dead-letter seams for derived read models.
                - Truth boundary: Projection output is derived read state only. It never becomes the write authority and it never hides freshness or continuity debt.
                - Composition root: `services/projection-worker/src/runtime.ts#createRuntime`

                | Method | Path | Contract family | Purpose |
                | --- | --- | --- | --- |
                | `POST` | `/events/intake` | `ProjectionContractFamily` | Accept an event-envelope placeholder, stage projection rebuild work, and expose dead-letter posture. |
| `GET` | `/projections/freshness` | `ProjectionQueryContract` | Expose freshness budgets, stale-read posture, continuity watch, and backfill hooks. |

                | Dependency id | Ambiguity class | Degraded default | Manual fallback |
                | --- | --- | --- | --- |
                | `dep_pds_fhir_enrichment` | Governed Enrichment Withheld | Keep enrichment fully off and rely on local matching only; do not widen patient identity confidence from incomplete or legally unapproved PDS signals. | Support-assisted correction or governed local review without changing the baseline identity contract. |

### Notification Worker

                - Repo path: `services/notification-worker`
                - Purpose: Own dispatch envelopes, provider adapter boundaries, settlement callbacks, controlled resend hooks, and secret-safe delivery seams without embedding live provider credentials.
                - Truth boundary: Dispatch acceptance is not delivery truth. Provider callbacks, resend policy, and settlement evidence stay explicit and can fail closed.
                - Composition root: `services/notification-worker/src/runtime.ts#createRuntime`

                | Method | Path | Contract family | Purpose |
                | --- | --- | --- | --- |
                | `POST` | `/dispatch/envelopes` | `CanonicalEventContract` | Accept a placeholder dispatch envelope and expose provider/settlement seams. |
| `GET` | `/dispatch/settlement` | `DependencyDegradationProfile` | Expose delivery settlement ladder, resend controls, and safe provider boundary posture. |

                | Dependency id | Ambiguity class | Degraded default | Manual fallback |
                | --- | --- | --- | --- |
                | `dep_sms_notification_provider` | Delivery Or Recipient Disputed | Withdraw seeded continuation trust and fall back to challenge-based continuation or another governed contact route when recipient or delivery truth is disputed. | Support reissue or bounded callback under the same grant lineage rather than silent re-send. |
| `dep_email_notification_provider` | Delivery Or Thread Unresolved | Preserve a read-only, pending-delivery, or repair-needed posture until current delivery evidence or a governed fallback settles the route. | Use controlled resend, callback escalation, or support repair under the same authoritative communication chain. |
