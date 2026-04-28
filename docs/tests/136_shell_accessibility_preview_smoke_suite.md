# 136 Shell Accessibility, Preview, and Smoke Suite

        `seq_136` creates one authoritative Phase 0 shell-proof harness that binds the patient, staff, operations, hub, governance, and pharmacy seed shells to the current preview, publication, accessibility, and continuity ceiling.

        Current suite verdict: `release_withheld`

        Summary:
        - shell families covered: `6`
        - preview shell cases: `87`
        - accessibility cases: `87`
        - failing shells: `6`
        - smoke pass count: `0`
        - smoke withheld count: `87`
        - mission-stack-covered cases: `87`
        - embedded-compatible cases: `1`

        Why the suite is withheld:
        - The current audience-surface runtime bindings from `seq_130` still publish no `publishable_live` rows for the seeded shells.
        - Preview smoke is governed by tuple truth, so pages that load in simulator-backed preview but only carry `partial`, `recovery_only`, or `blocked` bindings remain withheld.
        - The suite still proves same-shell continuity, mission-stack folding, embedded-compatible posture, reduced-motion coherence, and table parity, but it does not rewrite the release ceiling.

        ## Shell Verdict Matrix

        | Shell | Preview environment | Smoke verdict | Accessibility | Compact topology | Failure classes |
| --- | --- | --- | --- | --- | --- |
| Patient Web | pev_branch_patient_care (ready) | withheld | guarded | mission_stack | publication_tuple_failure |
| Clinical Workspace | pev_branch_clinical_hub (ready) | withheld | guarded | mission_stack | publication_tuple_failure |
| Ops Console | pev_branch_ops_control (expiring) | withheld | guarded | mission_stack | publication_tuple_failure |
| Hub Desk | pev_branch_clinical_hub (ready) | withheld | guarded | mission_stack | publication_tuple_failure |
| Governance Console | pev_rc_governance_audit (expired) | withheld | guarded | mission_stack | publication_tuple_failure |
| Pharmacy Console | pev_rc_pharmacy_dispatch (drifted) | withheld | guarded | mission_stack | publication_tuple_failure |

        ## Failure Classification Law

        | Failure class | Summary |
| --- | --- |
| landmark_failure | Shell landmarks or heading hierarchy fail whole-surface accessibility proof. |
| focus_order_failure | Keyboard traversal or focus restore breaks selected-anchor or same-shell law. |
| continuity_failure | Same-shell continuity, selected-anchor preservation, or recovery-in-place truth breaks. |
| publication_tuple_failure | Preview/runtime/publication/accessibility tuple is not exact, so smoke proof is withheld. |
| responsive_fold_failure | Compact or reflow posture forks the IA or breaks the same shell. |
| reduced_motion_failure | Reduced-motion posture changes semantic outcome instead of only changing animation. |
| diagram_parity_failure | Visual proof carries meaning that is not repeated in adjacent tables or textual parity. |

        ## Proof Inputs

        - `data/analysis/persistent_shell_contracts.json`
        - `data/analysis/preview_environment_manifest.json`
        - `data/analysis/accessibility_semantic_coverage_profiles.json`
        - `data/analysis/frontend_accessibility_and_automation_profiles.json`
        - `data/analysis/audience_surface_runtime_bindings.json`
        - `tests/playwright/patient-shell-seed-routes.spec.js`
        - `tests/playwright/staff-shell-seed-routes.spec.js`
        - `tests/playwright/operations-shell-seed-routes.spec.js`
        - `tests/playwright/hub-shell-seed-routes.spec.js`
        - `tests/playwright/governance-shell-seed-routes.spec.js`
        - `tests/playwright/pharmacy-shell-seed-routes.spec.js`
        - `tests/playwright/accessibility-semantic-coverage.spec.js`
        - `tests/playwright/preview-environment-control-room.spec.js`
        - `tests/playwright/136_shell_accessibility_preview_smoke.spec.js`
