# 88 Cache And Live Transport Design

        `par_088` provisions the shared cache and live-update runtime substrate that later route-family policy work can bind to without improvising continuity plumbing.

        ## Frozen Outcome

        - cache namespace classes: 5
        - cache namespaces: 21
        - policy bindings: 21
        - live channels: 15
        - connection registries: 8
        - replay buffers: 15
        - boundary rows: 95

        ## Namespace Classes

        | Class | Label | Namespaces | TTL Seconds |
        | --- | --- | ---: | ---: |
        | `runtime_manifest` | Runtime manifest | 3 | 120 |
| `projection_read` | Projection read | 2 | 90 |
| `route_family` | Route family | 4 | 60 |
| `entity_scoped` | Entity scoped | 9 | 45 |
| `transient_replay_support` | Transient replay support | 3 | 30 |

        ## Runtime Law

        - Caches are continuity helpers only; they do not become hidden freshness or mutation authority.
        - Live transport stays behind gateway-safe boundaries; browsers never subscribe to internal buses directly.
        - Heartbeat, reconnect, and replay hooks are reusable infrastructure seams, not route-local improvisation.
        - Reconnect can restore continuity, but it still leaves truth freshness unproven until later route-family policy binds a rebound rule.
        - `FOLLOW_ON_DEPENDENCY_096_ROUTE_FAMILY_CACHE_AND_LIVE_POLICY_BINDING` remains open by design.

        ## Topology Highlights

        - SSE fan-out backs 13 live channels.
        - WebSocket fan-out backs 2 live channels.
        - The substrate covers 4 route families with intentionally absent live contracts without inferring missing policy.
