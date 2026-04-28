# 376 Phase 7 Embedded Accessibility Contracts

## Accessibility Contract Family

Every embedded patient route must publish one accessibility coverage package containing:

- `AccessibleContentVariant`
- `AuditEvidenceReference`
- `UIStateContract`
- `AccessibilitySemanticCoverageProfile`
- `VisualizationFallbackContract`
- `VisualizationTableContract`

The coverage package is release-blocking for limited release. A route cannot claim `coverageState = complete` while manual assistive testing, screen-reader checks, device-lab checks, or unresolved WCAG 2.2 AA findings remain open.

## UI State Coverage

Each embedded journey must declare:

- loading state
- empty state
- warning state
- success state
- error state

Each state must include semantic role, focus target, announcement policy, primary action, recovery action, and automation anchor.

## Interaction Coverage

Each embedded route must bind:

- `KeyboardInteractionContract`
- `FocusTransitionContract`
- `AssistiveAnnouncementContract`
- `TimeoutRecoveryContract`
- `FreshnessAccessibilityContract`
- `AutomationAnchorProfile`
- `SurfaceStateSemanticsProfile`
- `DesignContractPublicationBundle`

Host resize, safe-area changes, capability downgrade, reduced motion, reconnect buffering, and route freeze are blocked modes unless the profile still evaluates to `complete`.

## Visualization Coverage

Charts, timelines, graphs, and status heat views must publish:

- explicit units
- non-colour cues
- table fallback
- summary fallback
- stale-data state
- keyboard route through the table representation

The webview may not be a chart-only surface. Bridge, freshness, or parity drift must degrade to table-first, summary-only, or placeholder posture.

## Evidence Posture

Accepted evidence classes are:

- automated accessibility checks
- manual keyboard and focus checks
- screen-reader checks
- manual assistive technology testing
- physical device-lab testing
- content review
- user research evidence

Automated checks support the gate, but they do not replace manual and assistive proof.
