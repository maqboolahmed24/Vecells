# 14 Design System And Contract Publication Strategy

        Design, accessibility, automation, and runtime publication stay in one bundle. Tokens and markers are not sidecars.

        ## Publication Matrix

        | Bundle member | Source | Generated | Marker | Failure posture |
| --- | --- | --- | --- | --- |
| DesignTokenExportArtifact | pkg_design_contracts | pkg_gen_design_contract_bindings | data-design-contract-digest | summary_first_read_only |
| ProfileSelectionResolution | pkg_design_contracts | pkg_gen_design_contract_bindings | data-layout-topology | route_falls_to_mission_stack_or_read_only |
| SurfaceStateSemanticsProfile | pkg_design_contracts | pkg_gen_design_contract_bindings | data-surface-state | surface_downgrades_out_of_calm_mode |
| AccessibilitySemanticCoverageProfile | pkg_accessibility_contracts | pkg_gen_design_contract_bindings | data-accessibility-coverage-state | table_first_or_placeholder |
| AutomationAnchorMap | pkg_design_contracts | pkg_gen_design_contract_bindings | data-shell-type | route_not_publishable_live |
| TelemetryBindingProfile | pkg_design_contracts | pkg_gen_design_contract_bindings | data-live-announce-state | telemetry_blocked_and_surface_downgraded |
| FrontendContractManifest | pkg_api_contracts | pkg_gen_api_clients | data-route-family | route_reads_governed_summary_only |
| AudienceSurfaceRuntimeBinding | pkg_api_contracts | pkg_gen_api_clients | data-writable-state | recovery_only_or_blocked |

        ## Bundle Law

        - `DesignTokenExportArtifact`, `ProfileSelectionResolution`, `SurfaceStateSemanticsProfile`, `AccessibilitySemanticCoverageProfile`, `AutomationAnchorMap`, `TelemetryBindingProfile`, `FrontendContractManifest`, and `AudienceSurfaceRuntimeBinding` publish as one coordinated runtime truth.
        - A route may not remain calmly writable if the design bundle digest, lint verdict, accessibility coverage state, or runtime binding drift.
        - Generated design-contract bindings become the browser-facing source for token, marker, and semantic state vocabulary. Component-local CSS or test-only selectors are invalid substitutes.
        - The showcase intentionally renders the active design-contract digest in the DOM to close Finding 118 at the shell level.
