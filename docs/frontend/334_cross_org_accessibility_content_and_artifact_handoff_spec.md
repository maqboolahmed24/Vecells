# 334 Cross-Org Accessibility, Content, And Artifact Handoff

## Visual mode

- `Governed_Artifact_Handoff_Studio`

## Outcome

Phase 5 confirmation, manage, audit, practice-visibility, and recovery surfaces now share one summary-first artifact grammar. Richer preview, print, download, export, and handoff behavior stays secondary, grant-bound, and return-safe instead of quietly widening or vanishing.

## Core surface family

1. `CrossOrgArtifactSurfaceFrame`
2. `ArtifactParityBanner`
3. `NetworkConfirmationArtifactStage`
4. `PracticeNotificationArtifactSummary`
5. `GrantBoundPreviewState`
6. `GovernedPlaceholderSummary`
7. `ArtifactHandoffActionBar`
8. `ReturnAnchorReceipt`
9. `CrossOrgContentLegend`
10. `AccessibleTimelineStatusAnnotations`

## Canonical truth phrases

- `Appointment confirmed`: patient reassurance for the current appointment generation only.
- `Practice informed`: the current operational notice was sent to the origin practice.
- `Practice acknowledged`: the origin practice confirmed receipt of the current generation.
- `Manage live`: the current manage capability tuple is live on this route.
- `Provider pending`: a requested change is visible here, but provider settlement remains pending.
- `Callback fallback`: fallback remains a separate governed path, not a reminder-success alias.

## Artifact stage laws

1. Summary-first is the default state across patient confirmation, patient manage, hub commit, and recovery surfaces.
2. `preview`, `print`, `download`, `export`, and `external_handoff` stay inside one artifact frame and never become detached mini workflows.
3. Preview only becomes active when current parity, grant state, visibility tier, and host posture all permit it.
4. Hidden cross-organisation detail renders as a governed placeholder or bounded summary, never silent whitespace.
5. Downgrade from preview-capable to summary-only happens in place and preserves the current return anchor.
6. Embedded `nhs_app` host posture keeps richer movement summary-only unless a later contract explicitly widens it.

## Audience treatment

- Patient confirmation keeps reassurance calm but never softens `Practice informed` or `Practice acknowledged` into the same label.
- Patient manage keeps timeline, reminder, and fallback detail inside the same shell and explains why richer artifact movement may be held back.
- Hub commit keeps receipt truth primary, then shows separate patient wording, practice wording, continuity evidence, and secondary artifact actions.
- Hub recovery keeps callback, urgent return, provenance, and bounded cross-org explanations visible even when richer detail is withheld.

## Accessibility contract

1. Every artifact frame, banner, timeline annotation cluster, drawer, and placeholder has a stable accessible name.
2. Return anchors are focusable and are restored by the `ReturnAnchorReceipt` instead of dropping focus into the page top.
3. Status messaging stays restrained through existing polite live regions; artifact actions do not mint noisy toast-only state.
4. Reflow at mobile widths keeps the artifact stage, action bar, and placeholder content readable without horizontal scrolling.
5. Reduced motion collapses action and return transitions while preserving semantic state changes.

## Proof surface

- local `@vecells/design-system` typecheck
- local `patient-web` build and vitest coverage
- local `hub-desk` build and vitest coverage
- Playwright proof for summary-first rendering, blocked versus active preview posture, continuity preview parity, return-anchor restoration, high-zoom readability, and reduced-motion behavior
- validator coverage for contract artifacts, canonical phrase matrices, runtime projection truth, and DOM marker coupling
