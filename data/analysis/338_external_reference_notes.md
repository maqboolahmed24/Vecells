# 338 External Reference Notes

Accessed on 2026-04-23. These references informed browser-proof technique, accessibility assertions, and realistic non-production environment posture. The local repository blueprints and validated outputs from `316`, `318`, `319`, `332`, `333`, and `336` remained the source of truth whenever an external pattern was broader than the local algorithm.

## Official references adopted

### Playwright

- [Isolation | Playwright](https://playwright.dev/docs/browser-contexts)
  - Borrowed: multiple `BrowserContext` use inside one scenario to prove browser isolation directly for acting-context switching.
  - Applied in 338: `338_org_boundary_and_scope_switcher.spec.ts` uses two isolated contexts so one organisation switch cannot silently mutate another session.
- [Best Practices | Playwright](https://playwright.dev/docs/best-practices)
  - Borrowed: test user-visible behavior instead of implementation details, and keep tests isolated.
  - Applied in 338: browser suites assert shell-root attributes, queue row text, and candidate-state markers that are part of the visible operational contract.
- [Emulation | Playwright](https://playwright.dev/docs/emulation)
  - Borrowed: explicit viewport, locale, timezone, and reduced-motion configuration instead of assuming desktop defaults.
  - Applied in 338: mobile, tablet, and 320px reduced-motion contexts are declared explicitly in the mission-stack suite.
- [Snapshot testing | Playwright](https://playwright.dev/docs/aria-snapshots)
  - Borrowed: ARIA-oriented review posture for evidence capture, even when using lower-level accessibility snapshots or root attributes.
  - Applied in 338: the suite keeps ARIA/accessibility support available through the shared helper surface and aligns the lab to explicit scenario semantics.
- [Trace viewer | Playwright](https://playwright.dev/docs/trace-viewer-intro)
  - Borrowed: trace-backed debugging as the primary failure artifact for browser-visible proofs.
  - Applied in 338: every Playwright suite emits a trace zip and screenshot artifact for the evidence bundle.

### WCAG 2.2 and WAI-ARIA APG

- [Understanding Success Criterion 1.4.10: Reflow | WAI | W3C](https://www.w3.org/WAI/WCAG22/Understanding/reflow)
  - Borrowed: the 320px high-zoom proxy should preserve equivalent meaning without forcing two-dimensional scrolling.
  - Applied in 338: the mission-stack suite fails on horizontal overflow at 320px and records the compact breakpoint explicitly.
- [Understanding Success Criterion 2.4.13: Focus Appearance | WAI | W3C](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance)
  - Borrowed: focus indicators on high-risk hub controls must stay visible when the shell folds or blocks mutation.
  - Applied in 338: scope, queue, and mission-stack proofs keep the current control surface visible and do not rely on hover-only cues.
- [Understanding Success Criterion 2.5.8: Target Size (Minimum) | WAI | W3C](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum)
  - Borrowed: narrow-screen action targets need preserved touch-safe affordances.
  - Applied in 338: the mobile/tablet mission-stack proof uses the existing 333 folded shell rather than a compressed desktop rail.
- [Dialog (Modal) Pattern | APG | WAI | W3C](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
  - Borrowed: explicit modal semantics and focus handling for scope or recovery blockers.
  - Applied in 338: the org-boundary proof treats denied or frozen scope as dominant-state surfaces instead of hidden overlays.

### Real-environment posture support

- [Message Exchange for Social Care and Health - NHS England Digital](https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh)
  - Borrowed: MESH remains a governed external transport boundary rather than an in-browser mock concern.
  - Applied in 338: environment realism notes stay bounded to already-configured non-production control-plane evidence from `335`.
- [Interaction methods - NHS England Digital](https://digital.nhs.uk/developer/architecture/integration-patterns-book/interaction-methods)
  - Borrowed: explicit interaction-mode thinking for asynchronous and indirect external integrations.
  - Applied in 338: degraded and quarantined feed proofs keep external-adapter posture explicit instead of pretending synchronous live certainty.
- [Slot - FHIR v4.0.1](https://hl7.org/fhir/R4/slot.html)
  - Borrowed: slot state is an external scheduling fact that can still be weaker than local trusted booking truth.
  - Applied in 338: degraded and quarantined capacity sources remain secondary to the repository’s admission and offerability laws.
- [Appointment - FHIR v4.0.1](https://hl7.org/fhir/R4/appointment.html)
  - Borrowed: appointment/slot semantics inform why pre-commit truth must stay separate from commit certainty.
  - Applied in 338: the battery is intentionally scoped to pre-commit trust and does not conflate ranking or visibility correctness with commit confirmation.

## References considered but not allowed to override the local algorithm

- Playwright device-project guidance was used only to justify explicit context setup. The repository continues to use the existing tsx-driven browser harness instead of switching to a new global Playwright Test project matrix.
- WCAG and APG guidance informed reflow, focus, and modal behavior checks, but did not replace the local `mission_stack`, `DecisionDock`, or minimum-necessary laws defined by the blueprints and prior tasks.
- NHS MESH and interaction-pattern material informed environment realism only. It did not widen the scope of 338 into live-route or commit-path verification, which belongs elsewhere in the roadmap.
- HL7 FHIR Appointment and Slot material stayed contextual. The actual admission, ranking, and queue order laws remain the repository-owned outputs from `318` and `319`.

## Rejected or intentionally not imported

- I did not import external guidance that would normalize generic admin-table layouts or browser-local sorting behavior, because 338 specifically needs authoritative queue-order proof, not generic dashboard patterns.
- I did not introduce external retry heuristics or flaky-test workarounds that could hide state drift. Trace capture was added, but the tests still fail hard on authority divergence.
- I did not treat any external content as permission to soften denied or frozen visibility states. The local acting-context and minimum-necessary contracts remain stricter than generic UI examples.
