# Phase 7 - Inside the NHS App

**Working scope**  
NHS App web integration and patient-channel hardening.

This is the phase where Vecells takes the patient-facing web platform already built in Phases 1 to 6 and turns it into a proper NHS App channel, not a separate product. The architecture already treats NHS App as an optional jump-off channel into the same request, booking, pharmacy, and status flows, and the acquisition sequence places NHS App after NHS login and before the broader channel and service-discovery expansion.

That still fits the current NHS App model. NHS England says an NHS App web integration is the surfacing of a responsive website inside the NHS App, it must follow the NHS digital service manual, and suppliers may be required to change their interface to align with NHS accessibility and style guidance. The same guidance says NHS login must be integrated before an NHS App integration goes live, and the current NHS App functionality page still describes online consultation-style services as a direct integration type, including patient medical and admin query journeys to a GP surgery. ([NHS England Digital][1])

The technical runtime is also fairly specific now. NHS App developer guidance describes the web integration as a tailored webview with jump-off navigation, a custom user agent, hidden supplier headers in favour of the NHS App chrome, optional NHS App-specific functionality through the JS API, and guidance for SSO, site links, and browser limitations. It also says suppliers should use the NHS App JWT handoff through `assertedLoginIdentity`, pass `prompt=none` in the NHS login authorize flow, handle `ConsentNotGiven`, and design around limits such as conventional file download not working in the webview and browser print not being supported. ([NHS Connect][2])

So Phase 7 is not about inventing new clinical features. It is about channel conversion. The same journeys must now work beautifully as standalone web and as NHS App-embedded web, with the same backend truth, the same patient identity, the same request lineage, and stronger mobile polish, embedded navigation, deep-link continuity, and assurance evidence. That is the entire job of this phase.

## Phase 7 objective

By the end of this phase, Vecells must be able to do all of the following cleanly:

- launch selected Vecells journeys from NHS App jump-off points
- establish or recover the right patient session without creating a second identity model
- render the same journeys in embedded mode without duplicate chrome, broken back navigation, or browser-only assumptions
- reopen secure links and ongoing journeys from mobile channels in a way that works inside and outside the NHS App
- deliver documents, booking confirmations, status views, and manage flows in a webview-safe way
- satisfy the current NHS App integration process, standards, demo, SCAL, and release gates
- collect the telemetry and evidence needed for limited release, full release, and post-go-live assurance

## Overall Phase 7 algorithm

1. Freeze the patient journey inventory and define which routes are safe and valuable inside NHS App.
2. Add a formal NHS App integration manifest and embedded-channel context model.
3. Implement NHS App-specific SSO handoff and local session continuity on top of Phase 2 NHS login.
4. Build an embedded shell and NHS App bridge around the existing portal, not a separate app.
5. Add deep-link, site-link, and return-to-journey handling for status, booking, and pharmacy flows.
6. Harden file delivery, error recovery, and navigation for webview constraints.
7. Complete accessibility, design-system, and service-standard hardening specifically for mobile embedded use.
8. Prove the integration in Sandpit, then AOS, then limited release, then full release.

## What Phase 7 must prove before Phase 8 starts

Before moving to the assistive layer, all of this needs to be true:

- the NHS App experience is the same core product, not a fork
- NHS App entry, standalone web entry, and resumed-link entry all land in the same backend contracts
- session continuity, silent re-auth, and patient ownership behave safely in embedded mode
- navigation, downloads, and deep links work inside the NHS App webview
- no critical patient journey depends on unsupported browser behaviour
- every embedded journey is accessibility-audited and mobile-clean
- the release can pass NHS App process gates without hidden manual fixes

## Phase 7 implementation rules

**Rule 1: one portal, two shells, zero forks.**  
Do not create the NHS App version of Vecells. Create one portal with a `standalone` shell and an `embedded` shell on top of the same route, state, and API contracts. That fits the official web-integration model and the architecture. ([NHS England Digital][1])

**Rule 2: NHS login remains the identity rail, but Vecells still owns session state.**  
NHS login authenticates the patient and returns requested data, but session management and logout remain the partner service's responsibility. So Phase 7 must reuse the Phase 2 identity model and add an NHS App entry bridge, not replace local session handling. ([NHS England Digital][3])

**Rule 3: embedded mode removes chrome, not capability.**  
The NHS App guidance explicitly expects suppliers to hide their own headers and work with the NHS App native header and footer. That means the page shell changes, but the journey logic should not split. ([NHS Connect][4])

**Rule 4: do not trust one signal for app detection.**  
The current guidance gives a custom user agent in the webview and also recommends query-parameter-based recognition for journeys where that user agent is not available. Use a proper channel-context resolver, not scattered `if userAgent.includes(...)` checks. ([NHS Connect][4])

**Rule 5: design for a limited browser.**  
Published developer guidance says conventional file download does not work in web integrations and browser print is not supported. If a patient journey depends on those behaviours, redesign it. ([NHS Connect][4])

**Rule 6: the UI still has to feel premium.**  
The NHS App standards now require WCAG 2.2 AA, all 17 points of the NHS service standard, clinical safety standards, and data privacy compliance. The NHS design system has also been updated for WCAG 2.2. So the world-class minimal requirement stays, but it must sit inside NHS rules, not outside them. ([NHS England Digital][5])

---

## 7A. Journey inventory, integration manifest, and onboarding pack

This sub-phase turns we want to be in the NHS App into hard engineering scope.

The NHS App process is not just a technical hookup. Current guidance says the service must be patient-facing, personalised, free at the point of delivery, commissioned by an NHS body in England, NHS-login-enabled or approved for NHS login, and able to meet the NHS App standards. The expression-of-interest flow also asks for a public-facing service desk, a demo environment, recent user research, a recent WCAG 2.1 or 2.2 audit, and explicit confirmation that dedicated design and development capacity will be available during the integration. Treat all of that as Phase 7 input data, not as later procurement admin. ([NHS England Digital][1])

### Backend work

Create an `NHSAppIntegrationManifest` and make it the single source of truth for what Vecells exposes inside the NHS App.

Suggested objects:

**NHSAppIntegrationManifest**  
`manifestId`, `baseUrlsByEnvironment`, `allowedJourneyPaths`, `jumpOffMappings`, `requiresNhsLogin`, `supportsEmbeddedMode`, `cohortRules`, `serviceDeskProfileRef`, `evidencePackRef`, `currentReleaseState`

**JourneyPathDefinition**  
`journeyPathId`, `routePattern`, `journeyType`, `requiresAuth`, `supportsResume`, `supportsDeepLink`, `embeddedReadinessState`, `channelFallbackBehaviour`

**JumpOffMapping**  
`mappingId`, `nhsAppPlacement`, `odsVisibilityRule`, `journeyPathId`, `copyVariantRef`, `releaseCohortRef`

**IntegrationEvidencePack**  
`evidencePackId`, `demoEnvironmentUrl`, `uxAuditRefs`, `clinicalSafetyRefs`, `privacyRefs`, `SCALRefs`, `incidentRunbookRefs`

Inventory every patient route from Phases 1 to 6 and classify it as one of:

- safe for NHS App now
- needs embedded adaptation first
- not suitable for NHS App in this phase

For Vecells, the initial high-value routes are usually:

- start medical or admin request
- continue draft
- request status
- respond to more-info request
- manage local appointment
- accept waitlist or hub alternative offer
- pharmacy choice and pharmacy status

Do not surface routes just because they exist. Surface only routes that behave well inside a mobile webview.

### Frontend work

Build a route inventory board for design and engineering together. Every route should have:

- standalone shell screenshot
- embedded shell screenshot
- mobile width acceptance notes
- auth state matrix
- error state matrix
- exit behaviour
- analytics event names

Also create a small internal app-readiness mode that lets the design and QA teams preview embedded layout without needing a live NHS App environment for every pass.

### Tests that must pass before moving on

- every manifest route has an owning team and test plan
- unapproved routes cannot be launched from NHS App context
- environment-specific base URLs validate correctly
- cohort rules and jump-off mappings are deterministic
- the demo environment is reachable, stable, and seeded with safe representative journeys

### Exit state

You now have a hard, auditable definition of what Vecells will expose inside NHS App and what evidence you need to support it.

---

## 7B. Embedded channel bootstrap, context resolver, and shell split

This sub-phase creates the embedded runtime contract.

NHS App developer guidance says the native app hosts a tailored webview, supplies a custom user agent, and expects suppliers to hide their own header so the NHS App native chrome can take over. The same guidance also recommends query-parameter recognition for web journeys where the custom user agent is not available, especially if the same URLs are used for both NHS App and normal browser traffic. ([NHS Connect][2])

### Backend work

Create a `ChannelContextResolver` that determines how the current request should be handled.

Suggested objects:

**ChannelContext**  
`channelType`, `entryMode`, `isEmbedded`, `userAgentEvidence`, `queryEvidence`, `assertedIdentityPresent`, `deepLinkPresent`, `jumpOffSource`, `channelConfidence`

**EmbeddedEntryToken**  
`entryTokenId`, `journeyPathId`, `issuedAt`, `expiresAt`, `cohortRef`, `intendedChannel`, `contextClaims`

**ShellPolicy**  
`shellPolicyId`, `channelType`, `showHeader`, `showFooter`, `showBackLink`, `safeAreaInsetsMode`, `externalLinkMode`, `downloadMode`

Use this resolution algorithm:

1. inspect signed server-side context first if present
2. inspect explicit query parameters like `from=nhsApp`
3. inspect NHS App user-agent markers
4. inspect whether the route arrived with an NHS App SSO assertion
5. compute a `ChannelContext`
6. attach `ShellPolicy` to the request and response model

Important: `ChannelContext` is for rendering and navigation policy. It must not become a shortcut around authentication or authorization.

### Frontend work

Build two shell render modes over the same route tree:

**StandaloneShell**  
Full Vecells header, footer, and chrome.

**EmbeddedShell**  
NHS App-appropriate chrome suppression, tighter vertical framing, safer mobile spacing, and app-native-feeling transitions.

The embedded shell should:

- remove duplicate global header and footer
- keep route titles and primary action hierarchy
- keep error summaries and consent states intact
- preserve the same component semantics and accessibility tree
- stay visually premium and calm

Do not create a separate React app or bundle for embedded mode. Use a shell-level adaptation layer.

### Tests that must pass before moving on

- channel detection is consistent across SSR and client hydration
- spoofed query parameters cannot unlock privileged behaviour
- no duplicate header or footer appears in embedded mode
- every supported route renders correctly in both shells
- invalid or missing context falls back safely to standalone web or a supported recovery page

### Exit state

The portal can now render as either a normal website or an NHS App-embedded website without route duplication.

---

## 7C. NHS App SSO bridge and local session continuity

This sub-phase handles the identity jump-off correctly.

Published NHS App guidance says logged-in users are passed to supplier services using NHS login SSO by sending an NHS App JWT through the `assertedLoginIdentity` query parameter. It also says suppliers provide base URLs and journey paths, use `prompt=none` on the NHS login authorize call, convert the parameter name to `asserted_login_identity` for NHS login, and handle the `access_denied / ConsentNotGiven` return path. NHS login guidance separately says session management and logout remain the partner's responsibility. ([NHS Connect][4])

### Backend work

Build an `NHSAppSsoBridge` as a discrete auth module, not as incidental controller logic.

Suggested objects:

**SSOEntryGrant**  
`entryGrantId`, `journeyPathId`, `assertedIdentityHash`, `receivedAt`, `expiresAt`, `stateRef`, `returnIntentRef`

**AuthBridgeTransaction**  
`transactionId`, `entryGrantId`, `state`, `nonce`, `codeVerifier`, `promptMode`, `status`, `errorRef`

**SessionMergePolicy**  
`policyId`, `existingSessionBehaviour`, `subjectMismatchBehaviour`, `draftClaimBehaviour`, `resumeIntentBehaviour`

**ReturnIntent**  
`returnIntentId`, `postAuthRoute`, `postAuthParams`, `embeddedState`, `fallbackAppPage`

Use this algorithm:

1. NHS App launches a journey URL with `assertedLoginIdentity`
2. Vecells captures the parameter without logging raw token content
3. bridge creates `AuthBridgeTransaction`
4. bridge calls NHS login `/authorize` with `prompt=none`
5. bridge handles silent success, silent failure, or consent denial
6. on success, create or refresh local Vecells session
7. merge or claim any in-flight draft or status journey
8. redirect into the intended route in embedded mode
9. on known failure, render a return-to-app recovery path

If an existing local session is already present and maps to the same user, reuse it. If the subject conflicts, end the old session and force a clean re-entry.

### Frontend work

Build these patient-visible embedded auth states:

- Opening your NHS login
- Confirming your details
- We could not sign you in here
- Please go back to the NHS App and try again
- You chose not to use your NHS login
- Your session has ended

These states must be polished and minimal. They should never feel like raw OIDC plumbing.

### Tests that must pass before moving on

- `assertedLoginIdentity` is never written to logs or analytics
- `prompt=none` silent-auth path works
- `ConsentNotGiven` route is handled and returns the user safely
- session mismatch and subject switch are safe
- draft and status journeys survive silent re-auth
- embedded auth failures never strand the user on a blank or looping page

### Exit state

NHS App jump-off can now produce a proper Vecells session and land the patient in the right journey without creating a second identity system.

---

## 7D. Deep links, site links, and return-to-journey continuity

This sub-phase makes the patient journey resilient beyond the initial jump-off.

NHS App developer guidance says suppliers can enable links from emails or SMS to open inside the NHS App through site links, but that this requires changes on both the NHS App side and the supplier side. The guidance also says Android and iOS need the usual association-file setup, coordinated with the NHS App team. ([NHS Connect][4])

### Backend work

Create a deep-link and resume subsystem rather than letting link handling stay implicit.

Do not introduce a second canonical grant system here. NHS App launches, secure links, resumed journeys, continuation links, and external-message entry points must all use `AccessGrantService` and the canonical `AccessGrant` model defined in `phase-0-the-foundation-protocol.md` under `## Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm`.

Route metadata such as target route, journey step, and shell hints may exist as launch metadata, but scope, PHI exposure, one-time redemption, subject binding, rotation, and revocation must remain owned by `AccessGrantService`.

Suggested objects:

**SiteLinkManifest**  
`manifestId`, `androidAssetLinksRef`, `iosAssociationRef`, `allowedPathPatterns`, `environmentMappings`

**LinkResolutionAudit**  
`resolutionId`, `incomingPath`, `channelDetected`, `embeddedState`, `subjectLinked`, `resolutionOutcome`

Use this algorithm:

1. define all deep-linkable patient routes and the minimum assurance level each route requires
2. ask `AccessGrantService` to issue the correct canonical `AccessGrant` with limited TTL, narrow scope, and explicit subject binding where required
3. when the link opens, validate the grant state, TTL, replay status, supersession state, and binding requirements before any patient-specific route is resolved
4. establish or recover the user session
5. if the canonical grant is subject-bound, compare the live session `subjectRef` with the bound `subjectRef`; on mismatch, deny route resolution, audit the mismatch, and send the user to a safe recovery route with no PHI exposure
6. if the route requires verified claim or stronger assurance, force that step before resolving to a PHI-bearing screen
7. only after grant checks, subject binding, and assurance checks pass resolve the link into the correct route, session, and shell
8. consume, rotate, or revoke the canonical grant through `AccessGrantService` according to policy
9. audit the resolution outcome

A canonical grant without a bound subject may only point to a route that reveals no patient-specific content until later verification succeeds.

High-value deep-link targets for Vecells are:

- request status
- respond-to-questions
- appointment manage
- waitlist offer accept
- hub alternative offer accept
- pharmacy instructions or status

### Frontend work

Build a unified landing component for all secure link entry. It should do three things very well:

- tell the user what they are opening
- recover the correct session or ask them to re-authenticate
- return them to the intended route with the correct shell and navigation

The page should not expose raw token errors. It should feel like a clean opening-your-journey state.

Once the correct entity scope is known, the landing path must switch to soft navigation inside the relevant `PersistentShell`. Only true authentication or permission boundaries may replace the shell entirely; adjacent request states inside the same route family must preserve `AnchorCard`, `AmbientStateRibbon`, and live projection context.

### Tests that must pass before moving on

- Android and iOS site-link manifests validate in each environment
- expired links resolve to correct fallback pages
- replayed one-time grants are rejected safely
- email and SMS links open in app when configured and in browser when not
- link resolution preserves patient ownership and route scope
- no cross-patient access is possible through stale or shared links

### Exit state

Vecells can now reopen the right patient journey from external communications in a way that feels continuous inside the NHS App.

---

## 7E. NHS App bridge API, navigation model, and embedded behaviours

This sub-phase gives the UI a safe abstraction over NHS App-specific browser behaviour.

Published NHS App developer guidance says the embedded page can use the NHS App JS API for native-ish behaviours, and the published reference shows capabilities such as detecting whether the page is inside the app, overriding native back behaviour, navigating to app pages or the home page, opening browser overlays or the external browser, adding to calendar, and downloading files from bytes. That same published reference also says the old v1 API is deprecated and new integrations should use v2 for new work, which is why Vecells should wrap the current NHS App JS API behind its own bridge instead of spreading vendor calls across the component tree. ([NHS Connect][2])

### Backend work

Keep the backend largely channel-neutral here, but define route metadata that the frontend bridge can consume.

Suggested objects:

**NavigationContract**  
`routeId`, `backBehaviour`, `preferredExitDestination`, `allowsExternalBrowser`, `allowsBrowserOverlay`, `calendarSupport`, `downloadSupport`

**AppPageIntent**  
`intentId`, `appDestination`, `reason`, `issuedAt`, `routeOrigin`

### Frontend work

Implement an `NHSAppBridge` with a strict interface, for example:

- `isEmbedded()`
- `setBackAction()`
- `clearBackAction()`
- `goHome()`
- `goToAppPage(page)`
- `openOverlay(url)`
- `openExternal(url)`
- `addToCalendar(event)`
- `downloadBytes(file)`

The rest of the app should call this bridge, not the raw NHS App API.

Use it for real user value:

- set back behaviour on step flows
- send patients back to the safest NHS App page after auth or error states
- add appointments to device calendar from manage and confirmation pages
- download letters or PDFs in webview-safe form
- open external information only when it truly belongs outside the current journey

### Tests that must pass before moving on

- app bridge no-ops safely outside NHS App
- native back behaviour is deterministic per route
- add-to-calendar works for appointments and is absent where unsupported
- file delivery works in app and browser
- no direct raw NHS App JS API calls leak into route components
- app exit and re-entry do not corrupt route state

### Exit state

The frontend now has a stable embedded-runtime abstraction instead of ad hoc NHS App-specific code sprinkled through the portal.

---

## 7F. Webview limitations, file handling, and resilient error UX

This sub-phase hardens the product against the things a webview does badly.

The current guidance says conventional file download does not work in NHS App web integrations, while browser print is not planned. The same guidance also expects suppliers to handle authentication failures and consent-denied states with appropriate error pages that guide the user back to the NHS App. NHS messaging guidance separately says patient messages should use plain simple English, start with the most important information, keep content concise, and ideally avoid more than one call to action. ([NHS Connect][4])

### Backend work

Create a channel-safe artifact delivery path.

Suggested objects:

**BinaryArtifactDelivery**  
`artifactId`, `artifactType`, `deliveryMode`, `base64Ref`, `mimeType`, `filename`, `ttl`, `accessScope`

**EmbeddedErrorContract**  
`errorCode`, `category`, `retryMode`, `preferredExit`, `patientMessageRef`

**ChannelDegradedMode**  
`modeId`, `affectedRoutes`, `fallbackBehaviour`, `noticeCopyRef`, `activatedAt`

Implement these policies:

- PDFs and similar assets are pre-rendered and delivered through byte-based download where needed
- print-dependent journeys are replaced by download, share, or we-will-send-this-another-way
- auth and link failures map to friendly error contracts, not raw exceptions
- degraded-mode banners can be channel-specific

### Frontend work

Build NHS App-specific error and recovery screens for:

- invalid or missing SSO handoff
- expired link
- lost session
- channel unavailable
- file unavailable
- unsupported action in app context

These pages should be visually simple and highly directive. One primary action. One clear recovery route. No technical jargon.

For downloads, treat documents as a deliberate action with progress and completion states, not as a surprise browser event.

### Tests that must pass before moving on

- document downloads work inside NHS App and standard web
- print-dependent journeys have no dead-end behaviour
- embedded error pages always provide a clear next step
- missing or malformed context never results in a white screen
- degraded mode can be toggled without redeploy
- every user-facing error copy passes content and accessibility review

### Exit state

Patient journeys now survive the real limitations of the NHS App webview rather than assuming a full desktop browser.

---

## 7G. Accessibility, design-system convergence, and channel-grade UX refinement

This sub-phase turns it works in the app into it is allowed to stay in the app.

The current NHS App standards page says integrated products must meet WCAG 2.2 AA, provide evidence through an accessibility audit, meet all 17 points of the NHS service standard, and certify compliance with DCB0129, DCB0160, GDPR, and PECR through SCAL. The NHS service manual also emphasises joined-up multi-channel experience, simplicity, and inclusion, while the accessibility guidance says WCAG 2.2 adds new A and AA requirements for NHS websites and public mobile apps and explicitly warns against relying on accessibility widgets. The NHS design system has also been updated to meet WCAG 2.2 AA. ([NHS England Digital][5])

### Backend work

Accessibility is mostly front-end heavy, but the backend should support it through:

**AccessibleContentVariant**  
`contentId`, `routeId`, `variantType`, `channelType`, `lastReviewedAt`

**AuditEvidenceReference**  
`evidenceId`, `auditType`, `scope`, `completedAt`, `findingsRef`, `owner`

**UIStateContract**  
Explicit loading, empty, warning, success, and error states for every embedded journey

### Frontend work

Refine every embedded patient journey against an NHS-grade quality bar.

That means:

- safe focus order in step flows and drawers
- no focus obscuring from sticky actions or app chrome
- touch targets that comfortably meet WCAG 2.2 expectations
- mobile-first spacing and typography
- no scroll traps
- no hidden text that only works in standalone mode
- high-quality error summaries
- clear form questions and review screens
- no accessibility widget shortcuts

This is also where the sleek minimalistic design requirement becomes final rather than aspirational. The pages should feel premium and quiet, but that polish must come from hierarchy, spacing, wording, and flow discipline, not from decorative UI.

### Tests that must pass before moving on

- external accessibility audit is complete and findings are triaged
- automated, manual, and screen-reader checks all run in CI and release gates
- mobile viewport matrix is green for all embedded journeys
- focus is never obscured by sticky elements or app navigation
- standalone and embedded experiences both pass keyboard-only navigation
- content has recent user research evidence and a recent accessibility audit outcome ready for the NHS App process

### Exit state

The patient journeys are now not only webview-compatible but genuinely NHS App-grade in accessibility and UX quality.

---

## 7H. Sandpit, AOS, SCAL, and operational delivery pipeline

This sub-phase makes the integration real in NHS environments.

The current NHS App process is explicit: after expression of interest and suitability review, suppliers complete product assessment and a Solution Design document, then build and demo in Sandpit, repeat in AOS, complete an incident rehearsal, upload SCAL with required evidence including clinical safety documentation, sign the connection agreement, and then move into limited release and full release. The standards page also says Step 4 requires evidence of compliance, including accessibility audit evidence. ([NHS England Digital][1])

### Backend work

Create environment-specific configuration packs and release controls.

Suggested objects:

**NHSAppEnvironmentProfile**  
`environment`, `baseUrl`, `journeyPaths`, `ssoConfigRef`, `siteLinkConfigRef`, `telemetryNamespace`, `allowedCohorts`

**IntegrationDemoDataset**  
`datasetId`, `journeyCoverage`, `syntheticPatients`, `syntheticRequests`, `syntheticAppointments`, `syntheticPharmacyCases`

**ChannelTelemetryPlan**  
`planId`, `trackedJourneys`, `successMetrics`, `failureMetrics`, `dropOffMetrics`, `cohortBreakdowns`

**SCALBundle**  
`bundleId`, `environment`, `evidenceRefs`, `owner`, `submissionState`

Build this release path:

1. deploy NHS App embed build to Sandpit profile
2. run demo-checklist automation
3. run manual demo and fix actions
4. repeat in AOS profile
5. complete incident rehearsal
6. submit SCAL evidence bundle
7. lock release configuration
8. prepare limited release cohorts

### Frontend work

Maintain a real demo environment, not a half-working preview. The NHS App process explicitly reviews the product based on a demo environment, so the demo needs seeded request, booking, waitlist, and pharmacy journeys that are stable enough to show live. The same integration flow also expects a delivery plan and implementation approach, so the UI team needs environment-ready toggles, seeded copy, and controlled test accounts. ([NHS England Digital][1])

### Tests that must pass before moving on

- Sandpit sign-off checklist is green
- AOS sign-off checklist is green
- incident rehearsal completes with documented actions
- SCAL evidence pack is complete, current, and internally approved
- demo environment is stable for repeated walkthroughs
- telemetry events match the agreed journey inventory and are validated before limited release

### Exit state

The phase is now not just technically built but operationally packaged for NHS App approval and release.

---

## 7I. Limited release, post-live governance, and formal exit gate

This sub-phase turns the integration into a controlled live service.

The NHS App process says suppliers begin with a limited release to a sample cohort, then move to full release with the NHS App team. Post go-live, suppliers must provide monthly data, attend annual assurance reviews with NHS App and NHS login together, and notify their integration manager about user-journey changes. The current guidance also says to allow around 1 month for minor journey changes such as jump-off content and at least 3 months for significant changes or new journeys because those require planning and product assessment. ([NHS England Digital][6])

### Backend work

Create controlled release objects:

**ChannelReleaseCohort**  
`cohortId`, `odsRules`, `patientPopulationRules`, `enabledJourneys`, `releaseStage`, `startAt`, `endAt`

**NHSAppPerformancePack**  
`packId`, `period`, `journeyUsage`, `completionRates`, `dropOffs`, `incidentSummary`, `accessibilityIssues`, `safetyIssues`

**JourneyChangeNotice**  
`noticeId`, `changeType`, `affectedJourneys`, `leadTimeRequired`, `submittedAt`, `approvalState`

Use this go-live algorithm:

1. enable a small controlled cohort
2. validate journey completions, auth success, and error rates
3. expand to wider cohorts only when thresholds are met
4. begin monthly data pack generation automatically
5. lock major route changes behind a change-notice process
6. preserve replayable audit for every live channel decision

### Frontend work

For limited release, the patient-facing experience must already look final. Do not ship temporary embedded pages into a live national channel. Use cohort flags to control exposure, not quality.

Also harden support and operations views so you can answer questions like:

- which jump-off route the patient used
- whether they came from NHS App or standalone web
- whether silent SSO succeeded
- where they dropped out
- what the user saw on error

### Tests that must all pass before Phase 8

- no Sev-1 or Sev-2 defects in embedded auth, start-request, status, booking, or pharmacy flows
- limited release cohort gating is correct and reversible
- every supported patient journey works in standalone web and embedded mode
- NHS App-specific downloads and navigation actions are stable
- full audit trail exists for entry, auth, route resolution, and exit
- monthly data pack generation works automatically
- change-notice workflow exists for post-live journey changes
- rollback rehearsal from live to disabled jump-off state is complete

### Exit state

The same patient portal now operates safely as a national-channel experience inside the NHS App, with controlled rollout and ongoing assurance rather than a one-off embed.

---

## Recommended rollout slices inside Phase 7

Ship this phase in five slices:

**Slice 7.1**  
Embedded shell, route manifest, and read-only NHS App preview mode.

**Slice 7.2**  
NHS App SSO bridge and start-request jump-off for a narrow cohort.

**Slice 7.3**  
Status, more-info response, and manage-appointment journeys in embedded mode.

**Slice 7.4**  
Deep links, site links, file delivery, and embedded error handling.

**Slice 7.5**  
Sandpit, AOS, SCAL sign-off, limited release, then full release.

## System after Phase 7

After this phase, Vecells is no longer just a standalone portal with an optional future NHS App idea around it. It becomes a real NHS App-integrated patient channel: jump-off journeys launch into the same request, status, booking, and pharmacy flows; NHS login continuity is preserved; embedded mode behaves like a first-class mobile experience; deep links and document actions work in the webview; and the product can move through the current NHS App onboarding, assurance, and release process without architectural rework. That is exactly the role the architecture assigns to NHS App web integration as a continuity and acquisition channel layered on top of the same core access and operations platform.

[1]: https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/nhs-app-web-integration "NHS App web integration - NHS England Digital"
[2]: https://nhsconnect.github.io/nhsapp-developer-documentation/web-integration-overview/ "Web Integration Overview"
[3]: https://digital.nhs.uk/services/nhs-login/nhs-login-for-partners-and-developers/nhs-login-integration-toolkit/how-nhs-login-works?utm_source=chatgpt.com "How NHS login works"
[4]: https://nhsconnect.github.io/nhsapp-developer-documentation/web-integration-guidance/ "Web Integration Guidance"
[5]: https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/standards-for-nhs-app-integration "Standards for NHS App integration - NHS England Digital"
[6]: https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/nhs-app-web-integration?utm_source=chatgpt.com "NHS App web integration"
