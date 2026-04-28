# 386 NHS App Readiness Cockpit Spec

## Surface

`NHSAppReadinessCockpit` is an internal release-control surface for `/ops/release/nhs-app`,
`/ops/release/nhs-app/routes`, `/ops/release/nhs-app/routes/:journeyPathId`, and
`/ops/release/nhs-app/preview`.

The cockpit uses the Phase 7 manifest tuple from tracks 377-385:

- `manifestVersionRef`: `nhsapp-manifest-v0.1.0-freeze-374`
- `releaseApprovalFreezeRef`: `ReleaseApprovalFreeze:RAF-P7-374-CONTRACT-FREEZE`
- `compatibilityEvidenceRef`: `CompatibilityEvidence:phase7-bridge-floor-freeze-374`
- `minimumBridgeRef`: `MinimumBridgeCapabilities:phase7-embedded-floor-375-pending`

## Components

- `NHSAppReadinessCockpit`: persistent shell wrapper, URL state, routing, and page landmarks.
- `NHSAppEnvironmentTupleRibbon`: environment, cohort, manifest, freeze, and route counts.
- `NHSAppTopologyStrip`: selected route graph from NHS App placement to route readiness evidence.
- `NHSAppRouteInventoryTable`: dense route inventory with filters and row selection.
- `NHSAppRouteInspector`: evidence, compatibility, and continuity tabs for the selected route.
- `NHSAppEmbeddedPreviewPanel`: hidden supplier chrome, safe-area, bridge, freeze, and artifact preview.
- `NHSAppPreviewCapabilityPanel`: bridge availability and safe-area constraints.
- `NHSAppRouteFreezeBadgeGroup`: live freeze and degradation posture badges.
- `NHSAppEvidenceDrawer`: evidence refs bound to the selected route and release tuple.

## URL State

The following state is URL-serializable and restored on load:

- `env`
- `readiness`
- `audience`
- `family`
- `freeze`
- `preview`
- `tab`
- `evidence=open`
- selected route from `/routes/:journeyPathId`

## Automation Hooks

Stable hooks are present for:

- `data-testid="NHSAppReadinessCockpit"`
- `data-visual-mode="NHSApp_Readiness_Cockpit"`
- `data-current-environment-tuple`
- `data-current-preview-mode`
- `data-current-readiness-verdict`
- `data-current-evidence-drawer-state`
- `data-testid="RouteRow-{journeyPathId}"`
- `data-testid="NHSAppEmbeddedPreviewPanel"`
- `data-testid="NHSAppEvidenceDrawer"`

## Interaction Contract

Operators can filter by environment, readiness, audience, route family, freeze mode, and degradation mode.
Route selection updates the inspector and URL. Preview mode selection moves to `/preview` and changes safe-area,
device, motion, and freeze rendering while keeping the selected route stable.

## Visual Mode

Visual mode name: `NHSApp_Readiness_Cockpit`.

The desktop layout is a three-region release workspace:

- left rail: 19-21rem
- center: minmax(48rem, 1fr)
- right: 24-30rem
- page padding: 20px
- gaps: 16px

Below 1280px the inspector and preview dock below the table. Below 1040px the filter rail stacks above the table.
