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

## NHS App channel priorities

This iteration closes five high-priority defects inside the NHS App channel design:

1. Manifest drift could let Sandpit, AOS, and live expose different routes or copy under the same release label. Fix: versioned manifests, promotion bundles, and change-notice-linked approvals.
2. Channel detection could split into spoofable or conflicting interpretations between server, client, and app shell. Fix: signed entry context, trust tiers, and safe downgrade dispositions.
3. `assertedLoginIdentity` arrives in the URL and could leak into logs, browser history, referrers, or analytics if it is not scrubbed immediately. Fix: single-redemption bridge grants, immediate URL redaction, no-store and no-referrer controls, and strict OIDC correlation checks.
4. The embedded runtime contract assumed JS API and byte-delivery features without negotiating actual capability or payload ceilings. Fix: versioned bridge capability matrices, route-scoped back-action leases, artifact byte grants, and governed fallbacks.
5. Limited release depended on telemetry but must define privacy-minimized event contracts or automatic cohort guardrails. Fix: governed telemetry schemas, rollout thresholds, kill switches, and freeze-on-anomaly rules.

## Additional NHS App channel priorities

The NHS App channel layer requires five corrections:

1. Embedded mode still described chrome suppression more clearly than shell-truth continuity, so route transitions could stay visually calm while silently drifting from the canonical patient shell contract. Fix: explicit embedded shell-consistency envelope, same-shell primitives, and stale-CTA freeze rules.
2. Manifest and deep-linkable route definitions must include governed partial-visibility metadata, so delayed-release, step-up-gated, or recovery-held routes could be omitted or over-exposed in embedded entry. Fix: route-level visibility, summary-safety, and placeholder contracts.
3. Bridge-driven exit paths were capability-gated but not destination-fenced, so overlay and external-browser launches could still leak PHI-bearing URLs or drift from the approved route contract. Fix: outbound-navigation grants with scrubbed URLs, allowlisted destinations, and return-path fences.
4. File handling still centered on byte transport rather than patient-safe presentation, which risks turning embedded document journeys into download-first detours instead of continuity-preserving summaries. Fix: summary-first artifact presentation contracts with in-shell preview and governed fallback.
5. Guardrail freezes and kill switches were operationally defined but not yet patient-facing route contracts, so a frozen cohort could degrade into confusing disappearance or generic failure. Fix: route-freeze dispositions bound to the same release tuple and manifest version as the monitored journey.

---

## 7A. Journey inventory, integration manifest, and onboarding pack

This sub-phase turns what we want to be in the NHS App into hard engineering scope.

The NHS App process is not just a technical hookup. Current guidance says the service must be patient-facing, personalised, free at the point of delivery, commissioned by an NHS body in England, NHS-login-enabled or approved for NHS login, and able to meet the NHS App standards. The expression-of-interest flow also asks for a public-facing service desk, a demo environment, recent user research, a recent WCAG 2.1 or 2.2 audit, and explicit confirmation that dedicated design and development capacity will be available during the integration. Treat all of that as Phase 7 input data, not as later procurement admin. ([NHS England Digital][1])

### Backend work

Create an `NHSAppIntegrationManifest` and make it the single source of truth for what Vecells exposes inside the NHS App.

Suggested objects:

**NHSAppIntegrationManifest**  
`manifestId`, `manifestVersion`, `baseUrlsByEnvironment`, `allowedJourneyPaths`, `jumpOffMappings`, `requiresNhsLogin`, `supportsEmbeddedMode`, `minimumBridgeCapabilitiesRef`, `telemetryContractRef`, `cohortRules`, `serviceDeskProfileRef`, `evidencePackRef`, `configFingerprint`, `releaseCandidateRef`, `releaseApprovalFreezeRef`, `behaviorContractSetRef`, `surfaceSchemaSetRef`, `compatibilityEvidenceRef`, `approvedAt`, `supersedesManifestId`, `changeNoticeRef`, `currentReleaseState`

**JourneyPathDefinition**  
`journeyPathId`, `routePattern`, `journeyType`, `requiresAuth`, `minimumAssuranceLevel`, `supportsResume`, `supportsDeepLink`, `embeddedReadinessState`, `minimumBridgeCapabilitiesRef`, `embeddedNavEligibilityContractRef`, `fallbackRoute`, `routeOwner`, `changeClass`, `channelFallbackBehaviour`, `shellConsistencyProfileRef`, `visibilityTierRef`, `summarySafetyTier`, `placeholderContractRef`, `requiresStepUpForFullDetail`, `continuityControlCode`, `continuityEvidenceContractRef`, `intakeConvergenceContractRef`, `outboundNavigationPolicyRef`, `artifactPresentationContractRef`, `routeFreezeDispositionRef`

**JumpOffMapping**  
`mappingId`, `nhsAppPlacement`, `odsVisibilityRule`, `journeyPathId`, `copyVariantRef`, `releaseCohortRef`

**IntegrationEvidencePack**  
`evidencePackId`, `demoEnvironmentUrl`, `uxAuditRefs`, `clinicalSafetyRefs`, `privacyRefs`, `SCALRefs`, `incidentRunbookRefs`

**ManifestPromotionBundle**
`bundleId`, `manifestVersion`, `environment`, `configFingerprint`, `releaseCandidateRef`, `releaseApprovalFreezeRef`, `behaviorContractSetRef`, `surfaceSchemaSetRef`, `compatibilityEvidenceRef`, `approvedBy`, `promotedAt`, `rollbackRef`

**NHSAppContinuityEvidenceBundle**
`bundleId`, `manifestVersionRef`, `journeyPathRef`, `continuityControlCode`, `governingContractRef`, `experienceContinuityEvidenceRefs[]`, `validationState = trusted | degraded | stale | blocked`, `blockingRefs[]`, `releaseApprovalFreezeRef`, `capturedAt`

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

Every promoted environment must point to an immutable `manifestVersion` plus `configFingerprint`. If Sandpit, AOS, limited release, or full release need different route exposure, create a superseding manifest and trace it through `JourneyChangeNotice`; do not hand-edit jump-off mappings in environment config.

NHS App route exposure is not a second release lane. Any manifest or jump-off change that alters patient-visible route behavior, embedded shell policy, or bridge-capability requirements must freeze against the same approved `ReleaseCandidate` tuple as the platform runtime. `releaseApprovalFreezeRef`, `behaviorContractSetRef`, `surfaceSchemaSetRef`, and `compatibilityEvidenceRef` must match the governing release records from `platform-runtime-and-release-blueprint.md` and `platform-admin-and-config-blueprint.md`; otherwise promotion fails closed.

Every `JourneyPathDefinition` must also declare how the route behaves when full visibility is not yet allowed. If a route can surface delayed-release records, step-up-gated actions, wrong-patient recovery, or other partial-visibility states, its `visibilityTierRef`, `summarySafetyTier`, and `placeholderContractRef` must be explicit in the manifest so embedded entry resolves to a governed placeholder and next step rather than a blank omission or over-broad body preview.

Every NHS App-enabled `JourneyPathDefinition` must also declare which continuity control it depends on and which `continuityEvidenceContractRef` proves that posture. `ManifestPromotionBundle` may not promote a journey unless the matching `NHSAppContinuityEvidenceBundle` validates the route's current `ExperienceContinuityControlEvidence` under the same manifest and frozen release tuple.

If a journey starts or resumes intake, `JourneyPathDefinition.intakeConvergenceContractRef` must point at the same Phase 0 `IntakeConvergenceContract` used by standalone browser entry. NHS App may change `surfaceChannelProfile = embedded`, bridge capability, and governed delivery posture, but it may not create a second intake payload shape, alternate promotion rule, or separate receipt or ETA grammar under the same route family.

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
- every manifest route declares minimum assurance, fallback route, supported bridge capabilities, and one route-scoped embedded eligibility contract
- unapproved routes cannot be launched from NHS App context
- promoted manifest fingerprints match runtime configuration in each environment
- promoted manifest tuples match the frozen release candidate, behavior contract, surface schema, and compatibility evidence set
- promoted journeys require a matching `NHSAppContinuityEvidenceBundle` with current `ExperienceContinuityControlEvidence` under the same manifest and frozen release tuple
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
`channelType`, `entryMode`, `trustTier`, `resolutionDisposition`, `isEmbedded`, `userAgentEvidence`, `queryEvidence`, `signedContextEvidence`, `assertedIdentityPresent`, `deepLinkPresent`, `jumpOffSource`, `channelConfidence`

**ChannelContextEvidence**
`evidenceId`, `source`, `observedAt`, `expiresAt`, `nonce`, `signatureState`, `requestedShell`, `expectedJourneyPath`, `cohortRef`

**EmbeddedEntryToken**  
`entryTokenId`, `journeyPathId`, `issuedAt`, `expiresAt`, `cohortRef`, `intendedChannel`, `contextClaims`

**ShellPolicy**  
`shellPolicyId`, `channelType`, `showHeader`, `showFooter`, `showBackLink`, `safeAreaInsetsMode`, `externalLinkMode`, `downloadMode`

**EmbeddedShellConsistencyProjection**
`consistencyId`, `journeyPathId`, `patientShellContinuityKey`, `entityContinuityKey`, `bundleVersion`, `audienceTier`, `governingObjectVersionRefs`, `selectedAnchorRef`, `returnContractRef`, `placeholderContractRefs[]`, `continuityEvidenceRefs[]`, `currentBridgeCapabilityMatrixRef`, `patientEmbeddedNavEligibilityRef`, `shellState = live | revalidate_only | recovery_only | blocked`, `computedAt`, `staleAt`, `causalConsistencyState`, `projectionTrustState`

**PatientEmbeddedNavEligibility**
`embeddedNavEligibilityId`, `journeyPathRef`, `routeFamilyRef`, `patientEmbeddedSessionProjectionRef`, `bridgeCapabilityMatrixRef`, `minimumBridgeCapabilitiesRef`, `requiredBridgeActionRefs[]`, `allowedBridgeActionRefs[]`, `fallbackActionRefs[]`, `routeFreezeDispositionRef`, `continuityEvidenceRef`, `eligibilityState = live | read_only | placeholder_only | safe_browser_handoff | recovery_required | blocked`, `evaluatedAt`

Use this resolution algorithm:

1. inspect signed `ChannelContextEvidence` or a previously issued `EmbeddedEntryToken` first if present
2. validate TTL, nonce, replay protection, expected route, and cohort binding
3. inspect whether the route arrived with a validated NHS App SSO assertion
4. inspect NHS App user-agent markers and client-side bridge detection
5. treat explicit query parameters like `from=nhsApp` as non-authoritative shell hints only
6. compute a `ChannelContext` with `trustTier` and `resolutionDisposition`
7. if the route is NHS App-enabled, negotiate the current `BridgeCapabilityMatrix`, materialize one `PatientEmbeddedNavEligibility` for the route family, and bind it into `EmbeddedShellConsistencyProjection`
8. attach `ShellPolicy` to the request and response model and emit context-resolution audit

Important: `ChannelContext` is for rendering and navigation policy. It must not become a shortcut around authentication or authorization.

Only signed server evidence or a successfully validated NHS App SSO handoff may elevate a request to `trusted_embedded`. Query hints may request embedded styling or recovery copy, but they must never enable privileged navigation, artifact delivery, or PHI-bearing route resolution on their own.

`EmbeddedShellConsistencyProjection` must also carry the active `NHSAppContinuityEvidenceBundle` refs for the current route family plus the active patient return contract. If embedded continuity evidence is stale, blocked, or degraded below the journey's allowed trust posture, the shell may preserve the selected anchor and safe placeholder copy, but it must not expose fresh bridge-backed mutation or file actions or reopen a fresh portal shell.

`PatientEmbeddedNavEligibility` is the route-scoped authority for embedded CTA exposure. Manifest validation, `PatientEmbeddedSessionProjection`, current `BridgeCapabilityMatrix`, continuity evidence, and `RouteFreezeDisposition` must all agree before embedded-only navigation, mutation, overlay, calendar, or file actions may render live. Components may not infer capability from user-agent strings, query hints, or raw bridge object presence.

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

Embedded mode is not a second shell law. When the same `entityContinuityKey` remains active, the NHS App entry must reuse the same `PersistentShell`, preserve `CasePulse`, the shared status strip implemented through `AmbientStateRibbon` plus `FreshnessChip`, the current `DecisionDock`, and any valid `SelectedAnchor`, and keep mutating CTAs frozen if the embedded route no longer shares the same `bundleVersion`, `audienceTier`, or governing-object version set as the shell consistency envelope.

When the same `patientShellContinuityKey` remains valid, embedded entry, refresh, deep-link recovery, and browser handoff return must also preserve the same patient return contract, any active `PatientActionRecoveryEnvelope`, and the last safe shell posture. Channel adaptation may change chrome and governed delivery options, but it may not fork a second patient shell or reset the patient to generic home while the same request, booking, record, or message lineage is still active.

Embedded alternative-offer routes must also preserve the active `AlternativeOfferSession.visibleOfferSetHash`, any selected `AlternativeOfferEntry`, and any `AlternativeOfferFallbackCard` as read-only provenance when session, manifest, bridge-capability, or publication posture drifts. Embedded recovery may regenerate the session in place, but it may not leave stale accept, decline, or callback controls armed.

### Tests that must pass before moving on

- channel detection is consistent across SSR and client hydration
- conflicting SSR, user-agent, and bridge signals fall back to a safe disposition rather than a split-brain shell
- spoofed query parameters cannot unlock privileged behaviour or `trusted_embedded` mode
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

High-priority SSO-bridge defects in this slice:

1. `SSOEntryGrant` is treated as single-redemption in prose only, but not yet fenced strongly enough to prevent overlapping browser retries or duplicate callback races
2. the bridge converts `assertedLoginIdentity`, but does not yet create a first-class proof that the asserted identity, returned NHS login claims, and resulting local subject binding all agree
3. session reuse and subject-conflict handling are policy-named, but not yet emitted as one deterministic merge decision that audit and support can inspect
4. known return outcomes such as silent success, consent denial, manifest drift, and bounded recovery are not normalized into one governed disposition contract
5. `AuthBridgeTransaction` verifies nonce and expiry, but it is not yet fenced against manifest supersession, bridge-capability drift, or stale embedded channel context before final redirect

Suggested objects:

**SSOEntryGrant**  
`entryGrantId`, `journeyPathId`, `assertedIdentityHash`, `requestHash`, `receivedAt`, `expiresAt`, `consumedAt`, `redactedAt`, `stateRef`, `returnIntentRef`, `consumptionFenceEpoch`, `originChannelRef`, `grantState = pending | consumed | superseded | expired | denied`

**AuthBridgeTransaction**  
`transactionId`, `entryGrantId`, `stateHash`, `nonceHash`, `codeVerifierRef`, `promptMode`, `responseMode`, `status`, `errorRef`, `completedAt`, `manifestVersionRef`, `bridgeCapabilityMatrixRef`, `contextFenceRef`, `transactionState = opened | awaiting_callback | callback_received | verified | recovery_required | denied`

**SessionMergePolicy**  
`policyId`, `existingSessionBehaviour`, `subjectMismatchBehaviour`, `draftClaimBehaviour`, `resumeIntentBehaviour`

**IdentityAssertionBinding**
`bindingId`, `entryGrantRef`, `assertedIdentityHash`, `nhsLoginSubjectRef`, `claimSetHash`, `localSubjectBindingRef`, `bindingState = matched | mismatched | repair_required | denied`, `evaluatedAt`

**SessionMergeDecision**
`mergeDecisionId`, `transactionRef`, `existingSessionRef`, `resolvedSessionRef`, `subjectComparisonState`, `draftClaimDisposition`, `resumeIntentDisposition`, `decision = reuse | rotate | terminate_and_reenter | deny`, `decidedAt`

**ReturnIntent**  
`returnIntentId`, `postAuthRoute`, `postAuthParams`, `embeddedState`, `fallbackAppPage`, `submissionEnvelopeRef`, `submissionPromotionRecordRef`, `draftLeaseRef`, `draftContinuityEvidenceRef`, `subjectRef`, `sessionEpochRef`, `subjectBindingVersionRef`, `manifestVersionRef`, `routeFamilyRef`, `minimumBridgeCapabilitiesRef`, `lineageFenceEpoch`, `releaseApprovalFreezeRef`, `continuityEvidenceRef`

**SSOReturnDisposition**
`returnDispositionId`, `transactionRef`, `outcome = silent_success | consent_denied | silent_failure | manifest_drift | context_drift | session_conflict | safe_reentry_required`, `patientRouteRef`, `appReturnTargetRef`, `copyVariantRef`, `allowRetry`, `evidenceRef`

Use this algorithm:

1. NHS App launches a journey URL with `assertedLoginIdentity`
2. the edge or auth gateway captures the parameter in server memory, hashes it, and immediately issues a redirect to the same route without the raw token in the URL
3. bridge creates `SSOEntryGrant` and `AuthBridgeTransaction`, arming one `consumptionFenceEpoch` for the first valid callback path only
4. bridge calls NHS login `/authorize` with `prompt=none` and the converted `asserted_login_identity`
5. bridge verifies state, nonce, PKCE, transaction expiry, and that `manifestVersionRef`, `bridgeCapabilityMatrixRef`, and `contextFenceRef` still match the approved embedded channel context on return
6. bridge creates `IdentityAssertionBinding`; if the asserted identity, returned NHS login subject, and local binding target do not agree, fail closed into repair or re-entry rather than silently merging
7. bridge handles silent success, silent failure, consent denial, manifest drift, or context drift through one `SSOReturnDisposition`
8. on success, create or refresh local Vecells session and emit one `SessionMergeDecision`
9. merge or claim any in-flight draft or status journey only after `SessionMergeDecision.decision = reuse | rotate`
10. if `ReturnIntent` targets draft resume, verify the same `SubmissionEnvelope` is still unpromoted, the pinned `draftLeaseRef` is still reacquirable, and `draftContinuityEvidenceRef` still validates writable resume under the current embedded manifest, session, subject binding, and bridge-capability posture; if `submissionPromotionRecordRef` now exists, invalidate draft mutation and switch to the mapped request shell or bounded recovery
11. before redirecting, verify the local session `subjectRef`, `sessionEpoch`, `subjectBindingVersion`, promoted `manifestVersion`, `routeFamilyRef`, route `minimumBridgeCapabilitiesRef`, current `PatientEmbeddedNavEligibility`, and bound `continuityEvidenceRef` still match the `ReturnIntent`; if any fence drifted, invalidate the intent and switch to bounded recovery
12. redirect into the intended route in embedded mode, or route through the `SSOReturnDisposition` recovery path when the bridge outcome is not a clean silent success

If an existing local session is already present and maps to the same user, reuse it through `SessionMergeDecision`. If the subject conflicts, end the old session and force a clean re-entry; do not keep a mixed or ambiguous embedded session alive.

Any endpoint that can receive `assertedLoginIdentity` must send `Cache-Control: no-store`, suppress referrers, and exclude the raw query string from access logs, tracing spans, analytics, and replay tooling. `SSOEntryGrant` is single-redemption under `consumptionFenceEpoch`; replay, parallel callback, late return, or duplicate browser retry must fail closed and emit a safe `SSOReturnDisposition`.

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

- `assertedLoginIdentity` is never written to logs, analytics, referrers, or browser history after initial capture
- `prompt=none` silent-auth path works
- `ConsentNotGiven` route is handled and returns the user safely
- state, nonce, PKCE, and transaction-expiry checks fail closed
- replayed or late `SSOEntryGrant` values are denied safely
- overlapping callback-race tests prove only one `consumptionFenceEpoch` can settle
- `IdentityAssertionBinding` mismatch tests deny silent session merge
- session mismatch and subject switch are safe
- `SessionMergeDecision` audit and decision outcomes are deterministic
- stale `ReturnIntent` values caused by session-epoch, subject-binding, or manifest drift are denied safely
- stale draft-resume `ReturnIntent` values cannot reopen a lineage that already has `SubmissionPromotionRecord`
- `SSOReturnDisposition` coverage exists for silent success, consent denial, manifest drift, context drift, and safe re-entry
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

Route metadata such as target route, journey step, and shell hints may exist as launch metadata, but scope, PHI exposure, redemption-budget enforcement, subject binding, rotation, and revocation must remain owned by `AccessGrantService`.

Suggested objects:

**SiteLinkManifest**  
`manifestId`, `androidAssetLinksRef`, `iosAssociationRef`, `allowedPathPatterns`, `environmentMappings`

**LinkResolutionAudit**  
`resolutionId`, `incomingPath`, `channelDetected`, `embeddedState`, `subjectLinked`, `manifestVersionRef`, `routeFamilyRef`, `sessionEpochRef`, `grantFenceState`, `resolutionOutcome`

Use this algorithm:

1. define all deep-linkable patient routes and the minimum assurance level each route requires
2. ask `AccessGrantService` to issue the correct canonical `AccessGrant` with limited TTL, narrow scope, and explicit subject binding where required
3. when the link opens, validate the grant state, TTL, redemption budget, supersession state, token-key posture, and binding requirements before any patient-specific route is resolved
4. establish or recover the user session
5. if launch metadata or `ReturnIntent` is present, verify `sessionEpochRef`, `subjectBindingVersionRef`, `manifestVersionRef`, and `routeFamilyRef` before route resolution; on drift, invalidate the resume path and restart in bounded recovery
6. if the target starts or resumes intake, bind or refresh the active `SubmissionIngressRecord` under the route's `intakeConvergenceContractRef`; NHS App launch may set `surfaceChannelProfile = embedded`, but it may not create `nhs_app`-specific field semantics, promotion logic, duplicate thresholds, or receipt posture
7. if the target is pre-submit resume, verify the `SubmissionEnvelope` is still unpromoted and `DraftContinuityEvidenceProjection` still validates the same lineage under the recovered embedded posture; if a promotion record now exists, route to the mapped request shell or bounded recovery instead of reopening draft mutation
8. if the canonical grant is subject-bound, compare the live session `subjectRef` with the bound `subjectRef`; on mismatch, deny route resolution, audit the mismatch, and send the user to a safe recovery route with no PHI exposure
9. if the route requires verified claim or stronger assurance, force that step before resolving to a PHI-bearing screen
10. only after grant checks, subject binding, assurance checks, and any draft-promotion fence checks pass resolve the link into the correct route, session, and shell
11. consume, rotate, or revoke the canonical grant through `AccessGrantService` according to policy
12. audit the resolution outcome

A canonical grant without a bound subject may only point to a route that reveals no patient-specific content until later verification succeeds.

If route resolution proves the patient may enter only at summary or recovery tier, do not fail to a generic home redirect. Resolve into the owning shell using the route's governed `placeholderContractRef` and `summarySafetyTier`, preserve the return path, and show the safest next step for step-up, release wait, or identity repair inside that same continuity envelope.

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
- replayed or over-redeemed grants are rejected safely
- email and SMS links open in app when configured and in browser when not
- link resolution preserves patient ownership and route scope
- stale manifest, route-family, or session-epoch resume metadata cannot reopen a superseded journey
- pre-submit resume links cannot reopen a promoted envelope as a second mutable draft
- no cross-patient access is possible through stale or shared links

### Exit state

Vecells can now reopen the right patient journey from external communications in a way that feels continuous inside the NHS App.

---

## 7E. NHS App bridge API, navigation model, and embedded behaviours

This sub-phase gives the UI a safe abstraction over NHS App-specific browser behaviour.

Published NHS App developer guidance says the embedded page can use the NHS App JS API for native-ish behaviours, and the published reference shows capabilities such as detecting whether the page is inside the app, overriding native back behaviour, navigating to app pages or the home page, opening browser overlays or the external browser, adding to calendar, and downloading files from bytes. The current JS API v2 specification also says new integrations should use v2, load the script inline, and append a query suffix when adopting newer functionality because the script can be cached for up to 1 year. That is why Vecells should wrap the current NHS App JS API behind its own bridge instead of spreading vendor calls across the component tree. ([NHS Connect][7])

### Backend work

Keep the backend largely channel-neutral here, but define route metadata that the frontend bridge can consume.

Suggested objects:

**NavigationContract**  
`routeId`, `routeFamilyRef`, `backBehaviour`, `preferredExitDestination`, `requiredBridgeCapabilities`, `patientEmbeddedNavEligibilityRef`, `routeFreezeDispositionRef`, `allowsExternalBrowser`, `allowsBrowserOverlay`, `calendarSupport`, `downloadSupport`, `maxDownloadBytes`

**AppPageIntent**  
`intentId`, `appDestination`, `reason`, `issuedAt`, `routeOrigin`

**NHSAppBridge**
`bridgeId`, `channelContextRef`, `bridgeCapabilityMatrixRef`, `patientEmbeddedSessionProjectionRef`, `patientEmbeddedNavEligibilityRef`, `scriptUrl`, `scriptVersionHint`, `bridgeState = unavailable | negotiating | active | degraded | frozen | recovery`, `lastNegotiatedAt`

**BridgeCapabilityMatrix**
`matrixId`, `platform`, `detectedApiVersion`, `manifestVersionRef`, `contextFenceRef`, `scriptUrl`, `scriptVersionHint`, `supportedMethods`, `maxByteDownloadSize`, `supportsGoBack`, `capabilityState = verified | stale | mismatched | unavailable`, `checkedAt`

**BridgeActionLease**
`leaseId`, `routeId`, `actionType`, `manifestVersionRef`, `routeFamilyRef`, `sessionEpochRef`, `lineageFenceEpoch`, `selectedAnchorRef`, `bridgeCapabilityMatrixRef`, `patientEmbeddedNavEligibilityRef`, `continuityEvidenceRef`, `installedAt`, `expiresAt`, `clearedAt`, `ownerRef`, `leaseState = active | stale | cleared | blocked`

**OutboundNavigationGrant**
Use the canonical `OutboundNavigationGrant` from Phase 0. In embedded mode the live grant must also stay bound to `bridgeCapabilityMatrixRef`, `patientEmbeddedNavEligibilityRef`, and the selected anchor so the same route family, manifest version, session epoch, lineage fence, scrubbed destination, and return contract govern any app-page, overlay, or external-browser handoff.

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

Load the JS API inline, not through the main application bundle. On bootstrap, `NHSAppBridge` must negotiate a `BridgeCapabilityMatrix`, materialize the current `PatientEmbeddedNavEligibility`, and expose only capabilities that are actually present at runtime and allowed for the current route. When Vecells begins using newer NHS App JS API functionality, bump the script query suffix and keep older capability paths available until runtime checks prove the feature exists.

Back actions must be installed through `BridgeActionLease` and cleared on route exit or shell transition so stale callbacks cannot leak across soft navigation.

A bridge lease is valid only while the same route family, `manifestVersion`, `sessionEpoch`, lineage fence, `BridgeCapabilityMatrix`, `PatientEmbeddedNavEligibility`, and `continuityEvidenceRef` remain current. If any of those fences drift, the bridge must clear native back handling immediately, keep the patient in the same shell, and reopen the safest in-place recovery route instead of reusing a callback from a superseded journey contract.

Except for `isEmbedded()`, no bridge method may execute from user-agent heuristics, raw bridge object presence, or component-local assumptions. `setBackAction()`, `goHome()`, `goToAppPage()`, `openOverlay()`, `openExternal()`, `addToCalendar()`, and `downloadBytes()` must first prove the current `PatientEmbeddedNavEligibility.eligibilityState = live` or the allowed degraded state for that method.

`openOverlay()`, `openExternal()`, and cross-app navigation may not launch directly from component URLs alone. They must require both runtime bridge capability and a short-lived `OutboundNavigationGrant` bound to the same manifest, route family, session epoch, lineage fence, and `PatientEmbeddedNavEligibility` as the active route. The grant must carry a scrubbed destination with PHI-bearing query parameters removed, restrict destination host and path to the allowlisted policy for that journey, and preserve an explicit return route so the patient can re-enter safely.

Use it for real user value:

- set back behaviour on step flows
- send patients back to the safest NHS App page after auth or error states
- add appointments to device calendar from manage and confirmation pages
- download letters or PDFs in webview-safe form
- open external information only when it truly belongs outside the current journey

### Tests that must pass before moving on

- app bridge no-ops safely outside NHS App
- runtime capability matrix is recorded before feature use
- route-scoped `PatientEmbeddedNavEligibility` is recorded before any bridge-backed action renders live
- native back behaviour is deterministic per route
- stale back-action leases are cleared on soft navigation and re-entry
- stale bridge leases caused by manifest or session drift cannot send the patient to an invalid embedded destination
- bridge-backed actions remain blocked when capability is inferred only from user-agent hints or raw bridge presence
- cached older JS API builds degrade gracefully instead of breaking route behaviour
- add-to-calendar works for appointments and is absent where unsupported
- no direct raw NHS App JS API calls leak into route components
- app exit and re-entry do not corrupt route state
- PHI-bearing outbound URLs cannot be launched to overlay or external browser
- stale or mismatched `OutboundNavigationGrant` values fail closed and reopen a bounded in-shell recovery route

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
`artifactId`, `artifactType`, `artifactSurfaceContextRef`, `artifactModeTruthProjectionRef`, `deliveryMode = byte_download | overlay_handoff | external_browser | secure_send_later`, `byteGrantRef`, `mimeType`, `filename`, `contentLengthBytes`, `checksum`, `cachePolicy`, `watermarkMode`, `ttl`, `accessScope`, `channelProfile = embedded | browser | constrained_browser`, `selectedAnchorRef`, `returnContractRef`, `deliveryState = prepared | bridge_ready | transferred | returned | expired | blocked`, `deliveryTupleHash`

**ArtifactByteGrant**
`grantId`, `artifactId`, `artifactSurfaceContextRef`, `artifactModeTruthProjectionRef`, `bridgeCapabilityMatrixRef`, `patientEmbeddedNavEligibilityRef`, `selectedAnchorRef`, `returnContractRef`, `expiresAt`, `maxDownloads`, `maxBytes`, `subjectBindingMode`, `issuedBy`, `grantState = issued | redeemed | expired | superseded | blocked`, `tupleHash`

**ArtifactPresentationContract**
Use the canonical `ArtifactPresentationContract` from Phase 0 and `platform-frontend-blueprint.md`. NHS App-specific delivery may only narrow that contract further through `BridgeCapabilityMatrix`, `ArtifactByteGrant`, `PatientEmbeddedNavEligibility`, and embedded print or size ceilings; it may never widen preview, byte delivery, or external handoff posture beyond the current summary-safety, visibility, and continuity fences.

**EmbeddedErrorContract**  
`errorCode`, `category`, `retryMode`, `preferredExit`, `patientMessageRef`, `supportCode`

**ChannelDegradedMode**  
`modeId`, `patientDegradedModeProjectionRef`, `routeFreezeDispositionRef`, `releaseRecoveryDispositionRef`, `affectedRoutes`, `copyVariant = read_only | placeholder_only | bounded_recovery | safe_browser_handoff | identity_hold`, `fallbackBehaviour`, `noticeCopyRef`, `primaryActionRef`, `supportCodeRef`, `activationRule`, `killSwitchRef`, `activatedAt`

`ChannelDegradedMode` is an embedded-copy adapter only. It narrows wording and support guidance for the already-resolved `PatientDegradedModeProjection`; it may not invent a second NHS-App-only steady state or widen actionability outside the bound `RouteFreezeDisposition` and `ReleaseRecoveryDisposition`.

Implement these policies:

- patient-visible records, letters, confirmations, and instruction artifacts should prefer structured in-shell summary presentation first whenever policy allows, using the same `ArtifactSurfaceFrame`, parity state, and fallback semantics as standard web
- every embedded patient route must resolve one current `PatientDegradedModeProjection` bound to `PatientEmbeddedSessionProjection`, `PatientEmbeddedNavEligibility`, `ReleaseRecoveryDisposition`, `RouteFreezeDisposition`, any applicable `PatientActionRecoveryProjection` or `PatientIdentityHoldProjection`, the current `WritableEligibilityFence`, and any active `ArtifactFallbackDisposition` before live CTA or reassuring status copy remains visible
- every embedded artifact route must resolve one current `ArtifactModeTruthProjection` bound to `BridgeCapabilityMatrix`, `PatientEmbeddedNavEligibility`, `BinaryArtifactDelivery`, `ArtifactByteGrant`, selected anchor, and return-safe continuity before richer preview, byte delivery, or external handoff remains live
- PDFs and similar assets are pre-rendered and delivered through single-redemption `ArtifactByteGrant`s where needed
- byte delivery enforces platform-specific size ceilings from `BridgeCapabilityMatrix` and falls back before attempting an unsupported download; oversized or bridge-ineligible artifacts must degrade to `secure_send_later | safe_browser_handoff | recovery_required` on the same `ArtifactModeTruthProjection` rather than probing browser behavior
- print-dependent journeys are replaced by download, share, or we-will-send-this-another-way
- auth and link failures map to friendly error contracts, not raw exceptions
- degraded-mode banners may be channel-specific and route-specific only as copy variants over the current `PatientDegradedModeProjection`; they may not hide the current anchor, widen the audience tier, or invent a calmer state than the shared degraded truth allows
- no PHI-bearing artifact may be cached in shared browser storage or left available through stale download links
- if a route grants only summary visibility, the shell must render the governed summary or placeholder defined by `ArtifactPresentationContract`; it may not synthesize a full artifact body preview or silently hide the artifact
- preview surfaces may not imply full-fidelity source truth after parity, grant validity, or channel viability drifts; if `ArtifactModeTruthProjection.previewTruthState != preview_ready`, the shell must keep the last safe summary visible and explicitly mark preview as provisional, blocked, or recovery-only
- any embedded download, share, overlay, or external handoff must materialize one `ArtifactTransferSettlement`; local bridge acknowledgement is provisional until authoritative availability, return, or `ArtifactFallbackDisposition` is known, and the same `PatientDegradedModeProjection` still validates return posture

### Frontend work

Build NHS App-specific error and recovery screens for:

- invalid or missing SSO handoff
- expired link
- lost session
- channel unavailable
- file unavailable
- unsupported action in app context

These pages should be visually simple and highly directive. One primary action. One clear recovery route. No technical jargon.

Each screen must preserve the last safe summary, the current section or anchor label where policy allows, and the one next safe action already selected by `PatientDegradedModeProjection`; embedded error copy may clarify channel constraints, but it may not fall back to generic maintenance language or contradictory calm reassurance.

For downloads, treat documents as a deliberate action with progress and completion states, not as a surprise browser event.

If a document is too large or unsupported in-app, offer one governed fallback: secure send later, open outside the app only if policy allows, or a visible support recovery path. Never leave the patient on a dead-end error.

Artifact presentation should preserve continuity. Inline summaries, delayed-release placeholders, oversized-file fallback, and byte-download progress must all stay in the same patient shell with the active card or document anchor preserved rather than ejecting the user into a detached browser-like document page.

Embedded artifact routes must also preserve one return-safe tuple: the same selected anchor, patient return contract, masking posture, `ArtifactModeTruthProjection.truthTupleHash`, `PatientDegradedModeProjection.truthTupleHash`, and `PatientEmbeddedNavEligibility` that armed preview or transfer must still be current when the patient returns. If any of those drift, the shell must reopen the last safe summary or placeholder in place instead of resuming the old artifact mode as if continuity were still clean.

### Tests that must pass before moving on

- document downloads work inside NHS App and standard web within configured size ceilings
- `ArtifactModeTruthProjection` gates preview, byte delivery, secure-send-later fallback, and safe browser handoff under embedded size and capability constraints
- oversized or unsupported artifacts take a governed fallback path rather than failing in place
- print-dependent journeys have no dead-end behaviour
- embedded error pages always provide a clear next step
- missing or malformed context never results in a white screen
- degraded mode can be toggled without redeploy
- stale artifact grants and stale download links are rejected safely
- provisional parity, stale return tuple, or bridge-capability drift cannot leave richer preview or byte-download posture live
- every user-facing error copy passes content and accessibility review
- structured artifact summary or governed placeholder is available before byte-delivery for every supported patient-visible document route

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
- every embedded route family must still declare `AccessibleSurfaceContract`, `KeyboardInteractionContract`, `FocusTransitionContract`, `AssistiveAnnouncementContract`, `TimeoutRecoveryContract`, and `FreshnessAccessibilityContract`
- every embedded route family must also publish one `AccessibilitySemanticCoverageProfile` bound to the current `AutomationAnchorProfile`, `SurfaceStateSemanticsProfile`, and `DesignContractPublicationBundle`; host resize, safe-area changes, capability downgrade, reduced motion, and reconnect buffering are blocked modes unless that same profile still evaluates to `complete`
- embedded bridge reconnect, host return, capability downgrade, and queue flush must resolve through one `AssistiveAnnouncementTruthProjection` bound to the current `UIEventEmissionCheckpoint`; the webview may emit one current-state summary, but it may not replay historical local acknowledgements, download starts, or handoff toasts as fresh activity
- embedded error, timeout, and step-up recovery copy must preserve the same-shell summary, current return path, and one clear next action before any secondary help
- any embedded chart, trend, or heat surface must implement `VisualizationFallbackContract`, `VisualizationTableContract`, and `VisualizationParityProjection`; the webview may not become a chart-only surface, and bridge or freshness drift must degrade in place to table-first, summary-only, or placeholder posture rather than leaving extra meaning in the visual alone

This is also where the sleek minimalistic design requirement becomes final rather than aspirational. The pages should feel premium and quiet, but that polish must come from hierarchy, spacing, wording, and flow discipline, not from decorative UI.

### Tests that must pass before moving on

- external accessibility audit is complete and findings are triaged
- automated, manual, and screen-reader checks all run in CI and release gates
- embedded restore, bridge reconnect, and host-return tests prove announcement dedupe, batching, and urgency remain stable across replay and capability drift
- mobile viewport matrix is green for all embedded journeys
- focus is never obscured by sticky elements or app navigation
- standalone and embedded experiences both pass keyboard-only navigation
- content has recent user research evidence and a recent accessibility audit outcome ready for the NHS App process
- embedded error summaries, timeout recovery, and step-up expiry prove same-shell return posture and preserved draft or context where policy allows
- embedded charts and summaries prove `VisualizationFallbackContract` parity, with explicit units, non-colour cues, and table-first fallback

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
`environment`, `baseUrl`, `journeyPaths`, `ssoConfigRef`, `siteLinkConfigRef`, `telemetryNamespace`, `allowedCohorts`, `releaseCandidateRef`, `releaseApprovalFreezeRef`, `behaviorContractSetRef`, `surfaceSchemaSetRef`, `compatibilityEvidenceRef`, `watchTupleHash`, `guardrailPolicyRef`, `stabilizationCriteriaRef`

**IntegrationDemoDataset**  
`datasetId`, `journeyCoverage`, `syntheticPatients`, `syntheticRequests`, `syntheticAppointments`, `syntheticPharmacyCases`

**ChannelTelemetryPlan**  
`planId`, `trackedJourneys`, `eventContractRefs`, `successMetrics`, `failureMetrics`, `dropOffMetrics`, `alertThresholdRefs`, `monthlyPackMappings`, `cohortBreakdowns`

**TelemetryEventContract**
`contractId`, `eventName`, `allowedFields`, `prohibitedFields`, `pseudonymousJoinKey`, `retentionClass`, `monthlyPackFieldMap`

**SCALBundle**  
`bundleId`, `environment`, `evidenceRefs`, `owner`, `submissionState`

Every environment profile must point to the promoted `manifestVersion`, `configFingerprint`, and telemetry contract set. Sandpit, AOS, and live are not allowed to drift silently.

Environment packs must also pin the same `releaseApprovalFreezeRef`, `behaviorContractSetRef`, `surfaceSchemaSetRef`, and `compatibilityEvidenceRef` carried by the promoted manifest. NHS App rollout is blocked if environment config, embedded route exposure, and runtime release approval no longer describe the same patient-visible contract.

Build this release path:

1. deploy NHS App embed build to Sandpit profile pinned to a `ManifestPromotionBundle`
2. validate telemetry redaction and journey event contracts
3. run demo-checklist automation
4. run manual demo and fix actions
5. repeat in AOS profile with the same manifest fingerprint or an explicit superseding version
6. complete incident rehearsal
7. submit SCAL evidence bundle
8. lock release configuration and kill switches
9. prepare limited release cohorts

### Frontend work

Maintain a real demo environment, not a half-working preview. The NHS App process explicitly reviews the product based on a demo environment, so the demo needs seeded request, booking, waitlist, and pharmacy journeys that are stable enough to show live. The same integration flow also expects a delivery plan and implementation approach, so the UI team needs environment-ready toggles, seeded copy, and controlled test accounts. ([NHS England Digital][1])

### Tests that must pass before moving on

- Sandpit sign-off checklist is green
- AOS sign-off checklist is green
- incident rehearsal completes with documented actions
- SCAL evidence pack is complete, current, and internally approved
- demo environment is stable for repeated walkthroughs
- telemetry events match the agreed journey inventory and privacy contract and are validated before limited release
- promoted manifest fingerprints match environment profiles in Sandpit and AOS

### Exit state

The phase is now not just technically built but operationally packaged for NHS App approval and release.

---

## 7I. Limited release, post-live governance, and formal exit gate

This sub-phase turns the integration into a controlled live service.

The NHS App process says suppliers begin with a limited release to a sample cohort, then move to full release with the NHS App team. Post go-live, suppliers must provide monthly data, attend annual assurance reviews with NHS App and NHS login together, and notify their integration manager about user-journey changes. The current guidance also says to allow around 1 month for minor journey changes such as jump-off content and at least 3 months for significant changes or new journeys because those require planning and product assessment. ([NHS England Digital][6])

### Backend work

Create controlled release objects:

**ChannelReleaseCohort**  
`cohortId`, `odsRules`, `patientPopulationRules`, `enabledJourneys`, `releaseStage`, `guardrailPolicyRef`, `killSwitchRef`, `startAt`, `endAt`

**NHSAppPerformancePack**  
`packId`, `period`, `journeyUsage`, `completionRates`, `dropOffs`, `guardrailBreaches`, `incidentSummary`, `accessibilityIssues`, `safetyIssues`

**JourneyChangeNotice**  
`noticeId`, `changeType`, `affectedJourneys`, `manifestVersion`, `leadTimeRequired`, `submittedAt`, `approvalState`

**ReleaseGuardrailPolicy**
`policyId`, `minimumSampleSize`, `maxAuthFailureRate`, `maxJourneyErrorRate`, `maxDownloadFailureRate`, `maxSupportContactRate`, `freezeDuration`, `rollbackAction`

**ChannelReleaseFreezeRecord**
`freezeRecordId`, `manifestVersionRef`, `releaseApprovalFreezeRef`, `cohortRef`, `journeyPathRefs[]`, `triggerType = telemetry_missing | threshold_breach | assurance_slice_degraded | compatibility_drift | continuity_evidence_degraded`, `assuranceSliceTrustRefs[]`, `continuityEvidenceRefs[]`, `freezeState = monitoring | frozen | kill_switch_active | rollback_recommended | released`, `openedAt`, `releasedAt`, `operatorNoteRef`

**RouteFreezeDisposition**
`dispositionId`, `journeyPathRef`, `manifestVersionRef`, `releaseApprovalFreezeRef`, `freezeMode = hidden | read_only | placeholder_only | redirect_to_safe_route`, `patientMessageRef`, `safeRouteRef`, `supportRecoveryRef`, `activatedAt`, `releasedAt`

Use this go-live algorithm:

1. enable a small controlled cohort under `ReleaseGuardrailPolicy`
2. validate auth success, route resolution, bridge failures, artifact failures, error rates, and the governing `AssuranceSliceTrustRecord` rows for NHS App telemetry, SSO, and artifact delivery using privacy-safe telemetry only
3. if telemetry is missing, any required slice trust is `degraded` or `quarantined`, compatibility evidence drifts, route continuity evidence is stale or blocked, or thresholds are breached, open `ChannelReleaseFreezeRecord`, freeze cohort expansion, and activate the route or cohort kill switch without redeploy
4. when a route or cohort is frozen, apply the journey's governed `RouteFreezeDisposition` under the same `manifestVersionRef` and `releaseApprovalFreezeRef` so entry degrades to read-only, placeholder, or safe-route recovery instead of disappearing silently
5. expand to wider cohorts only after a sustained green window, released freeze record, and explicit approval
6. begin monthly data pack generation automatically from the same governed event contracts
7. lock major route changes behind a change-notice process tied to `manifestVersion`
8. preserve replayable audit for every live channel decision

### Frontend work

For limited release, the patient-facing experience must already look final. Do not ship temporary embedded pages into a live national channel. Use cohort flags to control exposure, not quality.

Also harden support and operations views so you can answer questions like:

- which jump-off route the patient used
- whether they came from NHS App or standalone web
- whether silent SSO succeeded
- where they dropped out
- what the user saw on error

If a release guardrail freezes an affected route, the patient-facing surface must stay honest and bounded. Embedded entry may resolve to a safe placeholder, read-only status view, or explicit redirect to a still-supported route, but it must preserve the journey explanation, hide no clinically relevant state, and never pretend the feature is healthy when the active cohort is frozen.

### Tests that must all pass before Phase 8

- no Sev-1 or Sev-2 defects in embedded auth, start-request, status, booking, or pharmacy flows
- limited release cohort gating is correct and reversible
- every supported patient journey works in standalone web and embedded mode
- NHS App-specific downloads and navigation actions are stable
- full audit trail exists for entry, auth, route resolution, and exit
- telemetry contains no raw JWTs, grant identifiers, or PHI-bearing query strings
- monthly data pack generation works automatically from validated event contracts
- guardrail breaches freeze rollout and kill switches work without redeploy
- degraded or quarantined assurance slices freeze cohort expansion even when coarse aggregate success metrics still look green
- active route freezes render the governed `RouteFreezeDisposition` rather than a generic error or silent route disappearance
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
[7]: https://nhsconnect.github.io/nhsapp-developer-documentation/js-v2-api-specification/ "Javascript API v2 Specification"
