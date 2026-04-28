# Embedded Recovery And Artifact Spec

Task: `par_393`

Visual mode: `NHSApp_Embedded_Recovery_And_Artifacts`

## Purpose

This route family provides patient-visible NHS App recovery surfaces for expired links, invalid context, lost session, unsupported in-app actions, channel unavailability, route freezes, degraded mode, and artifact delivery fallback.

The governing rule is summary first: the patient must keep a safe route or artifact summary inside the app shell before any richer preview, download, browser handoff, or send-later action appears.

## Route Family

- `/nhs-app/recovery/:journeyRef/:view`
- `/embedded-recovery/:journeyRef/:view`
- `/nhs-app/artifacts/:artifactId/:view`

Supported views:

- `expired-link`
- `invalid-context`
- `lost-session`
- `unsupported-action`
- `channel-unavailable`
- `route-freeze`
- `degraded-mode`
- `artifact-summary`
- `artifact-preview`
- `download-progress`
- `artifact-fallback`
- `return-safe`

The implementation is wired in [App.tsx](/Users/test/Code/V/apps/patient-web/src/App.tsx) before the generic embedded shell catch-all.

## Components

- `EmbeddedLinkRecoveryBanner` preserves the last safe route or artifact context line.
- `EmbeddedExpiredLinkView` gives a short secure-link recovery explanation.
- `EmbeddedInvalidContextView` handles invalid context, lost session, and channel-unavailable copy.
- `EmbeddedUnsupportedActionView` explains constrained webview actions.
- `EmbeddedRouteFreezeNotice` makes frozen or held routes visible in shell.
- `EmbeddedDegradedModePanel` explains summary-only or reduced channel posture.
- `EmbeddedArtifactSummarySurface` shows the summary-first artifact card.
- `EmbeddedArtifactPreviewFrame` exposes preview only when preview truth allows it.
- `EmbeddedDownloadProgressCard` turns download into a deliberate bridge transfer state.
- `EmbeddedArtifactFallbackPanel` shows governed send-later or summary-only fallback.
- `EmbeddedReturnSafeRecoveryFrame` keeps the return route explicit and same-shell.
- `EmbeddedRecoveryActionCluster` holds the dominant primary action and one secondary action.

## Data Laws

- Recovery title, body, support code, actionability, route-freeze state, degraded state, and shell disposition derive from `EmbeddedRecoveryTruth`.
- Artifact title, summary, mode truth, preview state, transfer state, fallback state, and byte grant state derive from `EmbeddedArtifactTruth`.
- Preserved context exposes only summary-safe text, selected anchor, return contract, and support code.
- Browser handoff and secure send later are exposed only when the local projection says they are allowed.
- Blocked channel state disables the primary action and keeps only same-shell explanation visible.

## Canonical Bindings

The frontend binds to the following Phase 7 authorities by projection name:

- `ExternalEntryResolution`
- `SiteLinkManifest`
- `ChannelContextResolution`
- `PatientEmbeddedSessionProjection`
- `PatientEmbeddedNavEligibility`
- `BridgeCapabilityMatrix`
- `ArtifactPresentationContract`
- `ArtifactModeTruthProjection`
- `PatientDegradedModeProjection`
- `RouteFreezeDisposition`

The task intentionally does not mint access grants or deliver bytes. It renders the patient-safe surface family over the existing Phase 7 service contracts.

## Layout Rules

- Max content width is `40rem`.
- Card padding is `20px`.
- Inter-card spacing is `12px`.
- Sticky action reserve is `76px`.
- Body copy stays at `14px / 21px`.
- Recovery titles use `20px / 28px / 600`.
- Artifact summary titles use `16px / 24px / 600`.

## Interaction Rules

- Primary actions move toward the next safe same-shell state.
- Artifact summary opens preview only when preview state is available.
- Preview moves to deliberate download progress rather than a surprise browser event.
- Unsupported action and degraded mode route to summary or fallback, not generic browser errors.
- Return-safe recovery reopens the last safe summary or a placeholder when richer continuity is invalid.
