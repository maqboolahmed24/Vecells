# 347 Rule Pack Governance And Promotion

`347` freezes the governance law for Pharmacy First pathway changes.

## Promotion guardrails

- A promoted `PharmacyRulePack` is immutable.
- Every change produces a new pack identity, effective window, compile hash, and predecessor/supersession chain.
- Promotion is blocked when:
  - validation errors exist
  - compile fails
  - golden-case regression fails
  - overlapping windows exist without `machine_resolved_supersede_previous`

## What reviewers must check

1. The pack still contains exactly the seven first-production named pathways:
   - uncomplicated UTI for women aged 16 to 64
   - impetigo age 1+
   - infected insect bites age 1+
   - acute sore throat age 5+
   - acute sinusitis age 12+
   - shingles age 18+
   - acute otitis media age 1 to 17
2. Threshold families remain complete:
   - `alpha_required_symptom_weight`
   - `eta_excl`
   - `eta_global`
   - `eta_contra`
   - `tau_global_block`
   - `tau_path_block`
   - `tau_contra_block`
   - `tau_req_pass`
   - `tau_min_complete`
   - `tau_eligible`
   - `xi_minor_feature_weight`
   - `tau_minor_eligible`
3. Fallback still requires:
   - no eligible clinical pathway
   - no global block
   - pathway-specific failures only
4. Every timing guardrail still binds to the same pack version and pathway.
5. Every patient/staff explanation ref still resolves to text in the pack.

## Safe rollout policy

- Validation and compile are code-first in this task; there is no policy-admin UI yet.
- Promotion evidence is the compiled artifact plus the `compileHash`.
- Golden cases are the minimum regression barrier for every pack promotion.
- Historical replay and pack comparison are mandatory before broadening eligibility thresholds or fallback behaviour.

## Hard prohibitions

- No in-place edits to a promoted pack.
- No code-default thresholds outside the selected pack.
- No fallback rule that can bypass a `tau_global_block` condition.
- No pathway selection rule that skips the precedence/confidence/tie-break law.
- No patient explanation generated from facts different from the stored staff explanation.

## Minor-illness fallback policy

- Fallback is a governed service lane, not a silent catch-all.
- Negative-polarity minor-illness features remain penalties in the score model.
- If fallback fails threshold, the engine must return a non-pharmacy route with an explicit unsafe-fallback reason code.

## Clinical-safety posture

- Pack promotion retains `hazardTraceabilityRefs` and `promotionReason`.
- The pack lifecycle is designed to support DCB0129/DCB0160 change control, auditability, and retrospective replay.
- Later provider-choice, dispatch, and bounce-back tracks must consume the stored evaluation outputs and not reinterpret eligibility from raw evidence.
