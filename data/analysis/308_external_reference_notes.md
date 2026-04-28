# 308 External Reference Notes

Accessed on 2026-04-22.

## Official sources reviewed

- Playwright browser-context isolation: <https://playwright.dev/docs/browser-contexts>
- Playwright ARIA snapshots: <https://playwright.dev/docs/aria-snapshots>
- Playwright visual comparisons: <https://playwright.dev/docs/test-snapshots>
- Playwright tracing API: <https://playwright.dev/docs/api/class-tracing>
- W3C WCAG 2.2 Focus Not Obscured (Minimum): <https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html>
- W3C WCAG 2.2 Target Size (Minimum): <https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html>
- W3C WCAG 2.2 Redundant Entry: <https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry.html>
- W3C WCAG 2.2 Reflow: <https://www.w3.org/WAI/WCAG22/Understanding/reflow.html>
- NHS question pages: <https://service-manual.nhs.uk/design-system/patterns/question-pages>
- NHS check answers: <https://service-manual.nhs.uk/design-system/patterns/check-answers>
- NHS confirmation page: <https://service-manual.nhs.uk/design-system/patterns/confirmation-page>

## Borrowed

- Borrowed: Playwright browser-context guidance reinforced keeping patient confirmation, patient artifact, and staff reconciliation proofs in isolated contexts so state or storage drift cannot masquerade as cross-surface parity.
- Borrowed: Playwright ARIA snapshot guidance reinforced capturing stable accessibility-tree evidence for manage, waitlist, and reconciliation surfaces instead of relying only on screenshots.
- Borrowed: Playwright visual-comparison guidance reinforced deterministic screenshot capture for parity review, while still treating the repository’s route markers and truth objects as the primary oracle.
- Borrowed: Playwright tracing guidance reinforced emitting trace bundles for each high-risk browser proof so CI failures can be replayed through DOM snapshots and action logs.
- Borrowed: WCAG 2.2 Focus Not Obscured guidance reinforced explicit focus-visibility assertions on manage, waitlist, and staff booking controls.
- Borrowed: WCAG 2.2 Target Size guidance reinforced asserting that the critical patient and staff controls stay at or above 24 by 24 CSS pixels.
- Borrowed: WCAG 2.2 Redundant Entry guidance reinforced preserving previously known waitlist and booking context on recovery surfaces rather than re-asking the user for already-held state.
- Borrowed: WCAG 2.2 Reflow guidance reinforced mobile overflow checks on the waitlist fallback path so state-critical controls stay reachable without horizontal scrolling.
- Borrowed: NHS question-page guidance reinforced one clear dominant action with explicit back or return continuity on manage and waitlist recovery states.
- Borrowed: NHS check-answers guidance reinforced keeping summary-first provenance visible before any confirmation-style calmness or detached artifact action is shown.
- Borrowed: NHS confirmation-page guidance reinforced that calm, completion-style messaging belongs only after authoritative booking truth is final and should not bleed into pending or disputed states.

## Rejected

- Rejected: using screenshot parity or visual similarity as authority over `PatientAppointmentManageProjection`, `WaitlistContinuationTruthProjection`, or `StaffBookingHandoffProjection`.
- Rejected: widening NHS-style confirmation calmness to disputed or reconciliation-required booking states before `ExternalConfirmationGate` truth is final.
- Rejected: treating callback transfer, waitlist expiry, or supersession as permission to reset fallback debt or ask the patient to re-enter information the system already has.
- Rejected: allowing focus-critical status controls to rely on hover-only explanations or off-screen sticky affordances.
- Rejected: collapsing patient, artifact, and staff reconciliation states into one optimistic browser label when the local blueprint keeps those authorities separate.

## Notes

The local Phase 4 and Phase 0 blueprints remained authoritative throughout implementation. These external references were used to sharpen browser-proof technique, accessibility checks, and trust-preserving copy structure without relaxing the repository’s booking-truth law.
