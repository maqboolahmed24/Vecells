# 418 Algorithm Alignment Notes

Task `par_418` implements the first staff-visible assistive rail as a same-shell companion surface.

Visual mode: `Assistive_Rail_Quiet_Copilot`.

## Alignment To Phase 8

- `AssistiveCapabilityTrustEnvelope` remains the authority for posture. The UI states are capped to `shadow_summary`, `observe_only`, `placeholder`, `loading`, and `hidden_ready`; no insert or commit control is exposed.
- Shadow output is explicitly non-authoritative. The rail copy says the clinical review canvas and final human action remain authoritative.
- Provenance is always present as a compact footer stub before later tasks add richer rationale layers.
- Degraded and stale scenarios downgrade in place to observe-only or placeholder states instead of hiding the surface or navigating away.

## Alignment To Staff Workspace

- The rail is rendered inside the existing Clinical Workspace route family for `task`, `more-info`, and `decision` routes.
- It is an adjacent `aside[role=complementary]`, not a floating chat panel, full-screen drawer, or overlay.
- Collapse preserves a stable 56px host so layout rhythm remains predictable while the main review canvas remains available.
- The rail consumes the current `selectedAnchorRef`, task ref, route kind, and runtime scenario from the real shell controller.

## Alignment To Frontend Kernel

- `data-visual-mode="Assistive_Rail_Quiet_Copilot"` identifies the mode for automation and visual review.
- Stable automation anchors are provided for shell, header, collapse toggle, summary card, posture chip, mode panel, body, content well, and provenance footer.
- The CSS uses a restrained rail palette mapped to surface, border, body, muted, capability, shadow, observe-only, freeze, and provenance roles.
- Reduced motion removes the rail, card, chip, and footer transitions while preserving the same state sequence.

## Explicit Non-Goals Preserved

- No diffable note draft cards or bounded insert bars. Those mount into the content well in task `419`.
- No deep confidence rationale or model provenance disclosure. Those mount after the footer in task `420`.
- No override capture or edited-by-clinician trail. Those are owned by task `421`.
- No rich frozen, quarantined, stale-recovery, or blocked posture stage. Those are owned by tasks `422` and `423`.
