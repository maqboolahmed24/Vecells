# Projection Worker

        - Package: `@vecells/projection-worker`
        - Repo path: `services/projection-worker`
        - Owner: `Platform Runtime` (`platform_runtime`)
        - Workload family: `projection_read_derivation`

        ## Purpose

        Own event consumption, rebuild/backfill hooks, projection freshness markers, stale-read posture, and dead-letter seams for derived read models.

        ## Truth Boundary

        Projection output is derived read state only. It never becomes the write authority and it never hides freshness or continuity debt.

        ## Port Contract

        - Service port env keys: `PROJECTION_WORKER_SERVICE_PORT`, compatibility fallback `PROJECTION_WORKER_PORT`
        - Admin port env key: `PROJECTION_WORKER_ADMIN_PORT`
        - Default ports: service `7102`, admin `7202`

        ## Route Catalog

        | Method | Path | Contract family | Purpose |
        | --- | --- | --- | --- |
        | `POST` | `/events/intake` | `ProjectionContractFamily` | Accept an event-envelope placeholder, stage projection rebuild work, and expose dead-letter posture. |

| `GET` | `/projections/freshness` | `ProjectionQueryContract` | Expose freshness budgets, stale-read posture, continuity watch, and backfill hooks. |

        ## Topics Consumed

        - `command.accepted`

- `projection.rebuild.requested`
- `projection.backfill.requested`

        ## Topics Published

        - `projection.updated`

- `projection.dead-lettered`

        ## Allowed Dependencies

        - `packages/domains/* (public projections only)`

- `packages/domain-kernel`
- `packages/event-contracts`
- `packages/api-contracts`
- `packages/fhir-mapping`
- `packages/observability`
- `packages/release-controls`

        ## Forbidden Dependencies

        - `apps/*`

- `packages/design-system`
- `direct browser clients`

        ## Secret Boundaries

        - `PROJECTION_CURSOR_STORE_REF`

- `PROJECTION_DEAD_LETTER_STORE_REF`

          ## Environment Contract

          | Env key | Type | Default | Purpose |
          | --- | --- | --- | --- |
          | `PROJECTION_WORKER_CONSUMER_BATCH_SIZE` | `number` | `25` | Maximum event count consumed per placeholder worker batch. |

  | `PROJECTION_WORKER_FRESHNESS_BUDGET_SECONDS` | `number` | `45` | Freshness budget before a projection is explicitly considered stale. |
  | `PROJECTION_WORKER_DEAD_LETTER_TOPIC` | `string` | `projection.dead-lettered` | Topic used for poison events and dead-letter review. |
  | `PROJECTION_WORKER_REBUILD_WINDOW_MODE` | `enum` | `scheduled` | Controls whether rebuild work may be scheduled automatically or requires an operator. |
  | `PROJECTION_WORKER_POISON_RETRY_LIMIT` | `number` | `3` | Number of retry attempts before a poison event is dead-lettered. |

          ## Degraded Dependency Profiles

          | Dependency id | Dependency | Degraded default | Manual fallback |
          | --- | --- | --- | --- |
          | `dep_pds_fhir_enrichment` | Optional PDS enrichment seam | Keep enrichment fully off and rely on local matching only; do not widen patient identity confidence from incomplete or legally unapproved PDS signals. | Support-assisted correction or governed local review without changing the baseline identity contract. |

          ## Test Harnesses

          - `unit`: `services/projection-worker/tests/config.test.js`

- `integration`: `services/projection-worker/tests/runtime.integration.test.js`
