            # 21 Mock First Vs Actual Later Strategy

            ## Section A - Mock_now_execution

            Vecells needs high-quality mock services first because many real NHS and partner onboarding routes are unavailable before there is an MVP and a credible evidence pack. The current ranking therefore prioritizes simulator quality, proof fidelity, and readiness unlocked for later phases over live credential possession.

            ### 1. Pharmacy dispatch proof and urgent-return seam

- baseline role: `baseline_mock_required`
- recommended lane: `mock_now`
- source dependencies: dep_pharmacy_referral_transport, dep_pharmacy_urgent_return_professional_routes
- mock must simulate faithfully: Simulate dispatch attempts, transport accepted versus authoritative proof, proof deadlines, redispatch, weak email or weak mailbox returns, urgent return phone escalation, and reopen-for-safety. Update Record may not stand in for urgent return and mock send acceptance may not count as resolved dispatch truth.
- placeholder-only areas: real destination identifiers, real professional phone numbers
- failure injection expectations: transport accepted only, provider acceptance missing, proof deadline missed, urgent return digital route unavailable, redispatch after duplicate receipt
- cannot be authoritative: transport accepted, mailbox delivery only, Update Record message for urgent return
- good-enough evidence for current build: preserve proof vs ambiguity vs fallback exactly enough that later live adapters can be dropped in without changing control-plane law

### 2. NHS login core identity rail

- baseline role: `baseline_required`
- recommended lane: `hybrid_mock_then_live`
- source dependencies: dep_nhs_login_rail
- mock must simulate faithfully: Simulate frozen authorize and callback scope bundles, state or nonce or PKCE fences, consent decline, insufficient assurance, subject mismatch, callback replay, auth_read_only, claim_pending, writable, and bounded recovery. Mock callback arrival must never equal writable authority.
- placeholder-only areas: branding chrome, non-authoritative copy polish
- failure injection expectations: duplicate callback replay, expired auth transaction, consent declined, subject mismatch against secure-link or draft continuation, auth success without writable authority
- cannot be authoritative: raw callback arrival, token exchange success without session establishment, subject claim without current binding and route authority
- good-enough evidence for current build: preserve proof vs ambiguity vs fallback exactly enough that later live adapters can be dropped in without changing control-plane law

### 3. Local booking provider capability and confirmation-truth seam

- baseline role: `baseline_mock_required`
- recommended lane: `mock_now`
- source dependencies: dep_gp_system_supplier_paths, dep_local_booking_supplier_adapters
- mock must simulate faithfully: Simulate slot search snapshots, capability resolution, held versus non-exclusive reservation truth, revalidation failure, confirmation_pending, disputed callbacks, same-commit read-after-write proof, manage freeze, waitlist fallback, and wrong-patient freeze. Queue or webhook acceptance may not imply booked truth.
- placeholder-only areas: supplier branding, practice-specific routing labels
- failure injection expectations: supplier accepted but not confirmed, read-after-write mismatch, stale provider binding, slot revalidation failure, waitlist fallback required
- cannot be authoritative: slot shown in UI, provider accepted for processing, callback arrival without confirmation truth
- good-enough evidence for current build: preserve proof vs ambiguity vs fallback exactly enough that later live adapters can be dropped in without changing control-plane law

### 4. Pharmacy outcome observation and reconciliation seam

- baseline role: `baseline_mock_required`
- recommended lane: `mock_now`
- source dependencies: dep_pharmacy_outcome_observation
- mock must simulate faithfully: Simulate exact replay, semantic replay, collision review, unresolved match, resolved_apply, resolved_reopen, unmatched, proof-bearing correlation chains, and blocked closure. Weakly matched outcomes may not auto-close the request or stand in for authoritative proof.
- placeholder-only areas: real patient summaries, real message identifiers
- failure injection expectations: exact replay, semantic replay, collision review, weak match reopened for safety
- cannot be authoritative: single inbound message without correlation proof, weakly matched email outcome
- good-enough evidence for current build: preserve proof vs ambiguity vs fallback exactly enough that later live adapters can be dropped in without changing control-plane law

### 5. Telephony capture, transcript, and artifact-safety backplane

- baseline role: `baseline_mock_required`
- recommended lane: `mock_now`
- source dependencies: dep_telephony_ivr_recording_provider, dep_transcription_processing_provider, dep_malware_scanning_provider
- mock must simulate faithfully: Simulate call-session creation, IVR branch capture, webhook retries, recording present or missing, transcript usable versus unusable, artifact quarantine, safety-usable versus manual-review states, callback or secure-link fallback, and urgent escalation. Answered call or file stored may not imply clinically usable evidence or completed contact.
- placeholder-only areas: carrier branding, real caller IDs, real audio content
- failure injection expectations: recording missing, transcript unsafe or incomplete, scanner timeout, duplicate telephony webhook, urgent escalation during capture
- cannot be authoritative: call answered event, file upload acknowledgement, draft transcript before readiness assessment
- good-enough evidence for current build: preserve proof vs ambiguity vs fallback exactly enough that later live adapters can be dropped in without changing control-plane law

### 6. Network capacity and practice-acknowledgement seam

- baseline role: `baseline_mock_required`
- recommended lane: `mock_now`
- source dependencies: dep_network_capacity_partner_feeds, dep_origin_practice_ack_rail
- mock must simulate faithfully: Simulate trusted versus stale capacity snapshots, callback fallback, return-to-practice, acknowledgement generations, overdue practice debt, and supplier drift without letting stale feeds or missing ack clear the case.
- placeholder-only areas: real practice names, real site addresses
- failure injection expectations: stale feed, practice acknowledgement overdue, offer invalidated after patient selection, return to practice reopened
- cannot be authoritative: spreadsheet-style partner feed import, booked hub state without current ack generation
- good-enough evidence for current build: preserve proof vs ambiguity vs fallback exactly enough that later live adapters can be dropped in without changing control-plane law

### 7. Cross-organisation secure messaging and MESH seam

- baseline role: `baseline_mock_required`
- recommended lane: `hybrid_mock_then_live`
- source dependencies: dep_cross_org_secure_messaging_mesh
- mock must simulate faithfully: Simulate ordered outbox dispatch, queue acceptance, mailbox receipt, duplicate or reordered callbacks, disputed delivery, proof upgrades, and escalation routes. Transport acceptance alone may never settle hub or pharmacy truth, and the mock must preserve explicit proof versus ambiguity states for every effect chain.
- placeholder-only areas: real mailbox IDs, real certificates
- failure injection expectations: duplicate receipt, reordered callback, accepted for transport but not delivered, mailbox offline
- cannot be authoritative: queue dequeue, transport accepted, mailbox queued
- good-enough evidence for current build: preserve proof vs ambiguity vs fallback exactly enough that later live adapters can be dropped in without changing control-plane law

### 8. IM1 pairing and capability-governance prerequisite seam

- baseline role: `baseline_required`
- recommended lane: `hybrid_mock_then_live`
- source dependencies: dep_im1_pairing_programme
- mock must simulate faithfully: Simulate unsupported, supported-test-only, linkage-required, and blocked capability rows plus pairing-pack freshness states. The mock may not claim live supplier reach or patient-facing capability proof.
- placeholder-only areas: real supplier credentials, live pairing approvals
- failure injection expectations: supported test only, pairing evidence stale, supplier path missing for selected capability
- cannot be authoritative: supplier docs alone, pairing application submitted
- good-enough evidence for current build: preserve proof vs ambiguity vs fallback exactly enough that later live adapters can be dropped in without changing control-plane law

### 9. Pharmacy directory and patient-choice seam

- baseline role: `baseline_mock_required`
- recommended lane: `mock_now`
- source dependencies: dep_pharmacy_directory_dohs
- mock must simulate faithfully: Simulate snapshot freshness, provider opening hours, provider withdrawal, no-safe-choice conditions, warned choices, and consent reset when the selected provider or pathway drifts.
- placeholder-only areas: real pharmacy names, real addresses
- failure injection expectations: directory stale, provider no longer open, warned choice required
- cannot be authoritative: legacy lookup heuristics, directory row without frozen choice proof
- good-enough evidence for current build: preserve proof vs ambiguity vs fallback exactly enough that later live adapters can be dropped in without changing control-plane law

### 10. Email and secure-link notification rail

- baseline role: `baseline_mock_required`
- recommended lane: `mock_now`
- source dependencies: dep_email_notification_provider
- mock must simulate faithfully: Simulate accepted, queued, delivered, bounced, disputed, and expired delivery chains and keep those states separate from current CommunicationEnvelope truth or secure-link authority.
- placeholder-only areas: real domains, real recipient inboxes
- failure injection expectations: queued but not delivered, bounce or suppression, delivery disputed after patient action
- cannot be authoritative: API send acceptance, SMTP accepted response
- good-enough evidence for current build: preserve proof vs ambiguity vs fallback exactly enough that later live adapters can be dropped in without changing control-plane law

### 11. SMS continuation delivery rail

- baseline role: `optional_flagged`
- recommended lane: `actual_later`
- source dependencies: dep_sms_notification_provider
- mock must simulate faithfully: Simulate queued, delayed, bounced, and expired deliveries, seeded versus challenge continuation, and grant issuance without letting provider acceptance imply grant redemption or verified reachability.
- placeholder-only areas: real sender IDs, real recipients
- failure injection expectations: delayed send, wrong recipient suspicion, expired secure link
- cannot be authoritative: provider accepted send, message queued
- good-enough evidence for current build: preserve proof vs ambiguity vs fallback exactly enough that later live adapters can be dropped in without changing control-plane law

### 12. NHS standards and assurance source watch

- baseline role: `baseline_required`
- recommended lane: `mock_now`
- source dependencies: dep_nhs_assurance_and_standards_sources
- mock must simulate faithfully: Maintain one pinned version map, freshness digest, and change-watch signal so new docs or standards changes never silently widen capability or compliance claims.
- placeholder-only areas: remote URLs
- failure injection expectations: watched standard changes, onboarding guide stale
- cannot be authoritative: old documentation snapshot after watch drift
- good-enough evidence for current build: preserve proof vs ambiguity vs fallback exactly enough that later live adapters can be dropped in without changing control-plane law

### 13. NHS App embedded-channel ecosystem

- baseline role: `deferred_channel`
- recommended lane: `deferred`
- source dependencies: dep_nhs_app_embedded_channel_ecosystem
- mock must simulate faithfully: Simulate embedded manifest present or missing, bridge capability denied, safe browser handoff, route-freeze fallback, and placeholder-only embedded visibility. The deferred channel may not imply current-baseline writability.
- placeholder-only areas: real site-link metadata, real embedded host contexts
- failure injection expectations: bridge unavailable, manifest stale, embedded route frozen
- cannot be authoritative: embedded host frame present, placeholder site-link registration
- good-enough evidence for current build: preserve proof vs ambiguity vs fallback exactly enough that later live adapters can be dropped in without changing control-plane law

### 14. Assistive model-vendor boundary

- baseline role: `future_optional`
- recommended lane: `deferred`
- source dependencies: dep_assistive_model_vendor_family
- mock must simulate faithfully: Simulate observe_only, shadow_only, frozen, placeholder_only, and hidden states. Assistive output may not become authoritative action, closure, or patient reassurance in the mock.
- placeholder-only areas: real prompts, real model vendors, real subprocessors
- failure injection expectations: assistive trust withdrawn, rollout frozen, output hidden after watch-tuple drift
- cannot be authoritative: model suggestion, assistive draft alone
- good-enough evidence for current build: preserve proof vs ambiguity vs fallback exactly enough that later live adapters can be dropped in without changing control-plane law

### 15. Optional PDS enrichment seam

- baseline role: `optional_flagged`
- recommended lane: `actual_later`
- source dependencies: dep_pds_fhir_enrichment
- mock must simulate faithfully: Model enrichment absent, enrichment available, partial demographic corroboration, and enrichment rejected without letting the seam widen identity authority or hide local matching uncertainty.
- placeholder-only areas: real demographics, real organisation identifiers, tenant rollout cohorts
- failure injection expectations: PDS unavailable, partial enrichment only, enrichment contradicts local match candidate
- cannot be authoritative: standalone PDS record lookup, PDS response without local binding review
- good-enough evidence for current build: preserve proof vs ambiguity vs fallback exactly enough that later live adapters can be dropped in without changing control-plane law


            ## Section B - Actual_provider_strategy_later

            Live-provider ranking is intentionally different. It emphasizes contract latency, sponsor or assurance burden, and which long-lead families must start early once there is credible MVP evidence.

                          ### 1. Pharmacy dispatch proof and urgent-return seam

              - baseline role: `baseline_mock_required`
              - later-task refs: seq_022, seq_037, seq_038, seq_039, seq_040
              - why live onboarding waits: Real monitored routes, transport assurance, and professional escalation contacts are later onboarding work, but the simulator must already preserve their proof versus ambiguity law.
              - ready to attempt live onboarding means:
                  - seq_037 identifies live transport and urgent-return access paths
- seq_038 captures the simulator backlog for proof deadlines, redispatch, and weak-route ambiguity
- seq_039 freezes the manual approval checkpoints for urgent return and monitored mailbox or phone recovery
- seq_040 freezes dispatch confirmation defaults and no-authority behavior for weak transport proof

              ### 2. NHS login core identity rail

              - baseline role: `baseline_required`
              - later-task refs: seq_022, seq_023, seq_024, seq_025, seq_039, seq_040
              - why live onboarding waits: Current-baseline authenticated and recovery-grade patient authority still depends on real redirect inventory, partner approval, and live session proof before the rail is admissible.
              - ready to attempt live onboarding means:
                  - seq_022 scorecard freezes redirect, scope, and evidence rules for the rail
- seq_023 secret ownership and vault-ingest posture is published for client identifiers and signing material
- seq_024 and seq_025 capture partner access requests plus environment-specific redirect inventory
- GATE_EXTERNAL_TO_FOUNDATION remains blocked until live onboarding proof is current for the active environment

              ### 3. Local booking provider capability and confirmation-truth seam

              - baseline role: `baseline_mock_required`
              - later-task refs: seq_022, seq_026, seq_036, seq_038, seq_039, seq_040
              - why live onboarding waits: Live patient-facing booking still needs provider-path evidence, pairing readiness, and exact confirmation proof before it can move beyond simulator-backed development.
              - ready to attempt live onboarding means:
                  - seq_036 publishes provider sandbox paths and booking capability evidence
- seq_038 builds the local adapter simulator backlog for unsupported or manual supplier paths
- seq_039 and seq_040 freeze manual confirmation checkpoints and degraded-mode defaults

              ### 4. Telephony capture, transcript, and artifact-safety backplane

              - baseline role: `baseline_mock_required`
              - later-task refs: seq_022, seq_023, seq_031, seq_032, seq_034, seq_035, seq_038, seq_039, seq_040
              - why live onboarding waits: Live numbers, recording retention, transcript handling, and scanner placement all carry contract, privacy, and safety review before they become production truth.
              - ready to attempt live onboarding means:
                  - seq_031, seq_032, seq_034, and seq_035 complete the vendor selection and account-setup path
- seq_023 publishes secret ownership for account tokens, webhooks, phone numbers, and project identifiers
- seq_039 freezes manual checkpoints for recording, transcript, and quarantine failure
- seq_040 freezes degraded defaults so telephony never settles routine truth from weak evidence

              ### 5. Pharmacy outcome observation and reconciliation seam

              - baseline role: `baseline_mock_required`
              - later-task refs: seq_022, seq_037, seq_038, seq_039, seq_040
              - why live onboarding waits: Real Update Record or equivalent inbound observation routes need assured combinations and correlation evidence later, but they do not remove the need for a replay-safe mock seam now.
              - ready to attempt live onboarding means:
                  - seq_037 identifies real outcome access paths and update-record constraints
- seq_038 captures simulator coverage for weak-match, duplicate, and manual-review gates
- seq_039 and seq_040 freeze manual-apply, reopen, and no-auto-close defaults for ambiguous outcome evidence

              ### 6. Cross-organisation secure messaging and MESH seam

              - baseline role: `baseline_mock_required`
              - later-task refs: seq_022, seq_023, seq_028, seq_038, seq_039, seq_040
              - why live onboarding waits: Real mailboxes, certificates, minimum-necessary payload review, and cross-org approvals are later work that should start early but must not stall simulator-backed implementation.
              - ready to attempt live onboarding means:
                  - seq_028 completes mailbox or route access requests
- seq_023 publishes certificate and endpoint secret ownership
- seq_039 and seq_040 freeze manual checkpoints and fallback routes for disputed or weak transport proof

              ### 7. Network capacity and practice-acknowledgement seam

              - baseline role: `baseline_mock_required`
              - later-task refs: seq_022, seq_036, seq_038, seq_039, seq_040
              - why live onboarding waits: Live partner feeds and practice acknowledgements still need data-sharing and trust review before they can drive patient-visible offers or closable hub outcomes.
              - ready to attempt live onboarding means:
                  - seq_036 identifies real partner-path evidence relevant to hub booking
- seq_038 and seq_039 freeze simulator scope and manual acknowledgement checkpoints
- seq_040 freezes callback and return-to-practice defaults when source freshness or practice ack is degraded

              ### 8. IM1 pairing and capability-governance prerequisite seam

              - baseline role: `baseline_required`
              - later-task refs: seq_022, seq_023, seq_026, seq_036, seq_039, seq_040
              - why live onboarding waits: IM1 and SCAL readiness are still required before live supplier capability claims are admissible for booking reach, but the corpus explicitly keeps this out of the Phase 2 identity critical path.
              - ready to attempt live onboarding means:
                  - seq_026 completes prerequisite forms and SCAL artifact tracking
- seq_036 captures provider-path evidence against the frozen capability scorecards
- seq_039 and seq_040 freeze manual checkpoints and degraded booking defaults while supplier access is partial

              ### 9. Pharmacy directory and patient-choice seam

              - baseline role: `baseline_mock_required`
              - later-task refs: seq_022, seq_037, seq_038, seq_039, seq_040
              - why live onboarding waits: Live directory access and source-freshness proof remain later onboarding work and should not be treated as a current-baseline blocker while the choice contract is still being built.
              - ready to attempt live onboarding means:
                  - seq_037 documents real directory and update-record access paths
- seq_038 captures simulator backlog coverage for no-safe-choice and stale-directory states
- seq_040 freezes fallback wording and renewed-choice behavior when the directory tuple drifts

              ### 10. Email and secure-link notification rail

              - baseline role: `baseline_mock_required`
              - later-task refs: seq_022, seq_023, seq_031, seq_033, seq_038, seq_039, seq_040
              - why live onboarding waits: Live sender-domain verification, webhook ownership, and delivery evidence still need later onboarding before the system can promote calm patient or staff reassurance from a real provider.
              - ready to attempt live onboarding means:
                  - seq_031 and seq_033 complete vendor selection and sender-domain setup
- seq_023 publishes secret and webhook ownership
- seq_039 and seq_040 freeze resend, callback, and support-repair fallbacks for disputed delivery

              ### 11. SMS continuation delivery rail

              - baseline role: `optional_flagged`
              - later-task refs: seq_022, seq_031, seq_033, seq_039, seq_040
              - why live onboarding waits: SMS remains optional-flagged. Live sender registration and wrong-recipient governance should trail the current MVP proof and never outrank the core identity or booking truth seams.
              - ready to attempt live onboarding means:
                  - seq_031 and seq_033 freeze the vendor path and sender ownership model
- seq_039 captures wrong-recipient and reissue checkpoints
- seq_040 freezes the default fallback away from SMS when the route or grant is stale

              ### 12. NHS App embedded-channel ecosystem

              - baseline role: `deferred_channel`
              - later-task refs: seq_029, seq_030, seq_040
              - why live onboarding waits: Phase 7 remains deferred channel expansion and may not become a current-baseline blocker or reorder the live-provider acquisition queue.
              - ready to attempt live onboarding means:
                  - seq_029 and seq_030 produce only deferred-channel placeholders and access-request strategy
- seq_040 freezes downgrade and safe browser-handoff defaults before any future embedded rollout

              ### 13. Assistive model-vendor boundary

              - baseline role: `future_optional`
              - later-task refs: seq_040
              - why live onboarding waits: Future assistive onboarding depends on intended-use decisions, medical-device boundary review, supplier assurance, and rollout cohorts that remain optional to core completeness.
              - ready to attempt live onboarding means:
                  - A future assistive rollout must carry explicit intended-use and assurance approval
- seq_040 preserves the non-authoritative default even while optional vendor strategy is documented

              ### 14. Optional PDS enrichment seam

              - baseline role: `optional_flagged`
              - later-task refs: seq_022, seq_023, seq_027, seq_040
              - why live onboarding waits: PDS access carries legal-basis, approval, and feature-flag prerequisites and remains a later enrichment strategy rather than a current-baseline blocker.
              - ready to attempt live onboarding means:
                  - seq_027 produces the optional sandbox and feature-flag plan
- seq_040 freezes the no-PDS degraded default and no-authority-escalation law
- Any tenant rollout remains behind explicit legal-basis and governance approval

              ### 15. NHS standards and assurance source watch

              - baseline role: `baseline_required`
              - later-task refs: seq_039, seq_040
              - why live onboarding waits: There is no provider-acquisition track here; later work is watch refresh and exception handling, not a separate onboarding exercise.
              - ready to attempt live onboarding means:
                  - seq_039 records manual review checkpoints when a watched standard changes
- seq_040 freezes current assumption and degraded defaults when standards drift is unresolved

