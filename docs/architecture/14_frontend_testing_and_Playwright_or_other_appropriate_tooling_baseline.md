# 14 Frontend Testing And Playwright Or Other Appropriate Tooling Baseline

        Playwright is part of the architecture baseline, not just the testing backlog. The browser contract is not publishable until the shell markers, reduced-motion behavior, route morphing, and visualization parity all prove out in automation.

        ## Coverage Matrix

        | Coverage id | Scenario | Shell | Viewport | Markers |
| --- | --- | --- | --- | --- |
| PW_PATIENT_320 | patient shell loads and keeps focus_frame or mission_stack law at 320px | patient | 320x900 | data-shell-type; data-breakpoint-class; data-layout-topology; status-strip |
| PW_PATIENT_KEYBOARD | patient shell keyboard-only navigation | patient | 1024x960 | selected-anchor; decision-dock; data-keyboard-model |
| PW_PATIENT_ROUTE_MORPH | patient same-shell route morph preserves selected anchor | patient | 1440x1000 | data-anchor-state; data-design-contract-digest; selection-state |
| PW_WORKSPACE_768 | workspace shell mission_stack fold at tablet width | workspace | 768x960 | data-layout-topology; selected-anchor; shell-preview |
| PW_WORKSPACE_KEYBOARD | workspace keyboard flow from queue into task plane | workspace | 1024x960 | data-shell-type; route-switcher; decision-dock |
| PW_WORKSPACE_ROUTE_MORPH | workspace child-state transition stays in the same shell | workspace | 1440x1000 | selection-state; data-anchor-state; decision-dock |
| PW_OPERATIONS_1440 | operations board renders NorthStarBand, BottleneckRadar, ServiceHealthGrid, and InterventionWorkbench | operations | 1440x1000 | data-ops-prominence-state; data-ops-promoted-surface; decision-dock |
| PW_OPERATIONS_PARITY | operations visualization parity stays exact | operations | 1024x960 | data-visualization-parity-state; data-visualization-selection; data-visualization-authority |
| PW_GOVERNANCE_1024 | governance shell keeps ScopeRibbon and status strip as the only sticky header stack | governance | 1024x960 | data-shell-type; status-strip; selected-anchor |
| PW_GOVERNANCE_ROUTE_MORPH | governance review keeps change anchor and release tuple through route morph | governance | 1440x1000 | data-anchor-state; data-design-contract-digest; selection-state |
| PW_REDUCED_MOTION | reduced motion mode preserves meaning without spatial travel | all | 1024x960 | data-motion-profile; data-motion-suppressed; data-live-announce-state |
| PW_A11Y_SMOKE | accessibility smoke across four shell demos | patient,workspace,operations,governance | 320x900, 768x960, 1024x960, 1440x1000 | data-accessibility-coverage-state; data-semantic-surface; data-focus-transition-scope |

        ## Workflow Law

        1. Generate route, design, and accessibility contracts first.
        2. Render shell demos against the generated bundle and gateway rows.
        3. Assert deterministic DOM truth for shell type, route family, writability, selected anchor, design-contract digest, and accessibility coverage.
        4. Validate same-shell route morphing before any feature is considered complete.
        5. Keep operations visualization parity and governance scope continuity under automation from day one.
