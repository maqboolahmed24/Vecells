# 418 Assistive Rail And Shadow Presentation Spec

## Purpose

The assistive rail is a quiet same-shell side-stage for staff-visible assistive awareness. It can show shadow summary, observe-only, loading, placeholder, collapsed, and hidden-ready states without implying final workflow truth.

## Production Surfaces

- `apps/clinical-workspace/src/assistive-rail.tsx`
- `apps/clinical-workspace/src/assistive-rail.css`
- `apps/clinical-workspace/src/staff-shell-seed.tsx`
- `apps/clinical-workspace/src/workspace-shell.tsx`

## Component Contract

The rail exports:

- `AssistiveRailShell`
- `AssistiveRailHeader`
- `AssistiveRailCollapseToggle`
- `AssistiveSummaryStubCard`
- `AssistiveShadowModePanel`
- `AssistiveObserveOnlyPlaceholder`
- `AssistiveCapabilityPostureChip`
- `AssistiveProvenanceFooterStub`
- `AssistiveRailKeyboardController`
- `AssistiveRailStateAdapter`

`AssistiveRailStateAdapter` maps the existing staff route, runtime scenario, selected anchor, task ref, and patient label into a conservative rail state. Query-string fixtures are supported for Playwright with `assistiveRail=shadow-summary|observe-only|loading|placeholder|hidden-ready` and `assistiveRailCollapsed=true`.

## Layout

The rail is rendered as an adjacent `aside[role=complementary]` on active task-family routes. It does not cover the primary task canvas.

Width targets:

- `>=1440px`: `416px`
- `1200px-1439px`: `384px`
- `1024px-1199px`: `344px`
- collapsed: `56px`
- below `1024px`: bounded same-shell side-stage, max `92vw`

## States

- `shadow_summary`: non-authoritative summary stub and shadow-mode explanation.
- `observe_only`: read-only explanation with suppressed write affordances.
- `loading`: stable reserved footprint while trust envelope checks resolve.
- `placeholder`: strongest safe reason for held-back assistive detail.
- `hidden_ready`: stable collapsed host ready to be opened.
- `collapsed`: header and toggle only, with screen-reader posture summary.

## Accessibility

- The rail is a labelled complementary landmark.
- Collapse uses a native button with `aria-expanded` and `aria-controls`.
- `Escape` collapses the rail when focus is inside it.
- `Alt+A` toggles the rail for dense keyboard workflows.
- Reduced motion removes transitions while preserving state meaning.

## Visual Rules

Visual mode is `Assistive_Rail_Quiet_Copilot`.

The rail uses white panels, grey inset evidence surfaces, small posture chips, blue capability accents, grey shadow accents, amber observe-only accents, red freeze accents, and teal provenance accents. Success-green semantics are not used for assistive confidence or shadow output.

## Verification

Run:

```sh
pnpm validate:418-assistive-rail
pnpm --filter @vecells/clinical-workspace typecheck
pnpm exec tsx tests/playwright/418_assistive_rail_shadow_and_observe_only.spec.ts --run
pnpm exec tsx tests/playwright/418_assistive_rail_keyboard_and_focus.spec.ts --run
pnpm exec tsx tests/playwright/418_assistive_rail_accessibility.spec.ts --run
pnpm exec tsx tests/playwright/418_assistive_rail_visual.spec.ts --run
```
