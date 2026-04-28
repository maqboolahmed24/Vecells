# API Gateway

        - Package: `@vecells/api-gateway`
        - Repo path: `services/api-gateway`
        - Owner: `Platform Runtime` (`platform_runtime`)
        - Workload family: `gateway_ingress`

        ## Purpose

        Own ingress HTTP, auth/session edge adapters, request correlation, rate limiting, and release-aware route-to-BFF handoff without becoming a hidden truth owner.

        ## Truth Boundary

        Ingress policy only. The gateway does not own mutation settlement, projection freshness truth, or provider delivery truth.

        ## Port Contract

        - Service port env keys: `API_GATEWAY_SERVICE_PORT`, compatibility fallback `API_GATEWAY_PORT`
        - Admin port env key: `API_GATEWAY_ADMIN_PORT`
        - Default ports: service `7100`, admin `7200`

        ## Route Catalog

        | Method | Path | Contract family | Purpose |
        | --- | --- | --- | --- |
        | `GET` | `/ingress/surfaces` | `GatewayBffSurface` | Expose shell-facing gateway surfaces, route families, and ingress policy seams. |

| `GET` | `/ingress/release-awareness` | `ReleaseGateEvidence` | Expose release ring, publication watch, and route-freeze awareness hooks. |
| `GET` | `/authority/surfaces` | `GatewaySurfaceAuthorityManifest` | Expose audience-scoped gateway services, route publications, refusal policy, and downstream boundary posture. |
| `GET` | `/authority/openapi` | `GatewaySurfaceOpenApiPublication` | Publish audience-scoped OpenAPI documents for declared browser-callable route families without implying undeclared handlers. |
| `POST` | `/authority/evaluate` | `GatewaySurfaceAuthorityEvaluation` | Evaluate whether a route family, contract, cache posture, or downstream boundary request is explicitly permitted. |

        ## Topics Consumed

        - none

        ## Topics Published

        - `gateway.request.observed`

- `gateway.freeze.reviewed`

        ## Allowed Dependencies

        - `packages/api-contracts`

- `packages/authz-policy`
- `packages/observability`
- `packages/release-controls`

        ## Forbidden Dependencies

        - `packages/domains/* private internals`

- `apps/*`
- `packages/fhir-mapping`
- `direct adapter SDK imports`

        ## Secret Boundaries

        - `AUTH_EDGE_SESSION_SECRET_REF`

- `AUTH_EDGE_SIGNING_KEY_REF`

          ## Environment Contract

          | Env key | Type | Default | Purpose |
          | --- | --- | --- | --- |
          | `API_GATEWAY_RATE_LIMIT_PER_MINUTE` | `number` | `180` | Ingress allowance before gateway rate limiting becomes active. |

  | `API_GATEWAY_AUTH_EDGE_MODE` | `enum` | `hybrid` | Controls whether auth/session edge adapters run in simulator-only, watch-only, or hybrid posture. |
  | `API_GATEWAY_ROUTE_FREEZE_MODE` | `enum` | `observe` | Controls whether route-freeze awareness is advisory or enforcement-based at ingress. |

          ## Degraded Dependency Profiles

          | Dependency id | Dependency | Degraded default | Manual fallback |
          | --- | --- | --- | --- |
          | `dep_nhs_login_rail` | NHS login authentication rail | Freeze the route in claim-pending or auth-read-only posture until writable authority is re-proven for the same subject and route intent. | Route to support-assisted recovery or a secure-link continuation path without widening identity truth. |

          ## Test Harnesses

          - `unit`: `services/api-gateway/tests/config.test.js`

- `integration`: `services/api-gateway/tests/runtime.integration.test.js`
- `integration`: `services/api-gateway/tests/gateway-surface-authority.integration.test.js`
