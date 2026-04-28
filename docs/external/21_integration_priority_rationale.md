            # 21 Integration Priority Rationale

            ## Scoring Model

            Two deterministic runs are serialized from the same family pack.

            ### Mock_now_execution weights

            `{"patient_safety_consequence": 6, "canonical_truth_effect": 6, "patient_visible_continuity": 5, "operator_truth_supportability": 5, "mockability_quality": 5, "live_acquisition_latency": 3, "approval_burden": 3, "security_privacy_burden": 2, "coupling_risk_if_delayed": 5, "readiness_value_unlocked": 6, "proof_rigor_demand": 6, "live_pressure_from_mock_limit": 1, "baseline_role_bonus": 1}`

            ### Actual_provider_strategy_later weights

            `{"patient_safety_consequence": 5, "canonical_truth_effect": 5, "patient_visible_continuity": 4, "operator_truth_supportability": 4, "mockability_quality": 1, "live_acquisition_latency": 6, "approval_burden": 6, "security_privacy_burden": 4, "coupling_risk_if_delayed": 5, "readiness_value_unlocked": 5, "proof_rigor_demand": 5, "live_pressure_from_mock_limit": 4, "baseline_role_bonus": 1}`

            ### Baseline role bonus

            `{"baseline_required": 5, "baseline_mock_required": 4, "optional_flagged": 2, "deferred_channel": 0, "future_optional": 0, "prohibited": -2}`

            ## Rules Enforced

            - Deferred Phase 7 NHS App work remains deferred and is not treated as a current-baseline blocker.
            - PDS remains optional and ranks below the core NHS login rail.
            - IM1 pairing is baseline-relevant for later booking reach but explicitly stays out of the Phase 2 identity critical path.
            - Notification rails are ranked below authoritative booking, hub, and pharmacy proof-bearing families.
            - Weak transport or mailbox acceptance is never treated as sufficient business truth.
            - Mock approval requires preservation of proof, ambiguity, and degraded fallback semantics rather than a toy stub.
            - Family-based ranking prevents supplier-specific business logic from leaking into priority order.

            ## Source Precedence

            - `prompt/021.md`
- `prompt/shared_operating_contract_021_to_025.md`
- `blueprint/phase-0-the-foundation-protocol.md`
- `blueprint/phase-2-identity-and-echoes.md`
- `blueprint/phase-4-the-booking-engine.md`
- `blueprint/phase-5-the-network-horizon.md`
- `blueprint/phase-6-the-pharmacy-loop.md`
- `blueprint/phase-7-inside-the-nhs-app.md`
- `blueprint/platform-runtime-and-release-blueprint.md`
- `blueprint/phase-cards.md`
- `blueprint/forensic-audit-findings.md`
- `blueprint/blueprint-init.md`
- `data/analysis/external_dependencies.json`
- `data/analysis/dependency_watchlist.json`
- `data/analysis/master_risk_register.json`
- `data/analysis/phase0_gate_verdict.json`

            ## Downstream Consequences

            - `seq_022` and `seq_023` now have one family model to score and secure against.
            - `seq_024` to `seq_030` can follow the live-later queue without re-litigating current-baseline necessity.
            - `seq_031` to `seq_035` can target vendor families in a way that does not outrank authoritative booking or pharmacy truth.
            - `seq_036` to `seq_040` now inherit one explicit simulator backlog, checkpoint register, and degraded-default contract.
