# Phase 2 - Identity and Echoes

**Working scope**  
Real patient identity, session control, and telephony parity.

## Phase 2 implementation rules

**Rule 1: never collapse identity into a boolean.**  
Persist the raw NHS login assurance signal and a normalized internal capability band. NHS guidance expects assurance and verification to be chosen based on product features, and it distinguishes medium verification from high verification rather than treating all signed-in users as equivalent. ([NHS England Digital][4])

**Rule 2: contact provenance matters.**  
Keep three separate sources of patient-contact truth: NHS login contact claims, patient-chosen communication preferences, and PDS or GP demographic details. NHS guidance is explicit that NHS login contact details are not linked to PDS or GP-system contact data, and the same phone number can be used on more than one NHS login. ([NHS England Digital][4])

**Rule 3: telephony parity does not mean telephony sameness.**  
Phone capture can have lower or different identity confidence than web sign-in, but it still has to produce the same canonical request object and go through the same safeguard gate and queue model. That is exactly what the intake flow requires.

**Rule 4: Phase 1 must survive this phase.**  
Do not rip out the anonymous Phase 1 intake on day one. Introduce identity as an upgrade path first, then move toward signed-in-first once the flows and telemetry are stable.

**Rule 5: keep IM1 out of the critical path for this phase.**  
Unless there is already a live IM1 patient-facing connection, do not make the identity flow depend on IM1 linkage-key retrieval. NHS guidance explicitly constrains that path. ([NHS England Digital][4])

---

## 2A. Trust contract and capability gates

This sub-phase defines the new control model for the whole product.

**Backend work**

Add a new identity kernel to the domain model. Do not bolt identity onto request metadata ad hoc.

High-priority trust gaps in this layer:

1. add a single immutable capability-decision record so route handlers, workers, and telephony flows cannot derive access differently
2. replace the loose capability description with a deterministic fail-closed evaluation pipeline and canonical route profile registry
3. make session privilege changes explicit so upgrades, downgrades, and revocations cannot drift or linger
4. harden the SMS continuation handoff into a single-redemption bounded grant instead of a generic signed link
5. move raw identity evidence out of hot operational records and event payloads so the trust layer is auditable without leaking sensitive data

Create these domain objects:

**IdentityContext**  
`identitySource`, `authProvider`, `authLevelRaw`, `verificationLevelRaw`, `capabilityBand`, `nhsLoginSubject`, `nhsNumberHash`, `gpOdsCode`, `contactClaimRefs`, `matchingStatus`, `patientLinkRef`, `identityBindingRef`, `bindingDecisionClass`, `matchConfidence`, `matchConfidenceLowerBound`, `subjectProofLowerBound`, `confidenceModelState = calibrated | drift_review | out_of_domain`, `bindingVersion`, `ownershipState`, `ageGateState`, `restrictionReasonCodes`, `decisionRef`, `policyVersion`, `lastVerifiedAt`

**IdentityEvidenceEnvelope**
Encrypted, append-only storage for raw identity claims, telephony-captured identifiers, consent artifacts, and evidence provenance. Operational tables and events keep references, hashes, or masked fragments only.

**CapabilityDecision**
`decisionId`, `subjectRef`, `patientLinkRef`, `identityBindingRef`, `routeProfileRef`, `policyVersion`, `capabilitySet`, `capabilityCeiling`, `decisionState = allow | step_up_required | recover_only | deny`, `trustFloor`, `freshnessScore`, `riskUpperBound`, `reasonCodes`, `evaluatedAt`, `expiresAt`, `identityEvidenceRefs`, `linkState`, `ageGateState`, `manualOverrideRef`, `bindingVersionRef`

**PatientLink**  
`patientLinkId`, `subjectRef`, `patientRef`, `identityBindingRef`, `linkState`, `linkProbability`, `linkProbabilityLowerBound`, `runnerUpProbabilityUpperBound`, `subjectProofProbabilityLowerBound`, `gapLogit`, `calibrationVersionRef`, `confidenceModelState = calibrated | drift_review | out_of_domain`, `bindingVersionRef`, `provenanceRef`, `evaluatedAt`, `expiresAt`

**Session**  
`sessionId`, `subjectRef`, `patientLinkRef`, `identityBindingRef`, `issuedAt`, `lastSeenAt`, `authTime`, `idleExpiresAt`, `absoluteExpiresAt`, `sessionState = establishing | active | step_up_required | restricted | recovery_only | revoked | expired_idle | expired_absolute | terminated`, `assuranceBand`, `decisionRef`, `establishmentDecisionRef`, `activeReturnIntentRef`, `routeAuthorityState = none | auth_read_only | claim_pending | writable`, `sessionEpoch`, `subjectBindingVersion`, `riskUpperBound`, `cookieKeyVersionRef`, `reauthRequiredAt`, `revokedAt`, `revocationReason`, `csrfSecret`, `deviceContext`

**CallSession**  
`callSessionId`, `vendorCallId`, `menuSelection`, `verificationState`, `capturedIdentifierRefs`, `recordingRefs`, `recordingAvailabilityState = expected | available | fetched | quarantined | verified | missing | expired`, `urgentLiveAssessmentRef`, `transcriptReadinessRef`, `evidenceReadinessRef`, `manualReviewDispositionRef`, `continuationEligibilityRef`, `evidenceState`, `capabilityCeiling`, `continuationContextRef`, `continuationAccessGrantRef`, `requestSeedRef`, `latestSubmissionIngressRef`, `callState`

**TelephonyUrgentLiveAssessment**
`telephonyUrgentLiveAssessmentId`, `callSessionRef`, `signalRefs[]`, `signalSourceClasses[] = ivr_selection | spoken_phrase | staff_observation | live_rule`, `assessmentOutcome = none | suspected | urgent_live_required`, `preemptionRef`, `assessmentState = open | preempted | cleared | superseded`, `assessedAt`

**TelephonyTranscriptReadinessRecord**
`telephonyTranscriptReadinessRecordId`, `callSessionRef`, `recordingArtifactRef`, `transcriptJobRef`, `transcriptState = not_started | queued | running | partial | ready | failed | superseded`, `coverageClass = none | keyword_only | partial_utterance | clinically_sufficient`, `qualityBand = unknown | low | medium | high`, `derivedFactsPackageRef`, `blockingReasonCodes[]`, `checkedAt`

**TelephonyEvidenceReadinessAssessment**
`telephonyEvidenceReadinessAssessmentId`, `callSessionRef`, `submissionEnvelopeRef`, `urgentLiveAssessmentRef`, `transcriptReadinessRef`, `structuredCaptureRefs[]`, `identityEvidenceRefs[]`, `contactRouteEvidenceRefs[]`, `manualReviewDispositionRef`, `continuationEligibilityRef`, `usabilityState = awaiting_recording | awaiting_transcript | awaiting_structured_capture | urgent_live_only | safety_usable | manual_review_only | unusable_terminal`, `promotionReadiness = blocked | continuation_only | ready_to_seed | ready_to_promote`, `reasonCodes[]`, `assessedAt`

**TelephonyContinuationEligibility**
`telephonyContinuationEligibilityId`, `callSessionRef`, `evidenceReadinessAssessmentRef`, `identityConfidenceRef`, `destinationConfidenceRef`, `grantFamilyRecommendation = continuation_seeded_verified | continuation_challenge | manual_only`, `lineageScope = same_submission_envelope | same_request_lineage | none`, `eligibilityState = not_eligible | eligible_seeded | eligible_challenge | manual_only`, `reasonCodes[]`, `evaluatedAt`

**TelephonyManualReviewDisposition**
`telephonyManualReviewDispositionId`, `callSessionRef`, `triggerClass = recording_missing | transcript_degraded | contradictory_capture | identity_ambiguous | handset_untrusted | urgent_live_without_routine_evidence`, `reviewMode = audio_review | callback_required | staff_transcription | follow_up_needed | abandon`, `reviewState = open | assigned | settled | superseded`, `createdAt`, `settledAt`

**TelephonyContinuationContext**
`continuationContextId`, `callSessionId`, `issuedAt`, `expiresAt`, `resolvedAt`, `contextState = pending | grant_issued | no_grant_manual_only | consumed | expired`, `targetChannel`, `phoneNumberHash`, `handoffNonce`, `attemptCount`, `requestedGrantFamily`, `capabilityCeiling`, `requestSeedRef`, `routeFamilyRef`, `actionScope`, `resumeContinuationRef`, `boundSubjectRef`, `boundIdentityBindingRef`, `boundSessionEpoch`, `boundSubjectBindingVersion`, `lineageFenceEpoch`, `manifestVersionRef`, `releaseApprovalFreezeRef`, `minimumBridgeCapabilitiesRef`, `channelReleaseFreezeState`, `grantFenceState`

`TelephonyContinuationContext` is a non-redeemable fence and issuance record. The actual patient-visible link must always be a canonical `AccessGrant` issued by `AccessGrantService`. That grant is single-redemption, short-lived, and capability-bounded. Redemption must invalidate the grant atomically, mint a fresh secure-link web session rather than upgrading an existing anonymous session in place, and fail closed if call evidence is stale, missing, already consumed, or fence-mismatched.

Any continuation, post-auth return, or embedded re-entry path that resumes the same patient lineage must also bind to the latest `Session.sessionEpoch` and `subjectBindingVersion`. If logout, subject switch, relink, restriction, session revocation, or key-epoch rotation occurs before redemption, `grantFenceState` becomes invalid and the recovery path must restart without revealing seeded patient detail from the older session posture.

Introduce `IdentityBindingAuthority` as the sole binding serializer in this phase as well. NHS login callbacks, telephony verification, support correction, imports, and backfills may produce evidence and candidate sets, but only the authority may append a new `IdentityBinding` version or advance the bound `patientRef` on `Request` or `Episode`.

`IdentityContext`, `CapabilityDecision`, and `PatientLink` are derived trust records over the latest settled `IdentityBinding`. They may expose confidence, capability, and link posture, but they may not overwrite `IdentityBinding.patientRef`, `ownershipState`, or the binding supersession chain on their own.

`Session`, `PostAuthReturnIntent`, `SessionEstablishmentDecision`, and `TelephonyContinuationContext` are binding-fenced consumers. If the referenced `IdentityBinding` is superseded, corrected, revoked, or advanced before a route resumes, they must fall back to claim, step-up, or bounded recovery rather than silently carrying old patient lineage forward.

`CapabilityDecision` determines the ceiling, but it is not permission to mutate by itself. Any writable authenticated, claim, or continuation surface in this phase must also resolve one live `RouteIntentBinding` bound to the current route family, action scope, subject, session epoch, subject-binding version, grant posture, and, when applicable, `manifestVersionRef`, `ReleaseApprovalFreeze`, `minimumBridgeCapabilitiesRef`, and `ChannelReleaseFreezeRecord`. Capability and route posture may not drift independently.

Define a capability matrix now:

- start or continue anonymous draft
- start signed-in draft
- claim a public draft into an authenticated account
- view authenticated request status
- add attachments after sign-in
- create phone-seeded draft via SMS continuation
- future booking or records access in later phases

Also define a canonical `RouteCapabilityProfile` registry for every protected surface:

- `routeProfileRef`
- required capability set
- minimum assurance band
- minimum patient-link state
- minimum age outcome
- allowed channels
- evidence freshness window
- re-auth requirement
- fallback disposition

Unknown routes or unclassified jobs must be denied by default. Capability should not be inferred locally inside controllers, queue workers, or frontend route guards.

Capability should be derived from **identity source + verification + patient match confidence + route sensitivity**, but in a fixed order:

1. load the latest non-revoked `IdentityEvidenceEnvelope` set and reject stale or conflicting evidence
2. resolve age gate and tenant restriction policy before any user-visible capability is granted
3. derive a subject assurance ceiling from the authentication source and verification outcome
4. derive a patient-link ceiling from the current `PatientLink` state and confidence
5. intersect those ceilings with the `RouteCapabilityProfile` and channel-specific ceiling such as telephony continuation
6. emit exactly one immutable `CapabilityDecision` with reason codes, expiry, and policy version
7. bind `Session.decisionRef` to that decision and force re-evaluation on patient-link changes, assurance changes, logout, timeout, replay suspicion, or manual restriction

No access path is allowed to mint a capability outside this pipeline.

Use monotone ceilings and explicit kill switches rather than an additive trust score that lets one strong factor compensate for a broken one.

Let:

- `C_auth = ceiling_auth(identitySource, authLevelRaw, verificationLevelRaw)`
- `C_link = ceiling_link(PatientLink.linkProbabilityLowerBound, PatientLink.subjectProofProbabilityLowerBound, PatientLink.linkState, PatientLink.confidenceModelState)`
- `C_age = ceiling_age(ageGateState)`
- `C_channel = ceiling_channel(channel, grantFamily, bridgeState, channelReleaseFreezeState)`
- `C_policy = ceiling_policy(restrictionReasonCodes, manualOverrideRef)`
- `C_eff = min(C_auth, C_link, C_age, C_channel, C_policy)`

Let evidence freshness for the current route profile be:

`F_route(now) = exp(-max(0, now - lastVerifiedAt) / tau_fresh(routeProfileRef))`

For compromise or anomaly signals `r_i in [0,1]`, compute a conservative upper bound rather than an optimistic point estimate:

`R_hi = min(1, sum_i r_i)`

If a jointly calibrated session-risk model exists, persist its upper confidence bound and authorize against that bound, not against its point estimate.

Then evaluate:

- `allow` iff no kill-switch predicate is true, `C_eff >= C_req(routeProfileRef)`, `F_route(now) >= F_min(routeProfileRef)`, and `R_hi < rho_block(routeProfileRef)`
- `step_up_required` iff no kill-switch predicate is true, `C_eff >= C_recover(routeProfileRef)`, `F_route(now) >= F_step(routeProfileRef)`, and either `rho_step(routeProfileRef) <= R_hi < rho_block(routeProfileRef)` or `authTime + T_reauth(routeProfileRef) <= now`
- `recover_only` iff bounded same-lineage recovery exists but the current session, subject-binding, lineage, release, or channel fence is stale
- `deny` otherwise

`CapabilityDecision` must persist `C_eff`, `F_route(now)`, `R_hi`, the controlling thresholds, and decisive reason codes so trust elevation, downgrade, expiry, and replayed authorization can be explained deterministically.

This is also where any tenant-specific age rule should be decided. NHS guidance says the service must implement age restrictions where the risk assessment requires them; it is not enough to assume the identity provider will solve that for you. ([NHS England Digital][4])

Lock the first event set for this phase:

- `auth.login.started`
- `auth.callback.received`
- `auth.session.created`
- `auth.session.ended`
- `auth.session.revoked`
- `identity.patient.match_attempted`
- `identity.patient.matched`
- `identity.patient.ambiguous`
- `identity.capability.changed`
- `identity.capability.denied`
- `identity.age.restricted`
- `telephony.call.started`
- `telephony.menu.selected`
- `telephony.identity.captured`
- `telephony.recording.ready`
- `telephony.evidence.pending`
- `telephony.evidence.ready`
- `telephony.sms_link.sent`
- `telephony.request.seeded`
- `telephony.continuation.context.created`
- `telephony.continuation.context.resolved`
- `access.grant.issued`
- `access.grant.redeemed`
- `access.grant.revoked`

Every event in this set must emit through the canonical `CanonicalEventEnvelope` from Phase 0. At minimum that means `eventId`, `eventName`, `canonicalEventContractRef`, `schemaVersionRef`, `tenantId`, `producerScopeRef`, `sourceBoundedContextRef`, `governingLineageRef`, `edgeCorrelationId`, `occurredAt`, and the required privacy posture, plus telephony-specific references such as `subjectRef`, `sessionId`, `decisionRef`, `policyVersion`, `routeProfileRef`, `actorType`, and `reasonCodes` where the contract declares them mandatory. Raw identity values, phone numbers, and contact claims are never emitted on the bus; events carry references, hashes, or masked forms only.

Add new services or modules:

- `packages/identity-contracts`
- `packages/capability-policy`
- `packages/patient-matching`
- `services/auth-bridge`
- `services/session-governor`
- `services/identity-evidence-vault`
- `services/patient-linker`
- `services/telephony-edge`
- `services/continuation-worker`

**Frontend work**

Add the identity-aware shells now, even before the full login flow is live.

Patient web should gain these states:

- signed out
- signing in
- signed in, not linked
- signed in, linked
- partial identity or low assurance
- link pending review
- re-auth required
- restricted by age or policy
- session expired
- consent declined
- continuation link expired or already used
- support required

These are not edge-case afterthoughts. They are first-class screens.

Build the visual language for identity around calm reassurance, not security theatre. The page should feel premium and minimal: generous spacing, clear hierarchy, no overloaded auth copy, and no system-ish wording.

Every state above should render from `CapabilityDecision.reasonCodes`, not from ad hoc query parameters or frontend-only heuristics. The UI may soften the wording, but it must not invent its own trust outcome.

**Tests that must pass before moving on**

- deterministic capability-decision tests for every identity, link, age, and route-profile combination
- fail-closed tests for unknown route profiles, stale evidence, and conflicting evidence envelopes
- forbidden-route tests for every protected page
- session fixation, downgrade, revocation, key-epoch rotation, and re-auth propagation tests
- capability-decision monotonicity tests proving no high-trust factor can compensate for stale fences, out-of-domain identity models, or explicit restriction state
- canonical `AccessGrant` continuation tests covering opaque-token storage, replay, expiry, lineage-fence invalidation, capability ceiling, and atomic consumption
- serialization tests for identity, capability, session, and continuation objects
- redaction and encrypted-storage tests proving raw identity values stay inside the evidence vault
- event-schema tests for new identity, session, continuation, and telephony events
- migration tests proving old Phase 1 requests remain readable without identity data

**Exit state**  
The platform now understands who the user might be, how confident it is, and what they are allowed to do through a single reproducible decision path, with revocable sessions, bounded canonical `AccessGrant` issuance, and privacy-safe evidence handling, without changing the core request model.

---

## 2B. NHS login bridge and local session engine

This is the real sign-in implementation.

**Backend work**

Build `auth-bridge` as a dedicated service or isolated module inside the gateway. Do not spread OIDC logic across route handlers.

High-priority bridge defects in this slice:

1. `AuthTransaction` tracks state and nonce, but not one callback-consumption fence, so duplicate browser retries or callback races could settle twice
2. requested scopes and capability intent are assembled inline, so consent, assurance, and policy can drift between authorize and callback
3. the return path is treated as a plain string rather than a governed post-auth route intent bound to lineage, subject, and fallback
4. local session creation is implied instead of emitted as one deterministic establishment decision, so reuse, rotation, subject conflict, and draft-claim behavior can diverge
5. sign-out, timeout, downgrade, and revocation do not settle through one auditable termination record, leaving UI and support to infer why access ended

Create or extend these domain objects:

**AuthTransaction**
`transactionId`, `stateHash`, `nonceHash`, `pkceVerifierRef`, `scopeBundleRef`, `capabilityIntentRef`, `returnIntentRef`, `requestContextHash`, `transactionFenceEpoch`, `maxAuthAgeSeconds`, `startedAt`, `expiresAt`, `callbackReceivedAt`, `completedAt`, `errorRef`, `transactionState = opened | awaiting_callback | callback_received | verified | consumed | denied | expired | replayed`

**AuthScopeBundle**
`scopeBundleId`, `requestedScopes`, `minimumClaims`, `minimumAssuranceBand`, `capabilityCeiling`, `policyVersion`, `consentCopyVariantRef`, `createdAt`, `expiresAt`

**PostAuthReturnIntent**
`returnIntentId`, `routeFamilyRef`, `actionScope`, `routeTargetRef`, `requestLineageRef`, `draftRef`, `submissionPromotionRecordRef`, `draftContinuityEvidenceRef`, `continuationAccessGrantRef`, `fallbackRouteRef`, `resumeContinuationRef`, `subjectRef`, `requiredIdentityBindingRef`, `requiredCapabilityDecisionRef`, `requiredPatientLinkRef`, `requiredSessionState = active | step_up_required | restricted | recovery_only`, `returnAuthority = auth_only | claim_pending | writable_resume | recovery_only`, `sessionEpochRef`, `subjectBindingVersionRef`, `lineageFenceEpoch`, `manifestVersionRef`, `releaseApprovalFreezeRef`, `minimumBridgeCapabilitiesRef`, `channelReleaseFreezeState`, `routeFreezeDispositionRef`, `expiresAt`, `intentState = pending | consumed | superseded | recovered`

**SessionEstablishmentDecision**
`decisionId`, `transactionRef`, `existingSessionRef`, `resolvedSessionRef`, `identityBindingRef`, `subjectComparisonState = no_session | anonymous_session | same_subject_same_binding | same_subject_binding_advanced | different_subject | mismatched_secure_link_subject | stale_existing`, `capabilityDecisionRef`, `draftClaimDisposition = none | claim_route_required | draft_claim_allowed | request_shell_required | blocked_other_subject`, `returnIntentDisposition = consume_intent | consume_to_recovery | supersede_intent | deny_intent`, `writableAuthorityState = none | auth_read_only | claim_pending | writable`, `decision = create_fresh | rotate_existing | reuse_existing | deny | bounded_recovery`, `decidedAt`

**SessionTerminationSettlement**
`settlementId`, `sessionRef`, `trigger`, `triggerRef`, `cookieClearState`, `serverRevocationState`, `projectionDisposition`, `postTerminationRouteRef`, `settledAt`

`PostAuthReturnIntent` must be convertible into exactly one governed `RouteIntentBinding`. It is not an arbitrary URL string or controller-local redirect hint. When the target is pre-submit resume, the intent must either point to a still-writable `SubmissionEnvelope` lineage with valid `DraftContinuityEvidenceProjection`, or to bounded recovery; it may not reopen a lineage that already has `SubmissionPromotionRecord`.

`SessionEstablishmentDecision` is the only bridge from successful auth into a live Vecells session. It must decide subject comparison, session rotation or reuse, return-intent disposition, and `writableAuthorityState` before any post-auth shell reveals newly authorized detail. `CapabilityDecision` may still be `allow` while the resolved session remains only `auth_read_only` or `claim_pending`, and anonymous or mismatched secure-link sessions must rotate or bounded-recover rather than upgrading in place.

Use a standard server-side OIDC authorization-code flow with strict transaction tracking. NHS login is an OIDC integration for patient and public services, and NHS England provides both the integration toolkit and mock authorisation and testing guidance. ([NHS England Digital][1])

The runtime algorithm should be:

1. user clicks the NHS login button
2. backend freezes one `AuthScopeBundle` and one `PostAuthReturnIntent`, including route family, action scope, lineage fences, and, when applicable, embedded `manifestVersionRef`, `releaseApprovalFreezeRef`, `minimumBridgeCapabilitiesRef`, and current channel-freeze posture, then creates `AuthTransaction` with `state`, `nonce`, PKCE verifier, scope bundle, capability intent, and one `transactionFenceEpoch`
3. browser is redirected to NHS login using only the frozen scope bundle; do not recompute scopes or return targets in the controller after this point
4. callback receives `code` or error result
5. backend validates `state`, `nonce`, PKCE, issuer, audience, token times, and that `AuthTransaction.transactionState` is still unconsumed under the current `transactionFenceEpoch`
6. backend stores immutable claim snapshot and settles replayed, expired, denied, or insufficient-assurance outcomes exactly once against the transaction
7. backend submits auth evidence and the candidate-set decision to `IdentityBindingAuthority`, resolving the current append-only `IdentityBinding` version and any supersession before session posture is chosen; the auth bridge may not create, refresh, or overwrite patient binding locally
8. backend emits one `SessionEstablishmentDecision` that decides `create_fresh`, `reuse_existing`, `rotate_existing`, `deny`, or `bounded_recovery` based on any existing session, subject comparison, secure-link posture, and draft-claim intent. Anonymous, stale, or different-subject sessions may not be upgraded in place, and where writable resume is allowed the decision must also declare whether authority is only `auth_read_only`, `claim_pending`, or truly `writable`
9. backend creates or rotates the local application session only from an approved `SessionEstablishmentDecision`, binding it to the latest `CapabilityDecision`, `PatientLink`, settled `IdentityBinding`, `PostAuthReturnIntent`, `RouteIntentBinding`, `sessionEpoch`, `subjectBindingVersion`, and `routeAuthorityState`
10. if `PostAuthReturnIntent` targets draft resume, backend must also verify that the same `SubmissionEnvelope` is still unpromoted, that `draftContinuityEvidenceRef` still validates writable resume under the resolved session, subject-binding, manifest, and channel posture, and that `returnAuthority = writable_resume`; if `SubmissionPromotionRecord` now exists or authority is only `auth_only | claim_pending`, redirect into the mapped request shell, claim shell, or bounded recovery instead of reopening draft mutation
11. backend redirects the user only if the `PostAuthReturnIntent` still matches the resolved subject, current `IdentityBinding`, patient link, return authority, route family, and lineage fences and, when applicable, the pinned `manifestVersionRef`, `ReleaseApprovalFreeze`, `minimumBridgeCapabilitiesRef`, and channel-freeze posture; otherwise it falls back to the bounded recovery route through `routeFreezeDispositionRef` or `resumeContinuationRef`
12. sign-out, timeout, downgrade, and revocation emit `SessionTerminationSettlement`, clear the cookie, revoke the server session, and refresh `SessionProjection` with the terminal reason

Formal callback acceptance must be explicit:

`accept_callback(tx, tok, now) = 1[ CAS(tx.transactionState, awaiting_callback -> callback_received) succeeds and now <= tx.expiresAt + sigma_clock and state_ok and pkce_ok and token_ok ]`

where

`token_ok = issuer_ok and audience_ok and (azp_ok when required) and nonce_ok and nbf <= now + sigma_clock and iat <= now + sigma_clock and exp > now - sigma_clock and auth_time >= now - tx.maxAuthAgeSeconds`

Any callback that fails `accept_callback` must settle exactly once as `expired`, `denied`, or `replayed` under the current `transactionFenceEpoch`; duplicate browser retries may not create a second session, a second route intent, or a second draft-claim side effect.

Handle these callback outcomes explicitly:

- success
- consent declined
- insufficient assurance for requested route
- expired auth transaction
- replayed callback
- token-validation failure
- linkage unavailable
- internal fallback

Every non-success outcome must settle `AuthTransaction` exactly once and route through `PostAuthReturnIntent.fallbackRouteRef` or a fixed recovery page. Never redirect to an unvalidated arbitrary path.

NHS guidance says the user must agree to share the requested information the first time they use the product with NHS login, and if they do not, that response must be handled. It also says you should not ask for more information than you need. That makes scope selection and consent-denied UX product decisions, not just security configuration. ([NHS England Digital][5])

For sessions, keep the session local to Vecells. NHS guidance is explicit that session management and logout are partner responsibilities. Use secure HTTP-only cookies, server-side session storage, explicit idle timeout, absolute timeout, CSRF protection, and route-level re-auth requirements for sensitive actions. ([NHS England Digital][5])

Session deadlines and privilege changes must be deterministic:

- `idleExpiresAt = min(lastSeenAt + TTL_idle(capabilityCeiling, audienceTier), absoluteExpiresAt)`
- `absoluteExpiresAt = issuedAt + TTL_absolute(assuranceBand, audienceTier)`
- `reauthRequiredAt = min(authTime + TTL_reauth(routeSensitivityMax), riskRaisedAt + grace_step_up)` whenever elevated risk has been observed
- `sessionEpoch := sessionEpoch + 1` on `create_fresh`, `rotate_existing`, subject switch, claim that changes binding, admin revocation, wrong-patient hold, or cookie-key mismatch
- any privilege elevation or bound-subject change must rotate the session identifier and CSRF secret; no elevated state may survive on the pre-upgrade cookie
- any terminal state (`revoked`, `expired_idle`, `expired_absolute`, `terminated`) is absorbing; recovery requires a fresh `AuthTransaction`, not a local state flip

Build a `SessionProjection` so the patient UI can quickly render:

- signed-in state
- session warning countdown
- linked patient state
- available capabilities
- session reason for downgrade or expiry

Extend `SessionProjection` with `scopeBundleRef`, `returnIntentState`, `sessionMergeState`, `reauthRequired`, and `terminationSettlementRef` so the patient shell can distinguish clean sign-in from bounded recovery or forced termination.

**Frontend work**

The sign-in entry must look refined and trustworthy.

Build:

- NHS login button on landing and resume pages
- callback holding screen
- we-are-confirming-your-details interstitial
- consent-declined recovery page
- higher-assurance-required recovery page
- safe re-entry page for subject conflict or stale return intent
- session-expired recovery page
- account badge or identity chip in the header
- clean sign-out entry

NHS guidance says the NHS login button must be visible and up front and is not customisable. Do not redesign it. Design around it. Make the surrounding page premium, but keep the button standard. ([NHS England Digital][4])

Signed-in UX should feel simpler than signed-out UX. Once authenticated, remove unnecessary explanation and let the user get straight to start request, continue request, or track requests.

**Tests that must pass before moving on**

- state and nonce validation tests
- callback replay protection
- callback-consumption fence tests covering duplicate browser retries and parallel callback delivery
- token signature and issuer validation
- clock-skew tolerance tests
- frozen `AuthScopeBundle` tests proving consent copy, assurance requirements, and requested scopes do not drift after redirect
- consent-declined flow tests
- `PostAuthReturnIntent` allow-list and fence tests covering stale lineage, subject mismatch, and fallback routing
- append-only `IdentityBinding` version tests covering provisional, verified, claim-confirmed, correction-applied, and revoked transitions
- `IdentityBindingAuthority` compare-and-set tests proving auth callback, secure-link uplift, and stale backfill cannot overwrite a superseded binding version
- session fixation and CSRF tests
- `SessionEstablishmentDecision` tests covering create, reuse, rotate, subject conflict, draft-claim merge behavior, and forced session rotation on privilege elevation
- secure-link uplift tests proving anonymous or mismatched sessions rotate or bounded-recover instead of upgrading in place
- logout and timeout tests
- session-epoch, cookie-key-version, and subject-binding-version invalidation tests across claim, relink, and wrong-patient repair
- `SessionTerminationSettlement` tests for sign-out, idle expiry, absolute expiry, downgrade, and admin revocation propagation
- automated auth tests against the official NHS login mock auth approach or equivalent integration harness ([NHS England Digital][6])

**Exit state**  
Patients can now sign in with NHS login and establish a real Vecells session through frozen scope bundles, bounded post-auth return intents, deterministic session-establishment decisions, and auditable local-session termination without breaking the Phase 1 platform.

---

## 2C. Patient linkage, demographic confidence, and optional PDS enrichment

This is where authentication becomes patient identity, which is not the same thing.

**Backend work**

Do not assume a valid NHS login callback automatically means you have a safely linked patient record. Build a dedicated patient-linking algorithm.

Use `IdentityBinding`, not direct `Request.patientRef` mutation, as the cross-phase identity authority.

This section specializes the canonical identity and ownership algorithm in `phase-0-the-foundation-protocol.md` under `## Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm`. `IdentityBinding` owns patient-binding decisions, `AccessGrantService` owns patient-access grants, and any conflicting local shortcut is invalid.

Recommended linking sequence:

1. accept the NHS login claim envelope, freeze one candidate set plus match-evidence basis, and submit the decision to `IdentityBindingAuthority` to append one `candidate_refresh`, `provisional_verify`, or `verified_bind` `IdentityBinding` version
2. build the local candidate search using NHS number if present, otherwise a governed demographic set
3. auth bridge, telephony workers, support correction, secure-link subject-conflict detection, imports, and backfills may submit evidence and candidate-set intents only; none may write `Request.patientRef`, `Episode.patientRef`, or request ownership directly
4. map `Request.identityState` from `IdentityBinding`:
   - `anonymous` when no verified subject or patient binding exists
   - `partial_match` when a subject is verified or a patient candidate exists, but a safe unique bind does not yet exist
   - `matched` when a patient is uniquely verified, but request ownership is not yet established
   - `claimed` when patient binding and request ownership are both established under policy
5. score every candidate patient with a calibrated posterior and explicit uncertainty rather than a raw threshold:
   - build feature vector `phi(p)` from exact NHS-number agreement, date-of-birth agreement, name similarity, postcode similarity, phone or email agreement with provenance penalty, address-token similarity, source-reliability indicators, and missingness flags
   - compute `z(p) = beta_0 + sum_k beta_k * phi_k(p)`
   - compute `P_link(p) = Cal_link_version(z(p))`, where `Cal_link_version` is a versioned probability calibrator fitted on adjudicated match outcomes so the value is interpretable as a probability rather than an arbitrary score
   - compute lower and upper confidence bounds `LCB_link_alpha(p)` and `UCB_link_alpha(p)` at confidence `1 - alpha_link`
   - independently compute subject-to-patient proof `P_subject = Cal_subject_version(z_subject)` and `LCB_subject_alpha`
   - compute `drift_score` against the model's calibration population; if `drift_score > delta_drift`, set `confidenceModelState = out_of_domain`
6. let `p_star = argmax_p P_link(p)`, let `p_2` be the runner-up candidate or a null candidate with `P_link(p_2) = 0`, and define the separation in log-odds space as `gap_logit = log((P_link(p_star) + eps) / (1 - P_link(p_star) + eps)) - log((P_link(p_2) + eps) / (1 - P_link(p_2) + eps))`, with `eps = 1e-6` for numerical stability
7. auto-link only when all of the following are true:
   - `confidenceModelState = calibrated`
   - `LCB_link_alpha(p_star) >= tau_high(routeSensitivity)`
   - `UCB_link_alpha(p_2) <= tau_runner_up(routeSensitivity)` and `gap_logit >= delta_logit(routeSensitivity)` so the winning candidate is not only high-probability but materially separated from the runner-up
   - subject-to-patient proof lower bound `LCB_subject_alpha >= tau_subject(routeSensitivity)`
   - the action is permitted by policy for automatic linking
8. if `LCB_link_alpha(p_star)` clears a provisional threshold but not the durable threshold, keep `bindingState = provisional_verified` and allow only non-irreversible next actions
9. a single demographic candidate without step-up remains `partial_match`, not `matched`, unless the calibrated lower-bound and separation tests above pass
10. if binding remains ambiguous, require manual confirmation or restricted capability rather than treating a small raw probability gap as evidence of uniqueness
11. if no candidate exists, keep a provisional `IdentityBinding` and allow only safe next actions
12. `Request.patientRef` and `Episode.patientRef` remain derived from `currentIdentityBindingRef`; only `IdentityBindingAuthority` may advance them by compare-and-set against the current binding version, and any later correction still requires an explicit governed repair action, supervisor approval, immediate grant revocation, branch quarantine, governed release settlement, and full audit
13. if NHS login callback, telephony verification, secure-link uplift, or support review discovers subject conflict or wrong-patient suspicion on a lineage that already has durable binding, append `IdentityRepairSignal`, open or reuse the active `IdentityRepairCase`, and return only bounded identity-hold recovery until `IdentityRepairFreezeRecord` and later `IdentityRepairReleaseSettlement` say otherwise
14. persist both the raw match evidence and the calibrated decision record, including feature values, calibrator version, interval bounds, drift score, absolute-threshold version, runner-up threshold version, `gap_logit`, challenge, and human-review state

If a tenant does not yet have a validated calibration set for automatic linking, keep thresholds conservative and disable auto-link rather than treating an uncalibrated score as a probability.

NHS guidance is clear on two design points here. First, NHS login does not replace PDS. Second, PDS access requires a legal basis and appropriate onboarding, and the PDS FHIR API is the newest and simplest integration route. The clean engineering move is to build the matching provider seam now, ship with local matching first, and enable PDS lookup behind a separate flag only when onboarding and legal basis are complete. ([NHS England Digital][4])

Also keep `contactClaims`, `pdsDemographics`, and `patientPreferredComms` separate. Never overwrite communication preferences just because a login claim contains an email address or phone number. NHS guidance explicitly warns those contact details are distinct domains. ([NHS England Digital][4])

If there is any temptation to use NHS login for IM1 linkage-key retrieval at this stage, keep that feature disabled unless the IM1 PFS connection is already live. NHS guidance says GP surgery information scope for linkage-key benefits requires a live IM1 PFS connection and is not approved as a one-time key retrieval shortcut. ([NHS England Digital][4])

**Frontend work**

Build the account-linking states as polished, not apologetic.

The patient may need to see:

- you are signed in and ready
- we found your details
- we need one more confirmation
- we could not confidently match your record
- you can still continue in limited mode or please contact the practice

If a one-step confirmation screen is needed, keep it elegant and low friction. Never show raw matching jargon.

If sign-in occurs in the middle of a Phase 1 draft, the user should feel that the draft simply became safer and more personalized, not that they have entered a second system.

**Tests that must pass before moving on**

- exact-match auto-link tests
- confidence-interval and runner-up-separation tests
- model-drift fail-closed tests for automatic linking
- ambiguous-match tests
- no-match provisional-mode tests
- PDS-disabled fallback tests
- PDS-enabled enrichment tests
- wrong-patient-link prevention tests
- append-only binding-version and supersession tests across auth-link, claim, and correction paths
- `IdentityRepairSignal` convergence tests across auth subject conflict, telephony contradiction, secure-link conflict, and support escalation
- active repair-freeze tests proving signed-in portal return, secure-link uplift, and callback or message entry all degrade to the same hold posture until `IdentityRepairReleaseSettlement`
- proof that contact-preference data is not overwritten by auth claims

**Exit state**  
The platform can now distinguish authenticated user from safely linked patient, and it can do that in a controlled, auditable way.

---

## 2D. Signed-in portal uplift and authenticated request ownership

Now the patient portal should become meaningfully better when the user is signed in.

**Backend work**

Add authenticated request ownership without creating a second request store.

Implement:

- `GET /v1/me`
- `GET /v1/me/requests`
- `POST /v1/drafts/{publicId}/claim`
- `POST /v1/session/logout`
- authenticated status endpoints
- ownership enforcement on request details, attachments, and status
- public-access grant rotation and revocation on claim

The key algorithm here is **draft claiming and draft upgrading through `AccessGrant` and `IdentityBinding`**:

All claim, rotation, redemption, revocation, and replacement-grant behavior in this phase must run through `AccessGrantService` from the canonical Phase 0 section. Controllers and page flows may not mint, widen, or preserve grants independently. Every redeemable grant in this phase must carry one immutable `AccessGrantScopeEnvelope`, and every terminal redemption or replacement must settle through `AccessGrantRedemptionRecord` and, when applicable, `AccessGrantSupersessionRecord`.

1. anonymous Phase 1 draft or request exists with a scoped `AccessGrant`
2. supported grant types are:
   - `draft_resume_minimal`
   - `public_status_minimal`
   - `claim_step_up`
   - `continuation_seeded_verified`
   - `continuation_challenge`
   - `support_recovery_minimal`
3. every grant is short-lived, and every PHI-bearing grant is single-redemption and subject-bound unless policy explicitly states otherwise
4. `public_status_minimal` may expose only minimal receipt state and no narrative, attachments, or clinical detail
5. `continuation_challenge` may expose no pre-existing patient data before challenge success
6. `support_recovery_minimal` may never widen scope beyond the immediately prior authorized scope
7. on claim, redeem `claim_step_up` or the authenticated claim request only after resolving one live `RouteIntentBinding` for `actionScope = claim` under the current session epoch, subject binding version, grant family, current `AccessGrantScopeEnvelope`, and, when applicable, embedded manifest, release, bridge, and channel-freeze posture, and only while the active session has a current `SessionEstablishmentDecision(writableAuthorityState = claim_pending | writable)`; fresh callback success or `CapabilityDecision(allow)` alone is insufficient
8. the presented grant or authenticated claim token must first settle one exact-once `AccessGrantRedemptionRecord`; duplicate taps, browser refreshes, or cross-device opens must return the same redemption or recovery outcome instead of attempting a second claim path
9. the claim command must enter `ScopedMutationGate`, write one `CommandActionRecord`, and settle through one authoritative `CommandSettlementRecord`; pending, stale, blocked, or denied outcomes must keep the patient in the same shell rather than relying on controller success or projection drift
10. evaluate the current `IdentityBinding`; if no high-assurance patient bind exists, perform step-up challenge before any claim
11. if claim is allowed, submit the ownership uplift to `IdentityBindingAuthority` so it appends one `claim_confirmed` `IdentityBinding` version and compare-and-sets the current lineage binding before any request or draft becomes writable
12. if claim succeeds and the target lineage is still pre-submit, attach authenticated ownership to the same `SubmissionEnvelope`, refresh the active `DraftSessionLease` and `DraftContinuityEvidenceProjection`, and continue the same draft shell without changing `draftPublicId`
13. if claim succeeds and the lineage already has `SubmissionPromotionRecord`, continue on the mapped `Request` shell, revoke any stale draft-resume grants, and do not create a replacement draft or second envelope
14. revoke all superseded public-status or continuation `AccessGrant` rows through `AccessGrantSupersessionRecord` before issuing any replacement grant
15. if the request is already claimed by a different subject, deny normal claim and route to governed support workflow
16. if claim advances patient scope, subject binding, or writable authority, `SessionGovernor` must rotate the session identifier, CSRF secret, and `sessionEpoch` before newly writable detail is shown

Build request-ownership rules carefully:

- authentication and grant redemption must not directly overwrite `Request.patientRef`
- auth return, secure-link uplift, and support recovery may not synthesize claim ownership outside the current authority-settled `IdentityBinding` version
- old public-scope `AccessGrant` rows may remain only for requests that were never claimed
- once a draft or request is claimed, any old draft-resume `AccessGrant` must be revoked or superseded immediately
- once a request is claimed, any remaining public-status `AccessGrant` must either be revoked or reduced to a minimal receipt-only scope by policy
- sensitive states may never be exposed through superseded, over-redeemed, or replayed public-scope `AccessGrant` rows
- support recovery or secure-link reissue may never clone a stale grant; any replacement must carry a fresh `AccessGrantScopeEnvelope` and authoritative supersession chain

NHS guidance says you should request only the data you need and choose assurance based on the transaction. Use that principle to decide what the signed-in home, request list, and status views should show. ([NHS England Digital][4])

**Frontend work**

This is the moment where the portal starts to feel like a real account-based product.

Within the same request lineage, sign-in, claim, and ownership uplift should preserve the current `PersistentShell` and `AnchorCard` wherever possible. Newly authorized detail should reveal progressively after verification succeeds rather than through a disruptive redirect, and request-centered communications should converge into the canonical `ConversationThreadProjection`.

Add:

- signed-in home
- start a request
- continue a draft
- track your requests
- contact preference editor
- account summary or linked-patient summary
- session-expiry warning banner or modal
- clean sign-out flow

Also lock the cross-phase patient account contract now using `patient-account-and-communications-blueprint.md`. The signed-in home should be backed by explicit projections for next action, active requests, communication thread summary, callback status, and manage-capability visibility across booking, hub, and pharmacy paths.

Design-wise, this should be very polished. The signed-in home should feel quieter than the landing page, because trust has already been established. Use strong hierarchy, generous spacing, and only a few clear top-level actions.

Also keep the page chrome flexible for later NHS App embedding. NHS App web integration is still a responsive web integration and may require header or footer changes, so the current portal chrome should not be hard-wired into every template. ([NHS England Digital][3])

**Tests that must pass before moving on**

- anonymous-draft claim tests
- wrong-user access-denied tests
- old-public-link transition tests
- stale-public-token revocation and supersession-chain tests after claim
- exact-once `claim_step_up` redemption tests covering duplicate taps, refresh, and multi-device replay
- sign-in-during-submit race tests proving claim or auth return cannot create a second draft or second request after promotion
- session-expiry warning tests
- keyboard-only and screen-reader tests on signed-in pages
- deep-link recovery tests after callback and refresh

**Exit state**  
The existing Phase 1 portal has now become an authenticated portal without losing the original request model or leaving stale public links behind.

## 2E. Telephony edge, IVR choreography, and call-session persistence

This is the telephony half of the phase.

**Backend work**

The required phone behaviour is explicit: patient calls the practice or Vecells number, chooses Symptoms, Meds, Admin, or Results in IVR, identifies themselves using NHS number and DOB or caller ID plus confirmation, records up to 60 seconds of issue detail, can receive an optional SMS link to add more information, and still ends up in the same single request pipeline as web.

Build telephony as an adapter-driven subsystem, not as special-case controller code.

Create:

- `services/telephony-edge`
- `services/telephony-webhook-worker`
- `services/recording-fetch-worker`
- `services/continuation-dispatcher`

Define a `CallSession` state machine:

`initiated -> menu_selected -> identity_in_progress -> identity_resolved | identity_partial -> recording_expected -> recording_available -> evidence_preparing -> evidence_pending -> urgent_live_only | continuation_eligible | evidence_ready -> continuation_sent | request_seeded -> submitted -> closed`

with side branches:

- `identity_failed`
- `abandoned`
- `provider_error`
- `manual_followup_required`
- `manual_audio_review_required`
- `recording_missing`
- `transcript_degraded`

`evidence_pending` is the durable holding state for phone captures that have some raw evidence but no settled usability verdict yet. It may exit only through a new immutable `TelephonyEvidenceReadinessAssessment`.

`urgent_live_only` means urgent-live handling has already been opened from `TelephonyUrgentLiveAssessment`, but routine promotion remains blocked because transcript, structured capture, or manual review has not yet made the evidence safe for the ordinary intake path.

`continuation_eligible` means one `TelephonyContinuationEligibility` has allowed bounded seeded or challenge continuation for the same lineage, but routine promotion is still blocked until a later readiness assessment proves `safety_usable`.

`evidence_ready` means the latest `TelephonyEvidenceReadinessAssessment(usabilityState = safety_usable, promotionReadiness = ready_to_promote)` has settled. It is not a synonym for “transcript job finished”.

A telephony request must not be seeded or submitted into the normal intake path from `recording_expected`, `recording_available`, `evidence_preparing`, `evidence_pending`, `urgent_live_only`, or `continuation_eligible`. It may only proceed once the evidence is genuinely safety-usable.

When telephony does become safety-usable, it must enter the same Phase 0 `IntakeConvergenceContract` flow as self-service entry. `CallSession`, transcript workers, and continuation dispatch may contribute evidence and channel posture, but they may not mint a phone-only request payload, draft table, receipt grammar, or safety shortcut.

All provider callbacks should land on internal webhook endpoints and immediately become canonical telephony events. Vendor payloads should not leak deeper into the system.

Persist these artefacts:

- call metadata
- menu path
- caller-number snapshot
- verification attempts
- audio object reference
- transcript job reference
- audio-safety-facts reference
- urgent-live assessment
- transcript-readiness record
- evidence-readiness assessment
- continuation-eligibility verdict
- manual-review disposition
- SMS link reference
- linked request or draft reference

Because the architecture already places audio and documents into object storage with `DocumentReference` pointers, the call recording subsystem should reuse that same model.

A telephony request must not move from `recording_available` or `evidence_pending` to normal submission until its latest `TelephonyEvidenceReadinessAssessment` proves the evidence is safety-usable. That means the call session needs either transcript-derived facts with clinically sufficient coverage, structured keypad answers that satisfy the rules, or explicit manual audio review before it reaches `evidence_ready`.

Implement the readiness algorithm explicitly:

1. when the call starts, create `CallSession(callState = initiated)` and append one open `TelephonyUrgentLiveAssessment`
2. after menu selection, update the urgent-live assessment from IVR choice and any live spoken or staff-observed signals; if the result is `urgent_live_required`, create `SafetyPreemptionRecord(priority = urgent_live)` immediately and move the call into `urgent_live_only` while evidence processing continues
3. when the provider promises a recording, move to `recording_expected`; if the recording lands, append recording refs and move to `recording_available`; if it times out or is unusable, append `TelephonyManualReviewDisposition(triggerClass = recording_missing)` and block routine promotion
4. once audio or keypad evidence is available, move to `evidence_preparing`, enqueue transcript and fact extraction, and append `TelephonyTranscriptReadinessRecord`
5. while transcript coverage is incomplete, structured capture is insufficient, or contradictions remain unresolved, keep `TelephonyEvidenceReadinessAssessment.usabilityState = awaiting_recording | awaiting_transcript | awaiting_structured_capture`
6. if destination and identity posture support bounded follow-up before routine promotion, append `TelephonyContinuationEligibility` and move to `continuation_eligible`; this may allow SMS continuation, but it may not mark the call ready for routine submit
7. if transcript degradation, contradictory capture, or identity or handset uncertainty leaves safety meaning unresolved, append `TelephonyManualReviewDisposition` and settle `TelephonyEvidenceReadinessAssessment(usabilityState = manual_review_only, promotionReadiness = blocked)`
8. only when the latest readiness assessment reaches `usabilityState = safety_usable` may the call session become `evidence_ready` and feed the canonical intake-convergence path
9. any later transcript rerun, manual transcription, or structured-capture correction must append a new transcript-readiness record and a new readiness assessment before a previously blocked or continuation-only call may newly seed or promote

**Frontend work**

There are two front-end surfaces in this sub-phase.

First is the patient-facing mobile continuation page, which starts from an SMS link and should feel extremely lightweight: direct, mobile-first, no clutter, and one obvious action.

Second is the internal support or ops surface, where staff can inspect:

- current call session state
- verification outcome
- recording or transcript status
- audio evidence-readiness status
- linked request status
- continuation redemption status

This internal screen does not need to be beautiful yet, but it must be comprehensible at a glance.

**Tests that must pass before moving on**

- webhook contract tests for each vendor event type
- duplicate webhook idempotency tests
- out-of-order event tests
- dropped-call tests
- recording retrieval integrity tests
- urgent-live preemption persistence tests
- transcript-readiness versus evidence-readiness transition tests
- no-seeded-or-challenge-continuation-before-eligibility tests
- manual-review-only blocking tests
- call-session rebuild tests from raw events
- no-orphan-recording tests
- no-submit-before-evidence-ready tests

**Exit state**  
The platform can now accept phone interactions as real input, not as offline admin work, and it has an explicit evidence-readiness step before telephony enters the shared safety pipeline.

## 2F. Caller verification, voice capture, transcript stub, and SMS continuation

This is where telephony becomes usable rather than just connected.

**Backend work**

Design caller verification as a **confidence-scored process** with separate identity and handset-route probabilities, not a binary verified or unverified switch.

Telephony verification may contribute candidate evidence and continuation posture, but it may not overwrite request, episode, or session lineage binding outside `IdentityBindingAuthority`.

For telephony candidate `p`, compute:

- `z_id(p) = gamma_0 + sum_k gamma_k * psi_k(p)`
- `P_id(p) = Cal_id_version(z_id(p))`
- `LCB_id_alpha(p)` and `UCB_id_alpha(p)` at confidence `1 - alpha_id`
- `p_star = argmax_p P_id(p)`, with `p_2` the runner-up candidate or a null candidate with `P_id(p_2) = 0`
- `gap_id = log((P_id(p_star) + eps) / (1 - P_id(p_star) + eps)) - log((P_id(p_2) + eps) / (1 - P_id(p_2) + eps))`, with `eps = 1e-6`

where `psi_k` includes date-of-birth agreement, surname similarity, postcode fragment match, verified callback success, IVR-consistency checks, and caller-ID hint. Caller ID may contribute only as a weak bounded feature and must never be sufficient on its own.

Compute destination safety separately:

- `z_dest = eta_0 + eta_1 * verified_number_on_patient + eta_2 * handset_step_up_success + eta_3 * fresh_channel_control_proof`
- `P_dest = Cal_dest_version(z_dest)`
- `LCB_dest_alpha` at confidence `1 - alpha_dest`
- if a jointly calibrated seeded-delivery model exists, compute `P_seed = Cal_seed_version(z_seed)` and `LCB_seed_alpha`
- otherwise use the dependence-safe lower bound `P_seed_lower = max(0, LCB_id_alpha(p_star) + LCB_dest_alpha - 1)` rather than `P_id(p_star) * P_dest`

Seeded delivery must authorize against `LCB_seed_alpha` or `P_seed_lower`, never against an uncalibrated point estimate.

A practical algorithm is:

1. capture IVR selection
2. capture identifying fields in a controlled order
3. resolve local candidate set
4. compute `P_id` for the best candidate, `gap_id` against the runner-up, and `P_dest` for the target handset
5. if `LCB_id_alpha(p_star) >= tau_id(routeSensitivity)`, `UCB_id_alpha(p_2) <= tau_runner_up(routeSensitivity)`, `gap_id >= delta_id(routeSensitivity)`, `LCB_dest_alpha >= tau_dest(routeSensitivity)`, and the seeded lower bound (`LCB_seed_alpha` when available, otherwise `P_seed_lower`) is at least `tau_seeded(routeSensitivity)`, mark `telephony_verified_seeded` and submit the candidate evidence to `IdentityBindingAuthority`; telephony edge may not bind the lineage locally
6. if `LCB_id_alpha(p_star) >= tau_challenge(routeSensitivity)` and `UCB_id_alpha(p_2) <= tau_runner_up_challenge(routeSensitivity)` and `gap_id >= delta_challenge(routeSensitivity)` but `LCB_dest_alpha < tau_dest(routeSensitivity)`, allow only challenge continuation with fresh identity challenge
7. if identity ambiguity or destination safety remains poor, create a manual follow-up path rather than blocking entirely

If the route lacks a validated calibration set for seeded continuation, default to manual or challenge continuation rather than optimistic seeding.

Do not rely on caller ID alone. It can help with candidate narrowing, but it should not be treated as proof of patient identity or proof that an SMS destination is safe for seeded data.

This is also where the NHS login contact-data warning becomes relevant. Because NHS login contact details and GP or PDS contact data are not equivalent, and phone numbers can be reused across multiple accounts, continuation-SMS logic must be explicit about which number it is using and why. ([NHS England Digital][4])

Build voice capture like this:

1. telephony provider marks recording available
2. recording-fetch worker pulls or receives the asset
3. asset is quarantined, scanned, and moved to governed object storage
4. `DocumentReference` is created
5. append or refresh one `TelephonyTranscriptReadinessRecord(transcriptState = queued | running)`
6. asynchronous rapid transcript and keyword-extraction job is enqueued
7. extracted `TelephonySafetyFacts` are attached and one new `TelephonyTranscriptReadinessRecord` plus `TelephonyEvidenceReadinessAssessment` is settled, or the call is marked `manual_audio_review_required`
8. transcript result is attached as a secondary artefact and immutable `EvidenceDerivationPackage`, not as source truth

Do not wait for perfect transcription in this phase. A rapid transcript stub is enough so long as original audio remains the authoritative artefact, `TelephonyTranscriptReadinessRecord.coverageClass` is clinically sufficient for the current rules, and `TelephonyEvidenceReadinessAssessment` says the evidence is safety-usable. Any later transcript rerun, diarisation correction, or concept-extraction upgrade must append a new immutable derivation package, a new transcript-readiness record, and a new readiness assessment; it may not replace the transcript or extracted facts referenced by an already promoted `EvidenceSnapshot`.

For SMS continuation, use `AccessGrant` rather than a telephony-only token model. The continuation flow should use canonical grant families:

All continuation-link issuance, redemption, rotation, and revocation must run through `AccessGrantService` as defined by the canonical Phase 0 section. NHS login uplift, telephony continuation, and support reissue may not each invent their own grant semantics. Every continuation grant must carry one immutable `AccessGrantScopeEnvelope`, and every terminal redemption or replacement must settle through `AccessGrantRedemptionRecord` plus `AccessGrantSupersessionRecord` where applicable.

- `continuation_seeded_verified`
- `continuation_challenge`
- `manual_only` as a routing disposition only; it must create no redeemable grant

Recommended SMS continuation algorithm:

1. phone call captures menu, identity fragments, and recording
2. system settles one `TelephonyEvidenceReadinessAssessment` and one `TelephonyContinuationEligibility` for the current evidence cut before any SMS link is chosen
3. system records `TelephonyContinuationContext`, including the current authority-settled binding fence when one exists, then issues the correct canonical `AccessGrant` family from the settled continuation-eligibility verdict with one current `AccessGrantScopeEnvelope` or settles `manual_only` as a no-grant routing outcome
4. only if `TelephonyContinuationEligibility.eligibilityState = eligible_seeded`, the destination number is verified for that patient, and a high-assurance `IdentityBinding` exists may the SMS link open a seeded flow
5. if `eligibilityState = eligible_challenge`, the link opens a minimal flow that shows no existing patient data and re-challenges identity before any detail is displayed
6. if the latest readiness assessment is still `urgent_live_only`, `manual_review_only`, or `unusable_terminal`, or if continuation eligibility is `manual_only | not_eligible`, route to `manual_only`
7. on redemption, first claim the presented grant through compare-and-set and settle one exact-once `AccessGrantRedemptionRecord`; duplicate clicks, delayed SMS opens, refreshes, or multi-device opens must return the recorded redemption or recovery result rather than starting a second session or second replacement-grant flow
8. only after the redemption record is claimed, resolve or refresh one `RouteIntentBinding` for the continuation shell and verify the grant is still valid for its scope envelope, bound to the same request lineage, still aligned to the expected `boundSubjectRef`, `boundIdentityBindingRef`, `boundSessionEpoch`, `boundSubjectBindingVersion`, and `lineageFenceEpoch`, and, when embedded or channel-specific, still aligned to `manifestVersionRef`, `ReleaseApprovalFreeze`, `minimumBridgeCapabilitiesRef`, and channel-freeze posture
9. successful redemption must mint a fresh secure-link session with a new session identifier and CSRF secret; subsequent mutations may not present the URL grant directly
10. if step-up, NHS login uplift, stale-link recovery, or contact-route repair interrupts the continuation shell, issue or consume `RecoveryContinuationToken` bound to the current request seed, selected mobile step, route family, and any active `PatientActionRecoveryEnvelope` so the same shell can reopen in place after the prerequisite settles
10A. if continuation rejoins an existing patient request shell and `patientShellContinuityKey` is unchanged, reuse the current `PersistentShell`, `PatientNavReturnContract`, any active `PatientRequestReturnBundle`, and the same stale-action recovery tuple where applicable; generic home, fresh seeded intake, or detached receipt landing is invalid while the same request lineage remains current
11. patient adds detail, files, and confirms preferences
12. revoke superseded continuation `AccessGrant` rows through `AccessGrantSupersessionRecord` before issuing any replacement grant
13. continuation flow submits into the same request lineage and the same safety-preemption rules, but only after a fresh readiness assessment says the combined telephony plus patient-supplied evidence is `safety_usable`
14. call session closes or transitions to linked status

**Frontend work**

The SMS continuation page should feel like the best part of the entire phone experience.

The continuation flow must stay inside one mobile-first `PersistentShell`. Use `AmbientStateRibbon` for save and sync feedback and `TransitionEnvelope` for submit or verification progress; do not drop the user into a blank receipt or a full-page spinner when the same request entity is already known.

Design it as:

- one-column mobile flow
- minimal chrome
- neutral identity language until seeded access is confirmed
- clear `we have already captured some details` messaging only for verified seeded continuation
- one primary action per screen
- very short copy
- obvious upload option
- visible progress
- visible save state

If the patient later signs in with NHS login from the continuation flow, that sign-in should feel like a smooth upgrade, not a detour.

Any interruption that requires sign-in uplift, step-up, or stale-link recovery must preserve the same mobile-first shell and consume `RecoveryContinuationToken` on return. The continuation journey may not bounce the patient to a generic landing page or reopen a fresh seeded state after fences drift.

Continuation return must also restore the current step anchor, visible request summary, active patient return contract, and any current `PatientActionRecoveryEnvelope` before calm or writable posture resumes. If continuity evidence, release posture, subject binding, or the stale-action tuple no longer matches, the same shell stays open in bounded recovery with the prior summary visible instead of reopening `/home` or a new blank continuation state.

**Tests that must pass before moving on**

- caller-verification confidence tests
- seeded lower-bound tests using joint calibration and Fréchet fallback
- wrong-patient SMS prevention tests
- seeded-versus-challenge continuation tests
- continuation-eligibility gate tests proving no grant issues from `awaiting_recording`, `awaiting_transcript`, `awaiting_structured_capture`, `urgent_live_only`, or `manual_review_only`
- continuation `AccessGrant` expiry, replay, and opaque-token-at-rest tests
- continuation grant supersession and support-reissue tests proving an older secure link cannot stay live after replacement delivery
- telephony binding-authority tests proving caller verification and SMS continuation cannot overwrite a superseded patient binding
- stale-session-epoch and subject-rebind invalidation tests for continuation and post-auth resume
- transcript job timeout tests
- transcript clinical-sufficiency versus readiness-verdict tests
- transcript-rerun and manual-correction immutability tests
- manual-review-only routing tests for degraded transcript, recording-missing, or contradictory capture
- refreshed-readiness-after-patient-upload tests
- upload-after-call tests
- partial-identity continuation tests
- end-to-end call to SMS to mobile completion flow tests

**Exit state**  
Phone capture now has a clean path into richer digital detail capture without leaking seeded data to an unsafe destination or skipping evidence preparation.

## 2G. One-pipeline convergence, safety parity, and duplicate control

This is the sub-phase that actually makes telephony parity real.

**Backend work**

At this point, there are several entry surfaces but only one governed intake contract:

- self-service form entry under `ingressChannel = self_service_form`, rendered as standalone browser or NHS App embedded shell
- telephony capture under `ingressChannel = telephony_capture`
- secure-link or authenticated continuation under `ingressChannel = secure_link_continuation`, including SMS follow-up from a telephony seed
- support-assisted pre-submit capture under `ingressChannel = support_assisted_capture`

NHS App jump-off is not a separate business intake meaning. It is `surfaceChannelProfile = embedded` over the same self-service ingress contract, and secure-link recovery is not a second request model. Now force every one of those entries through the same canonical intake contract before safety.

This shared pipeline is subordinate to the canonical ingest, duplicate, and safety-preemption algorithm in `phase-0-the-foundation-protocol.md`. `SafetyOrchestrator` owns evidence classification and preemption, and any local duplicate shortcut that conflicts with the canonical rules is invalid.

Use the canonical Phase 0 `IntakeConvergenceContract`, `SubmissionIngressRecord`, and `NormalizedSubmission` as the convergence seam. A valid ingress record must settle, at minimum:

- true ingress channel
- surface channel profile
- request type
- narrative
- structured answers
- channel metadata
- identity context
- attachment refs
- audio refs
- contact preferences
- submission source timestamp
- patient-match confidence
- dedupe fingerprint
- evidence-readiness state
- channel capability ceiling
- contact-authority class
- receipt and status consistency keys

Then make every channel use the same submit pipeline:

1. on any evidence-bearing command, resolve the active `IntakeConvergenceContract` from the true ingress channel and current surface profile; browser versus NHS App embedded may change shell posture only, not canonical intake meaning
2. resolve the idempotency envelope using source command ID, transport correlation, source lineage, `h_raw`, `h_sem`, and canonical replay key `k_replay`
3. if replay classification = `exact_replay` or `semantic_replay`, return the prior result and do not create a new `Request`, `EvidenceSnapshot`, `SubmissionIngressRecord`, `TriageTask`, or duplicate projection row
4. if replay classification = `collision_review`, freeze one immutable `EvidenceCaptureBundle`, derive the canonical normalization package from that frozen input, persist the immutable `EvidenceSnapshot`, route to explicit review, and stop ordinary promotion flow
5. otherwise freeze one immutable `EvidenceCaptureBundle`, derive the canonical normalization package from that frozen input, and persist a new immutable `EvidenceSnapshot` before normalization or state advancement
6. create or supersede one immutable `SubmissionIngressRecord` carrying the ingress channel, surface profile, promotion intent, channel capability ceiling, contact-authority class, evidence-readiness state, and receipt or status consistency keys before duplicate handling or promotion continues
7. build or supersede one canonical `NormalizedSubmission` from the frozen snapshot plus the latest ingress record, materialize the deterministic candidate-request window, persist immutable `DuplicatePairEvidence` for every plausible candidate, and derive calibrated canonical relation posteriors for `retry | same_episode_candidate | same_episode_confirmed | related_episode | new_episode` only from the frozen snapshot packages and normalized submission, never from mutable telephony job state, route-local shell state, or support-tool convenience fields
8. if relation = `retry`, settle one `DuplicateResolutionDecision(decisionClass = exact_retry_collapse)` from the winning pair evidence, acknowledge idempotently, and stop
9. if relation = `same_episode_candidate`, create a separate `Request` plus `DuplicateCluster(relationType = review_required)`; persist pairwise evidence, competing candidates, and one `DuplicateResolutionDecision(decisionClass = review_required)`, and do not auto-attach
10. if relation = `same_episode_confirmed`, auto-attach only when the stricter internal `same_request_attach` class also clears the canonical attach thresholds, uncertainty bound, candidate-to-candidate competition margin, explicit-continuity-witness requirement, and no-divergence checks; if attach occurs, persist `DuplicateResolutionDecision(decisionClass = same_request_attach)`, otherwise create a separate `Request` inside the same `Episode` with `DuplicateResolutionDecision(decisionClass = same_episode_link)`
11. if relation = `related_episode` or `new_episode`, create a separate `Request` under the canonical episode-formation rules and persist the corresponding `DuplicateResolutionDecision`
12. if telephony evidence is still awaiting a settled usability verdict, hold the lineage in `evidence_pending`; if the latest readiness assessment says `urgent_live_only` or `manual_review_only`, keep the lineage blocked on urgent diversion or governed manual follow-up respectively; in all three cases, do not enter the normal triage path
13. for a new lineage, promote exactly once from `SubmissionEnvelope.state = draft | evidence_pending | ready_to_promote` to `Request.workflowState = submitted`, freezing the current `NormalizedSubmission` plus receipt or status consistency keys in `SubmissionPromotionRecord`, then advance to `intake_normalized` after canonical normalization succeeds
14. for an existing request lineage that was already proven `same_request_attach`, append the snapshot and continue through the safety-preemption and reopen path; do not recreate `submitted` or `intake_normalized`
15. settle one immutable `EvidenceClassificationDecision` over inbound evidence, carrying the dominant evidence class, dependency upgrades, classifier version, reason codes, and misclassification-risk posture for the self-service, phone, secure-link, or support-assisted batch
16. only an explicit allow-list may be treated as `technical_metadata`; pure control-plane deltas remain `operationally_material_nonclinical`; contact-route changes, preference changes, or delivery failures that threaten an active `ReachabilityDependency` are `contact_safety_relevant`; everything else defaults to `potentially_clinical`
17. if transcript, parser, extractor, attachment, or support-transcription degradation leaves safety meaning unresolved, fail closed through `EvidenceClassificationDecision.misclassificationRiskState = fail_closed_review` rather than downgrading the evidence batch
18. first settle one canonical `EvidenceAssimilationRecord` and one `MaterialDeltaAssessment` for the inbound self-service, phone, secure-link, or support-assisted batch; exact or semantic replay must return the same assimilation outcome rather than opening a second re-safety path
19. for any `potentially_clinical` or `contact_safety_relevant` dominant class whose `MaterialDeltaAssessment.triggerDecision = re_safety_required | blocked_manual_review`, create `SafetyPreemptionRecord(openingSafetyEpoch = Request.safetyDecisionEpoch + 1)`, recompute the latest composite evidence, rerun the canonical calibrated safety or contact-risk engine, and append `SafetyDecisionRecord` before routine flow continues
20. while `EvidenceAssimilationRecord.assimilationState = pending_materiality | pending_classification | pending_preemption | blocked_manual_review`, or while `SafetyPreemptionRecord.status = pending | blocked_manual_review`, or while the current `SafetyDecisionRecord` or `UrgentDiversionSettlement` is still pending, do not close the request, auto-resume routine flow, or present stale reassurance
21. if re-safety yields urgent diversion or urgent contact-risk review, settle `SafetyDecisionRecord(requestedSafetyState = urgent_diversion_required)`, create the urgent handling path immediately, keep `safetyState = urgent_diversion_required` until one `UrgentDiversionSettlement` is issued, and end the routine flow
22. if routine handling clears or remains residual-only, settle `SafetyDecisionRecord(requestedSafetyState = screen_clear | residual_risk_flagged)`, create or refresh the single operational owner, issue one receipt and one `PatientReceiptConsistencyEnvelope` from the frozen promotion keys, update one status projection, and emit the same canonical events as web for equivalent state changes

The phone path must never run a pre-request safety shortcut, and suspected duplicates must be clustered rather than silently merged unless they are proven retries or proven same-request continuations under the attach rules.

Cross-channel duplicate policy must fail closed when the current `channelCalibrationRef` does not support auto-confirmation for the observed web, phone, SMS-continuation, or authenticated-return combination. In that case, create `DuplicateCluster(review_required)` or keep the requests separate rather than treating one channel's thresholds as universal truth.

Support-assisted capture must follow the same rule. Support may help the patient supply or transcribe pre-submit information, but that work must still append `SubmissionIngressRecord(captureAuthorityClass = support_assisted | staff_transcribed)` and pass through the same `NormalizedSubmission`, duplicate policy, governed promotion, and safety path rather than creating a hidden staff-only intake lane.

If a patient adds new detail through SMS continuation before triage, or if any same-request-attached or confirmed-same-episode evidence adds materially new clinical detail during later workflow, first settle one `EvidenceAssimilationRecord` and one `MaterialDeltaAssessment`, then create a new immutable snapshot backed by its own frozen capture bundle and derivation packages, append a new `EvidenceClassificationDecision`, create `SafetyPreemptionRecord`, and rerun the same canonical safety engine before routine flow continues.

**Frontend work**

The patient should never see channel fragmentation.

Status should look the same whether the request started on web or phone. The only visible difference should be helpful context like `you added more detail after your call` if that actually benefits understanding.

Internal ops and staff screens should display channel provenance clearly, but without turning it into a separate workflow.

**Tests that must pass before moving on**

- web-versus-phone normalization parity tests
- browser-versus-embedded self-service parity tests
- same-facts same-safety-outcome tests
- telephony-evidence-readiness gating tests
- secure-link-continuation convergence tests proving resumed entry cannot alter canonical field meaning, duplicate posture, or receipt semantics
- support-assisted-capture convergence tests proving operator-assisted intake still emits the same ingress record, normalized submission, and safety path
- duplicate-resolution tests
- duplicate-flag tests
- cross-channel candidate-competition tests proving near-equal target requests fail closed into review instead of silent attach
- explicit continuity-witness tests proving same-request attach never happens from score alone
- duplicate-resolution-reruns-safety tests for safety-relevant evidence
- receipt-equivalence tests proving web, embedded, telephony, and continuation routes publish the same ETA bucket, promise state, and recovery posture from the same `SubmissionPromotionRecord`
- classification-decision tests proving degraded transcript or attachment paths fail closed to review instead of being downgraded to nonclinical evidence
- safety-epoch race tests proving late phone or SMS evidence suppresses stale routine or calm status projections before they advance
- urgent-required-versus-urgent-issued tests proving callback or telephony urgent posture cannot render as durably diverted before one `UrgentDiversionSettlement`
- one-request one-triage-task tests
- late-detail snapshot rerun tests
- no-double-receipt tests

**Exit state**  
Web and telephony are now different entry methods into the same operational system, and any clinically relevant attached or same-episode-linked evidence still re-enters the same frozen classification and safety-decision discipline.

## 2H. Hardening, safety evidence, and the formal Phase 2 exit gate

This is where the phase becomes releasable rather than merely functional.

**Backend work**

Instrument the identity and telephony paths thoroughly.

Minimum metrics:

- NHS login start rate
- callback success rate
- consent-declined rate
- insufficient-assurance rate
- session expiry rate
- patient-match confidence distribution
- ambiguous-link rate
- call start rate
- IVR completion rate
- caller-verification failure rate
- recording availability latency
- SMS continuation redemption rate
- channel-parity divergence rate
- duplicate-detection rate
- safety rerun rate after continuation

Add alerting for:

- callback validation failures
- session-store instability
- sharp increase in ambiguous patient matches
- telephony provider webhook failure
- recording ingest lag
- SMS continuation failures
- parity drift between web and phone normalization

Build internal tools for support and safety review:

- auth transaction inspector
- identity match explainer
- call session timeline
- recording and transcript status viewer
- continuation redemption viewer
- linked-request timeline

This phase also needs its safety and assurance evidence updated as part of the engineering work. NHS England says DCB0129 is the manufacturer clinical risk management standard, DCB0160 applies to deployment and use, and organisations with access to NHS patient data and systems must use the DSPT. NHS login onboarding also expects clinical safety evidence as part of its assurance documentation. ([NHS England Digital][7])

The Phase 2 hazard set should explicitly include:

- wrong-patient linkage
- stale or mismatched contact source
- callback replay or session confusion
- duplicate cross-channel request creation
- caller misidentification
- SMS continuation to the wrong recipient
- telephony capture failure after patient expectation has been set
- safety-screen result changing after late detail arrives

**Frontend work**

Before sign-off, the identity and telephony-adjacent UI needs to feel product-grade:

- landing page with proper sign-in affordance
- account states polished
- callback recovery polished
- continuation flow polished
- session expiry and sign-out polished
- accessibility pass on all auth and continuation states

The whole thing should feel deliberate, clean, and premium. In this kind of product, trust is part of the functional outcome.

**Tests that must all pass before Phase 3**

- no Sev-1 or Sev-2 defects in sign-in, session, or phone capture paths
- state, nonce, and callback replay protections proven
- wrong-user and wrong-patient access controls proven
- ambiguous-link handling proven
- old Phase 1 requests remain accessible under transitional rules
- telephony webhook and recording pipeline stable under retry and disorder
- opaque SMS continuation `AccessGrant` tokens cannot be replayed, widened in scope, or remain live after authoritative supersession
- same web and phone facts produce the same safety outcome
- audit trail complete for login, linking, continuation, and request creation
- Phase 2 hazard log and safety evidence updated
- rollback rehearsal completed

**Exit state**  
Phase 2 is done when the system can authenticate real patients, link them safely, accept phone capture as a first-class input, and still produce one canonical request and one queue.

[1]: https://digital.nhs.uk/developer/api-catalogue/nhs-login?utm_source=chatgpt.com "NHS login"
[2]: https://digital.nhs.uk/services/personal-demographics-service/access-data-on-the-personal-demographics-service "Access data on the Personal Demographics Service - NHS England Digital"
[3]: https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/nhs-app-web-integration?utm_source=chatgpt.com "NHS App web integration"
[4]: https://digital.nhs.uk/services/nhs-login/nhs-login-for-partners-and-developers/nhs-login-integration-toolkit/how-nhs-login-works?utm_source=chatgpt.com "How NHS login works"
[5]: https://digital.nhs.uk/services/nhs-login/nhs-login-for-partners-and-developers/nhs-login-integration-toolkit/how-nhs-login-works "How NHS login works - NHS England Digital"
[6]: https://digital.nhs.uk/developer/guides-and-documentation/security-and-authorisation/testing-with-our-mock-authorisation-service-using-nhs-login---separate-authentication?utm_source=chatgpt.com "Testing with our mock authorisation service using NHS login"
[7]: https://digital.nhs.uk/services/clinical-safety/clinical-risk-management-standards?utm_source=chatgpt.com "Clinical risk management standards"
