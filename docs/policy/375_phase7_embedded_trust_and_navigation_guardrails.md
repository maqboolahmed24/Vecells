# 375 Phase 7 Embedded Trust And Navigation Guardrails

## Trust Rules

- User-agent markers are evidence, not authority.
- Query hints are styling and recovery hints only.
- Raw bridge-object presence is not authority.
- Only signed server evidence, an unexpired embedded entry token, or a validated NHS App SSO handoff may create trusted embedded posture.
- When signals conflict, the stricter posture wins and embedded actionability downgrades in place.

## SSO Rules

- `assertedLoginIdentity` must be captured, hashed, and redacted immediately.
- Raw asserted identity must not enter access logs, tracing spans, analytics, referrers, replay tooling, durable storage, screenshots, or browser history.
- SSO callbacks must verify state, nonce, PKCE, issuer, audience, expiry, manifest, bridge, and context fences.
- `SSOEntryGrant` is single-redemption and exact-once.
- Subject mismatch must end in repair, bounded re-entry, or denial. Silent merge is forbidden.
- Local session reuse is legal only for the same subject and compatible identity binding.

## Return-Intent Rules

- `ReturnIntent` is a governed object, not a raw URL.
- Every successful return must convert into exactly one `RouteIntentBinding`.
- Draft resume must prove the submission envelope is still unpromoted and the draft lease is still reacquirable.
- Manifest drift, release drift, session epoch drift, subject-binding drift, bridge-capability drift, lineage drift, or continuity drift invalidates the intent and routes to bounded recovery.

## Deep-Link Rules

- Site links and deep links can carry launch metadata only.
- PHI exposure, subject binding, redemption budget, revocation, and mutation authority remain owned by canonical `AccessGrantService`.
- A subject-bound grant must compare the live session subject before patient-specific content is resolved.
- A non-subject-bound grant may land only on non-PHI introduction or verification screens.

## Navigation Rules

- Native back, app-page navigation, browser overlay, external browser, calendar, and download actions must resolve through `PatientEmbeddedNavEligibility` before rendering live.
- Native back behavior must be installed through `BridgeActionLease` and cleared on route exit or drift.
- Overlay, external browser, and app-page handoff must consume a current `OutboundNavigationGrant`.
- PHI-bearing query strings are forbidden in outbound destinations.
- Stale leases and grants fail closed into the same shell with the declared `RouteFreezeDisposition`.

## Bridge Capability Rules

- `BridgeCapabilityMatrix` is recorded before bridge-backed action use.
- Cached older JS API builds must degrade through capability checks instead of failing open.
- `goToPage`, `setBackAction`, `clearBackAction`, `openBrowserOverlay`, `openExternalBrowser`, `addEventToCalendar`, and `downloadFromBytes` require route-scoped eligibility.
- Outside NHS App, bridge methods no-op or route to browser-safe fallback according to the route's `NavigationContract`.
