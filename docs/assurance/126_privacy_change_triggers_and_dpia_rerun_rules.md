        # 126 Privacy Change Triggers and DPIA Rerun Rules

        Task: `par_126`  
        Reviewed at: `2026-04-14`

        ## Mock_now_execution

        - Publish the rerun rules now so privacy-sensitive changes do not wait for live provider onboarding or assistive rollout before they become explicit.
        - Re-run the backlog when scope tuples, route bindings, replay envelopes, telemetry schemas, provider boundaries, or assistive capabilities change materially.

        ## Actual_production_strategy_later

        - Keep the same trigger IDs and add named governance events, approvers, and evidence references rather than replacing the trigger model.

        ## Trigger catalog

        | Trigger | When to rerun | Why it matters |
| --- | --- | --- |
| RTR_126_SPRINT_PRIVACY_DELTA | Sprint privacy delta review | Run when a current sprint changes one processing activity, disclosure surface, or control family. |
| RTR_126_RELEASE_OR_RUNTIME_TUPLE_CHANGE | Release or runtime tuple change | Run when route publication, runtime binding, gateway surface, or release parity changes can alter who sees what. |
| RTR_126_BREAK_GLASS_OR_INVESTIGATION_SCOPE_DELTA | Break-glass or investigation scope delta | Run when replay, export, legal hold, or break-glass scope rules change. |
| RTR_126_PROVIDER_OR_SUBPROCESSOR_CHANGE | Provider or sub-processor change | Run when live provider onboarding, external-adapter processor assignment, or transfer geography changes. |
| RTR_126_TELEMETRY_SCHEMA_OR_DEBUG_SCOPE_DELTA | Telemetry schema or debug scope delta | Run when event vocabulary, diagnostic output, browser-visible traces, or masking rules expand. |
| RTR_126_ASSISTIVE_OR_MODEL_DELTA | Assistive or model delta | Run when prompt context, provenance, shadow mode, draft insertion, or surfaced rationale changes. |
| RTR_126_IDENTITY_OR_SECURE_LINK_SCOPE_DELTA | Identity or secure-link scope delta | Run when secure links, local session ceilings, scope claims, or wrong-patient repair behavior change. |
