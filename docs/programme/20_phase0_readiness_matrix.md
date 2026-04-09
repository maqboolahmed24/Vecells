
            # Phase 0 Readiness Matrix

            ## Matrix

            | Criterion | Class | Status | Tasks | Note |
| --- | --- | --- | --- | --- |
| CRIT_SRC_001 | Source Truth | pass | seq_001, seq_002 | 1453 canonical requirements are registered across 32 blueprint sources, with 29 reconciliation rows and 90 canonical aliases. |
| CRIT_SCOPE_001 | Scope | pass | seq_003, seq_016, seq_017 | The current delivery baseline is Phases 0 to 6, Phase 8, and Phase 9, with Phase 7 retained as a deferred NHS App embedded-channel expansion. |
| CRIT_ARCH_001 | Architecture | pass | seq_004, seq_011, seq_014 | 13 personas, 8 channels, and 22 persona-surface rows keep shell ownership explicit. |
| CRIT_ARCH_002 | Architecture | pass | seq_005, seq_006, seq_007 | 14 lineage stages, 950 canonical objects, and 41 state machines are published. |
| CRIT_ARCH_003 | Architecture | pass | seq_005, seq_013, seq_016 | LifecycleCoordinator, RouteIntentBinding, CommandActionRecord, and CommandSettlementRecord remain first-class foundation contracts. |
| CRIT_ARCH_004 | Architecture | pass | seq_008, seq_013 | 20 async effect lanes preserve outbox, inbox, idempotency, and replay law at the integration boundary. |
| CRIT_ARCH_005 | Architecture | pass | seq_005, seq_007, seq_018 | State atlas still carries 82 conflict rows and the lineage model keeps 6 bounded gap rows explicit instead of hiding unhappy paths. |
| CRIT_DEP_002 | Dependency | blocked | seq_021, seq_022, seq_023, seq_024... | GATE_EXTERNAL_TO_FOUNDATION is still blocked; 17 current-baseline dependencies are still blocked or onboarding, including dep_nhs_login_rail, dep_im1_pairing_programme, and dep_cross_org_secure_messaging_mesh. |
| CRIT_DEP_001 | Dependency | pass | seq_008 | 20 dependencies, 60 assurance obligations, and 12 future browser-automation rows are published. |
| CRIT_ASSURANCE_001 | Assurance | pass | seq_009 | 13 workstreams, 24 scheduled evidence artifacts, and 11 seeded hazards are active. |
| CRIT_PRIV_001 | Privacy/Security | pass | seq_010, seq_015 | 29 field sensitivity rows, 11 audit disclosure rows, and 14 security controls define minimum-necessary posture. |
| CRIT_RUNTIME_001 | Runtime | pass | seq_011, seq_013, seq_014 | 49 workload rows, 21 runtime components, and 22 gateway surfaces are frozen. |
| CRIT_RUNTIME_002 | Runtime | pass | seq_011, seq_013, seq_015, seq_018 | 6 release gates keep publication parity, continuity, and recovery posture in one ladder. |
| CRIT_FE_001 | Frontend | pass | seq_004, seq_014 | React + TypeScript + Vite + typed client router remains chosen with 12 browser coverage rows and published route markers. |
| CRIT_FE_002 | Frontend | pass | seq_014, seq_015, seq_016 | 8 bundle members keep token export, markers, and lint verdicts inside runtime publication. |
| CRIT_TOOL_001 | Tooling | review_required | seq_015 | Tooling baseline is chosen, but the HSM-backed signing key remains an explicit provisioning seam carried forward from seq_015/seq_016. |
| CRIT_TOOL_002 | Tooling | review_required | seq_015, seq_018 | Alert families and on-call routes are published, but the final tenant and service-owner binding remains intentionally open. |
| CRIT_RISK_001 | Risk | pass | seq_017, seq_018 | 60 risks and 26 dependency watch rows keep 5 external-readiness blocking risks explicit. |
| CRIT_TRACE_001 | Traceability | pass | seq_019 | 1453 requirements are grounded across 489 tasks with 0 current-baseline gaps. |
| CRIT_CONF_001 | Conformance | pass | seq_002, seq_016 | Phase 0 seed row keeps 10 blocking conflicts and 5 required runtime publication tuples explicit. |
| CRIT_CONF_002 | Conformance | pass | seq_017 | 7 sub-phases and 38 merge gates already exist; seq_020 turns the entry verdict into an evidence-backed decision. |
