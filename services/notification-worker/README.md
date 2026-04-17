# Notification Worker

        - Package: `@vecells/notification-worker`
        - Repo path: `services/notification-worker`
        - Owner: `Platform Integration` (`platform_integration`)
        - Workload family: `notification_dispatch_and_settlement`

        ## Purpose

        Own dispatch envelopes, provider adapter boundaries, settlement callbacks, controlled resend hooks, and secret-safe delivery seams without embedding live provider credentials.

        ## Truth Boundary

        Dispatch acceptance is not delivery truth. Provider callbacks, resend policy, and settlement evidence stay explicit and can fail closed.

        ## Port Contract

        - Service port env keys: `NOTIFICATION_WORKER_SERVICE_PORT`, compatibility fallback `NOTIFICATION_WORKER_PORT`
        - Admin port env key: `NOTIFICATION_WORKER_ADMIN_PORT`
        - Default ports: service `7103`, admin `7203`

        ## Route Catalog

        | Method | Path | Contract family | Purpose |
        | --- | --- | --- | --- |
        | `POST` | `/dispatch/envelopes` | `CanonicalEventContract` | Accept a placeholder dispatch envelope and expose provider/settlement seams. |

| `GET` | `/dispatch/settlement` | `DependencyDegradationProfile` | Expose delivery settlement ladder, resend controls, and safe provider boundary posture. |

        ## Topics Consumed

        - `notification.dispatch.requested`

- `notification.resend.requested`
- `notification.provider.callback`

        ## Topics Published

        - `notification.dispatch.accepted`

- `notification.delivery.settled`
- `notification.delivery.dead-lettered`

        ## Allowed Dependencies

        - `packages/domains/communications`

- `packages/domains/identity_access`
- `packages/domains/support`
- `packages/event-contracts`
- `packages/api-contracts`
- `packages/authz-policy`
- `packages/observability`
- `packages/release-controls`

        ## Forbidden Dependencies

        - `apps/*`

- `packages/design-system`
- `real provider credentials in source`

        ## Secret Boundaries

        - `NOTIFICATION_PROVIDER_SECRET_REF`

- `NOTIFICATION_WEBHOOK_SECRET_REF`
- `NOTIFICATION_SIGNING_KEY_REF`

          ## Environment Contract

          | Env key | Type | Default | Purpose |
          | --- | --- | --- | --- |
          | `NOTIFICATION_WORKER_DISPATCH_BATCH_SIZE` | `number` | `50` | Maximum number of envelopes staged in one placeholder dispatch batch. |

  | `NOTIFICATION_WORKER_PROVIDER_MODE` | `enum` | `simulator` | Controls whether provider adapters run in simulator, shadow, or hybrid posture. |
  | `NOTIFICATION_WORKER_CALLBACK_SETTLEMENT_WINDOW_SECONDS` | `number` | `300` | How long the worker waits before delivery becomes explicitly settlement-pending. |
  | `NOTIFICATION_WORKER_RESEND_GUARD_MODE` | `enum` | `manual_review` | Controls whether resend requires named review or a cooldown-only gate. |

          ## Degraded Dependency Profiles

          | Dependency id | Dependency | Degraded default | Manual fallback |
          | --- | --- | --- | --- |
          | `dep_sms_notification_provider` | SMS delivery provider | Withdraw seeded continuation trust and fall back to challenge-based continuation or another governed contact route when recipient or delivery truth is disputed. | Support reissue or bounded callback under the same grant lineage rather than silent re-send. |

  | `dep_email_notification_provider` | Email and notification delivery provider | Preserve a read-only, pending-delivery, or repair-needed posture until current delivery evidence or a governed fallback settles the route. | Use controlled resend, callback escalation, or support repair under the same authoritative communication chain. |

          ## Test Harnesses

          - `unit`: `services/notification-worker/tests/config.test.js`

- `integration`: `services/notification-worker/tests/runtime.integration.test.js`
