# 273 Phase 3 More-Info, Re-Safety, Endpoint, And Approval Suite

`seq_273` is the definitive Phase 3 decision-cycle assurance pass for:

- more-info checkpoint, reminder, supersession, and expiry law
- reply disposition and re-safety law
- `DecisionEpoch` and `EndpointDecisionBinding` fencing
- governed approval and urgent-escalation mutation law

This suite uses:

- service-level integration coverage in [273_phase3_decision_cycle_assurance.integration.test.js](/Users/test/Code/V/services/command-api/tests/273_phase3_decision_cycle_assurance.integration.test.js)
- browser-visible proof in:
  - [273_decision_cycle_multi_actor.spec.ts](/Users/test/Code/V/tests/playwright/273_decision_cycle_multi_actor.spec.ts)
  - [273_endpoint_and_approval.spec.ts](/Users/test/Code/V/tests/playwright/273_endpoint_and_approval.spec.ts)
  - [273_decision_cycle_visual_and_accessibility.spec.ts](/Users/test/Code/V/tests/playwright/273_decision_cycle_visual_and_accessibility.spec.ts)
- machine-readable expected outputs in [273_expected_dispositions_and_settlements.json](/Users/test/Code/V/data/test/273_expected_dispositions_and_settlements.json)
- machine-readable execution summary in [273_suite_results.json](/Users/test/Code/V/data/test/273_suite_results.json)
- explicit repository remediation tracking in [273_defect_log_and_remediation.json](/Users/test/Code/V/data/test/273_defect_log_and_remediation.json)

## Scope

The suite proves that the more-info loop is provably governed by the live checkpoint chain, that materially new evidence triggers canonical re-safety, that preview and submit stay bound to the current `DecisionEpoch` and `EndpointDecisionBinding`, and that stale approval or urgent-escalation state cannot be replayed into a false commit path.

This is the explicit `DecisionEpoch and EndpointDecisionBinding` fence proof for the Phase 3 decision cycle.

## Source Grounding

Primary algorithm sections:

1. `phase-3-the-human-checkpoint.md#3D. More-info loop, patient response threading, and re-safety`
2. `phase-3-the-human-checkpoint.md#3E. Endpoint decision engine and resolution model`
3. `phase-3-the-human-checkpoint.md#3F. Human approval checkpoint and urgent escalation path`
4. `phase-3-the-human-checkpoint.md#3H. Hardening, clinical beta, and formal exit gate`

Dependent validated task outputs:

- `236`
- `237`
- `238`
- `239`
- `258`
- `260`
- `261`
- `266`
- `268`
- `269`
- `271`

## Mandatory Families Covered

### A. More-Info Checkpoint And Reminder Families

- active checkpoint with deterministic reminder due posture
- reminder deduplication across worker replay
- late-review checkpoint behavior
- superseded cycle revoking older checkpoints, links, and reminders
- explicit expiry on the replacement cycle

### B. Patient Reply Disposition Families

- `accepted_in_window`
- `accepted_late_review`
- `superseded_duplicate`
- `expired_rejected`
- `blocked_repair`
- wrong-task / wrong-cycle mismatch prevention

### C. Delta And Re-Safety Families

- material symptom delta promoting `urgent_return`
- technical-only or bounded change staying on the intended rule set
- contradiction failing closed instead of silently clearing concern
- churn guard forcing `supervisor_review_required`

### D. Endpoint-Binding And Settlement Families

- endpoint required-field matrix
- preview pinned to the live binding
- stale invalidation turning preview into `recovery_only`
- approval-required submit blocked behind governed checkpoint truth

### E. Approval And Urgent-Escalation Families

- self-approval blocked
- wrong approver role blocked
- stale approval invalidation
- urgent escalation attempt replay collapse
- stale urgent attempt blocked once the bound epoch is superseded

### F. Same-Shell Recovery And History Families

- expired patient reply route stays in place with safe summary
- staff stale decision route keeps the shell visible while mutation freezes
- patient, reviewer, and approver context survives refresh and back/forward

### G. Accessibility And Browser Resilience Families

- keyboard-driven patient reply progression
- keyboard-driven reviewer route transition into the decision stage
- keyboard-driven approver and escalation selection
- reduced-motion proof on the assurance lab
- aria snapshot evidence for patient reply, endpoint authority, and approval stage

## Repository-Owned Remediation

The suite exposed one repository-owned defect and the repository now fixes it:

- `DCA273_DEF_001`: approval checkpoints were not invalidated when the bound `DecisionEpoch` was superseded through endpoint invalidation.

Remediation landed in [phase3-approval-escalation.ts](/Users/test/Code/V/services/command-api/src/phase3-approval-escalation.ts) by wrapping endpoint invalidation so the linked checkpoint is explicitly superseded and its lease is released against the same supersession record.

## Execution Commands

Primary commands:

```bash
pnpm --dir /Users/test/Code/V/services/command-api exec vitest run tests/273_phase3_decision_cycle_assurance.integration.test.js
pnpm exec tsx /Users/test/Code/V/tests/playwright/273_decision_cycle_multi_actor.spec.ts --run
pnpm exec tsx /Users/test/Code/V/tests/playwright/273_endpoint_and_approval.spec.ts --run
pnpm exec tsx /Users/test/Code/V/tests/playwright/273_decision_cycle_visual_and_accessibility.spec.ts --run
python3 /Users/test/Code/V/tools/test/validate_273_phase3_decision_cycle_suite.py
pnpm --dir /Users/test/Code/V validate:273-phase3-decision-cycle-suite
```

Guard regressions:

```bash
python3 /Users/test/Code/V/tools/analysis/validate_236_more_info_kernel.py
python3 /Users/test/Code/V/tools/analysis/validate_237_response_resafety_pipeline.py
python3 /Users/test/Code/V/tools/analysis/validate_238_endpoint_decision_engine.py
python3 /Users/test/Code/V/tools/analysis/validate_239_approval_and_urgent_escalation.py
```

## Visual Proof

The static assurance surface is [Decision_Cycle_Assurance_Lab](/Users/test/Code/V/docs/frontend/273_decision_cycle_assurance_lab.html).

It publishes the required regions:

1. `ScenarioFamilyRail`
2. `PatientReplyWindowBoard`
3. `DeltaAndResafetyInspector`
4. `EndpointAuthorityRail`
5. `ApprovalAndEscalationLedger`
6. `DefectAndRemediationPanel`

The lab is not a generic test runner. It is a premium decision-cycle review board showing the authority chain, reply window, re-safety ladder, approval fence, escalation state, and the concrete repository fix that closed the only repo-owned failure.
