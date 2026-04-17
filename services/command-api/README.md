# Command API

        - Package: `@vecells/command-api`
        - Repo path: `services/command-api`
        - Owner: `Platform Runtime` (`platform_runtime`)
        - Workload family: `mutation_command_ingress`

        ## Purpose

        Own mutation command ingress, validation, idempotency envelope reservation, route-intent hooks, mutation gates, and outbox publication seams without implementing feature logic yet.

        ## Truth Boundary

        Command acceptance is not settlement truth. Finality requires downstream settlement, projection freshness, and external proof where contracts demand it.

        ## Port Contract

        - Service port env keys: `COMMAND_API_SERVICE_PORT`, compatibility fallback `COMMAND_API_PORT`
        - Admin port env key: `COMMAND_API_ADMIN_PORT`
        - Default ports: service `7101`, admin `7201`

        ## Route Catalog

        | Method | Path | Contract family | Purpose |
        | --- | --- | --- | --- |
        | `POST` | `/commands/submit` | `MutationCommandContract` | Reserve idempotency, validate route-intent hooks, and queue outbox publication. |

| `GET` | `/commands/contracts` | `MutationCommandContract` | Expose the mutation contract seam, settlement ladder, and outbox publication shape. |

        ## Topics Consumed

        - none

        ## Topics Published

        - `command.accepted`

- `command.outbox.pending`

        ## Allowed Dependencies

        - `packages/domains/* (public entrypoints only)`

- `packages/domain-kernel`
- `packages/event-contracts`
- `packages/api-contracts`
- `packages/authz-policy`
- `packages/fhir-mapping`
- `packages/observability`
- `packages/release-controls`

        ## Forbidden Dependencies

        - `apps/*`

- `packages/design-system`
- `tools/** runtime bypasses`

        ## Secret Boundaries

        - `COMMAND_IDEMPOTENCY_STORE_REF`

- `COMMAND_MUTATION_GATE_SECRET_REF`

          ## Environment Contract

          | Env key | Type | Default | Purpose |
          | --- | --- | --- | --- |
          | `COMMAND_API_IDEMPOTENCY_TTL_SECONDS` | `number` | `900` | Time-to-live for reserved idempotency keys. |

  | `COMMAND_API_OUTBOX_TOPIC` | `string` | `command.outbox.pending` | Event topic used for deferred outbox publication. |
  | `COMMAND_API_MUTATION_GATE_MODE` | `enum` | `named_review` | Controls whether mutation gates observe, enforce, or require named review. |
  | `COMMAND_API_ROUTE_INTENT_MODE` | `enum` | `required` | Controls route-intent hook strictness at command ingress. |

          ## Degraded Dependency Profiles

          | Dependency id | Dependency | Degraded default | Manual fallback |
          | --- | --- | --- | --- |
          | `dep_nhs_login_rail` | NHS login authentication rail | Freeze the route in claim-pending or auth-read-only posture until writable authority is re-proven for the same subject and route intent. | Route to support-assisted recovery or a secure-link continuation path without widening identity truth. |

  | `dep_pds_fhir_enrichment` | Optional PDS enrichment seam | Keep enrichment fully off and rely on local matching only; do not widen patient identity confidence from incomplete or legally unapproved PDS signals. | Support-assisted correction or governed local review without changing the baseline identity contract. |

          ## Test Harnesses

          - `unit`: `services/command-api/tests/config.test.js`

- `integration`: `services/command-api/tests/runtime.integration.test.js`
