# Frontxoxo UI/UX Agent Scope Map

## Stage 1 - Agent Workflow Files
- FX-S1-001: Read /Users/test/Code/V/frontxoxo/AGENT.md before claiming UI/UX work.
- FX-S1-002: Use /Users/test/Code/V/frontxoxo/checklist.md as the only live task board.
- FX-S1-003: Claim exactly one numbered task ID per agent turn.
- FX-S1-004: Do not claim a whole markdown file, platform, or folder.
- FX-S1-005: Use /Users/test/Code/V/frontxoxo/TASK_TEMPLATE.md when handing a task to another agent.
- FX-S1-006: Regenerate the task board with `node frontxoxo/tools/build-checklist.mjs` only when scope files change.

## Stage 2 - Scope File Semantics
- FX-S2-001: Stage 1 lines inside platform files are scope metadata and are not claimable tasks.
- FX-S2-002: Stage 2 lines inside platform files are claimable screen, phase, route, component state, or panel tasks.
- FX-S2-003: Stage 3 lines inside platform files are claimable UI/UX bug-check tasks.
- FX-S2-004: Each checklist line maps back to exactly one Stage 2 or Stage 3 line.
- FX-S2-005: Keep fixes scoped to the named source app and shared UI packages referenced by the area file.

## Stage 3 - Platform Folders
- FX-S3-001: Patient Web - patient-facing portal, intake, booking, pharmacy, embedded NHS app flows.
- FX-S3-002: Clinical Workspace - staff workspace, queues, task canvas, validation, bookings, support handoff.
- FX-S3-003: Support Workspace - persistent support shell and replay/observe flows.
- FX-S3-004: Hub Desk - coordination queue, case, alternatives, exceptions, audit, commit confirmation.
- FX-S3-005: Pharmacy Console - pharmacy lane, case workbench, validation, inventory, handoff, assurance.
- FX-S3-006: Ops Console - operational boards, NHS App readiness, NHS App channel support/release/audit.
- FX-S3-007: Governance Console - governance, access, config, comms, release administration.
- FX-S3-008: Mock And Studio Apps - provider simulators, onboarding studios, labs, and operational test tools.
- FX-S3-009: Shared UI Packages - cross-platform shell, primitives, postures, design-system surfaces.

## Stage 4 - Universal UI/UX Checks
- FX-S4-001: Verify responsive layout at mobile, tablet, laptop, and wide desktop widths.
- FX-S4-002: Verify keyboard navigation, visible focus, focus restoration, and escape/return behavior.
- FX-S4-003: Verify ARIA labels, landmarks, live regions, modal/drawer semantics, and reduced-motion behavior.
- FX-S4-004: Verify loading, empty, error, degraded, read-only, frozen, and recovery states.
- FX-S4-005: Verify copy clarity, clinical/support safety wording, status truth labels, and action hierarchy.
- FX-S4-006: Verify tables, rails, cards, charts, and long labels do not overflow or overlap.
- FX-S4-007: Verify visual consistency with shared design tokens and component primitives.
