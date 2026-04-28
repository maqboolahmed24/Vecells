# Embedded Design Convergence Spec

Task: `par_395`

Visual mode: `NHSApp_Embedded_Converged_Design_Bundle`

## Purpose

This task publishes one design, copy, semantic, automation, and visualization-fallback bundle for the Phase 7 embedded NHS App patient route families. The implementation is intentionally a shared publication layer, not another route workflow: existing entry, intake, request, booking, pharmacy, recovery, and shell routes keep their business ownership while inheriting one convergence contract.

The route wiring lives in [App.tsx](/Users/test/Code/V/apps/patient-web/src/App.tsx). The bundle source lives in [embedded-design-convergence.tsx](/Users/test/Code/V/apps/patient-web/src/embedded-design-convergence.tsx).

## Published Components

- `EmbeddedDesignBundleProvider` wraps each embedded route and publishes the design contract.
- `EmbeddedStateCopyRegistry` normalizes state labels, recovery labels, CTA verbs, and copy tone.
- `EmbeddedAutomationAnchorRegistry` keeps route root and action anchors aligned with automation and telemetry.
- `EmbeddedSemanticGrammarRegistry` publishes the route archetype and semantic label.
- `EmbeddedIconographyRuleset` keeps status text primary and decorative icons out of the embedded language.
- `EmbeddedVisualizationFallbackAdapter` binds each retained visual summary to a fallback contract.
- `EmbeddedVisualizationTableSurface` publishes table parity for progress rails, timelines, strips, and status summaries.
- `EmbeddedVisualizationParityBanner` provides the summary-first parity statement for each visual surface.
- `EmbeddedBundleAuditPanel` exposes the publication bundle, contract, and archetype for validators.
- `EmbeddedDesignConvergenceLinter` checks route root, action anchor, fallback table, and visual mode at runtime.
- `EmbeddedMicrocopyNormalizer` publishes plain-English single-action grammar for the route.

## Route Archetypes

- `entry_corridor`: entry/recovery card archetype
- `start_request`: form-and-review archetype
- `request_status`: timeline/status archetype
- `booking`: visualization-with-fallback archetype
- `pharmacy`: list-first choice archetype
- `recovery_artifact`: entry/recovery card archetype
- `embedded_shell`: summary-and-action archetype

## Token Convergence

The wrapper exposes one token family and maps existing route-local CSS variables to it:

- canvas `#F6F8FB`
- panel `#FFFFFF`
- panel-soft `#F3F7FB`
- stroke `#D9E2EC`
- text-strong `#0F172A`
- text `#334155`
- text-muted `#64748B`
- accent `#2457FF`
- success `#146C43`
- warning `#A16207`
- error `#B42318`

The bundle preserves existing route layouts while converging card radius, chip radius, body text baseline, divider color, motion timings, and status grammar.

## Visualization Fallback Law

Every visual surface retained in the embedded family has a summary-first contract and a table fallback:

- sign-in progress rail
- start request progress stepper
- request status timeline
- booking slot comparison strip
- pharmacy referral status strip
- artifact summary and download progress
- shell semantic strip

The fallback tables are screen-reader available and machine-readable through `data-testid="EmbeddedVisualizationTableSurface"`.

## Source Alignment

- NHS App web integration requires embedded services to hide route headers where native app chrome supersedes them and documents site links and webview limits: [NHS App web integration guidance](https://nhsconnect.github.io/nhsapp-developer-documentation/web-integration-guidance/).
- NHS App JS API v2 defines host-owned navigation and storage functions that embedded routes should not visually fork: [NHS App JS API v2](https://nhsconnect.github.io/nhsapp-developer-documentation/js-v2-api-specification/).
- NHS accessibility content guidance emphasizes meaningful headings, control names, labels, and error summaries: [NHS accessibility content](https://service-manual.nhs.uk/accessibility/content).
- NHS content guidance supports plain English and predictable transaction copy: [NHS content guide](https://service-manual.nhs.uk/content).
- WAI-ARIA APG patterns guide route landmarks, tabs, and disclosure semantics: [main landmark](https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/examples/main.html), [tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/), and [disclosure](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/).
- Playwright ARIA snapshots, emulation, and visual comparisons provide the proof harness: [ARIA snapshots](https://playwright.dev/docs/aria-snapshots), [emulation](https://playwright.dev/docs/emulation), and [visual comparisons](https://playwright.dev/docs/test-snapshots).
- Carbon data table guidance supports compact table fallback dimensions and readable row typography: [Carbon data table style](https://carbondesignsystem.com/components/data-table/style/).
- Linear design writing supports reduced visual noise and stronger hierarchy without adding decorative chrome: [Linear UI redesign](https://linear.app/now/how-we-redesigned-the-linear-ui).

