# 13 Backend Runtime Service Baseline

        Vecells should run as a small number of deployable executables with strong bounded-context modules, not as dozens of microservices and not as one mixed monolith. That is the simplest posture that still preserves workload-family boundaries, replay-safe external effects, and later scaling.

        ## Decision

        Chosen baseline: `OPT_SMALL_EXECUTABLES_STRONG_MODULES`.

        The runtime stays split into:
        - route-scoped gateway ingress
        - authoritative command orchestration
        - projection rebuild/materialization
        - notification/callback dispatch
        - integration/adapter dispatch plus receipt ingest
        - assurance/replay guard
        - timer orchestration
        - simulator backplane

        ## Scorecard

        | Option | Boundary | Replay | Scaling | Determinism | Complexity | Decision |
| --- | --- | --- | --- | --- | --- | --- |
| Deploy-many microservices by bounded context | 5 | 4 | 5 | 2 | 1 | rejected |
| Small number of executables with strong bounded-context modules | 5 | 5 | 4 | 5 | 4 | chosen |
| Modular monolith for domains plus workers for projection and integration | 3 | 4 | 2 | 5 | 5 | rejected |

        ## Runtime Executables

        | Runtime Component | Kind | Workload Family | Primary Truth Role | Key Endpoint Coverage |
| --- | --- | --- | --- | --- |
| API gateway and route-scoped BFF ingress | service | wf_public_edge | Published route and scope boundary only; never domain truth. | triage_more_info_cycle; self_care; admin_resolution; clinician_messaging... |
| Command API and authoritative mutation orchestrator | service | wf_command | Only writer of canonical aggregates, settlements, blockers, and closure gates. | urgent_diversion; degraded_acceptance_fallback_review; triage_more_info_cycle; duplicate_review... |
| Projection worker and rebuild engine | worker | wf_projection | Derived audience-safe read truth only; never canonical write authority. | urgent_diversion; degraded_acceptance_fallback_review; triage_more_info_cycle; duplicate_review... |
| Notification, callback, and controlled resend worker | worker | wf_integration | External-effect orchestrator only; outcome truth upgrades through evidence bundles and resolution gates. | urgent_diversion; triage_more_info_cycle; self_care; admin_resolution... |
| External adapter and receipt ingestion worker | worker | wf_integration | Adapter plane only; authoritative case truth still upgrades through command settlements and confirmation gates. | local_booking; local_waitlist_continuation; network_hub_coordination; pharmacy_first_referral_loop... |
| Assurance, audit, and replay guard worker | worker | wf_assurance_security | Tamper-evident evidence and restore gate publisher; not a clinical write owner. | degraded_acceptance_fallback_review; duplicate_review; network_hub_coordination; pharmacy_first_referral_loop... |
| Timer and workflow orchestrator | timer_engine | wf_command | Owns deadline checkpoints and wakeups; timers may not hide inside request handlers, browsers, or ad hoc workers. | triage_more_info_cycle; clinician_messaging; callback; local_booking... |
| Local simulator and adapter backplane | worker | wf_integration | Non-authoritative local and CI simulation only. | triage_more_info_cycle; clinician_messaging; callback; local_booking... |

        ## Baseline Law

        - `svc_command_api` is the only writer of canonical aggregates, blockers, and settlements.
        - `svc_projection_worker` is projection-first and rebuild-first; it never upgrades canonical truth.
        - `svc_notification_worker` and `svc_integration_worker` dispatch effects only from durable queues and only upgrade truth through receipts, evidence bundles, confirmation gates, and settlements.
        - `svc_timer_orchestrator` owns all long-running waits that can change user-visible posture.
        - `svc_assurance_worker` owns quarantine, replay-collision review, restore gating, and immutable audit witness publication.
        - `svc_adapter_simulators` exists for local and CI determinism only and is explicitly non-authoritative.

        ## Rejection Notes

        - Deploy-many microservices were rejected because the corpus needs stronger contract and replay discipline before it needs bounded-context-per-deployment autonomy.
        - A modular monolith plus workers was rejected because it would blur the command, projection, integration, and assurance planes already fixed by the runtime topology baseline.
