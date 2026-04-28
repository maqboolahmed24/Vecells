# 57 Mock Now vs Actual Provider Strategy

Every provider-shaped boundary below carries explicit `Mock_now_execution` and `Actual_provider_strategy_later` sections. The required live cutover must preserve the same replay, callback-ordering, authoritative-proof, and degradation semantics already used in the simulator-backed path.

## NHS login auth bridge

### Mock_now_execution

- Execution workload: `wf_integration_simulation_lab`
- Auth model: Opaque session twin with deterministic state/nonce and subject binding versions.
- Request/response law: Use the published route intent, action record, effectKey, and allowed FHIR refs only; no simulator-local payload widening is permitted.
- Callback and ordering: Replay-safe browser callback plus same-fence session establishment.
- Fault injection: callback_replay, subject_mismatch, consent_declined
- Seeded fixtures: identity_subject_catalog, grant_scope_envelopes, route_intent_fixtures
- Observability hooks: auth.callback.accepted, auth.callback.replayed, identity.binding.blocked

### Actual_provider_strategy_later

- Execution workload: `wf_integration_dispatch`
- Onboarding prerequisites: Partner approval and current redirect inventory, Technical conformance evidence, Environment-specific callback and session-parity rehearsal
- Security posture: Vault-backed redirect secrets later; simulator secrets remain local and synthetic now.
- Operational evidence: Callback replay and nonce fence parity, Consent decline and subject-mismatch recovery parity, Writable-versus-read-only session establishment parity
- Bound differences: Callback success alone never equals writable authority, Claim-pending and auth-read-only remain separate post-auth states, Route-intent binding remains mandatory for write access, Replay and callback ordering stay identical, Authoritative proof ladder stays identical, Degradation posture remains bounded
- Rollback: Withdraw live callback tuple and return immediately to simulator-backed recovery mode.

## Optional PDS enrichment seam

### Mock_now_execution

- Execution workload: `wf_integration_simulation_lab`
- Auth model: Opaque session twin with deterministic state/nonce and subject binding versions.
- Request/response law: Use the published route intent, action record, effectKey, and allowed FHIR refs only; no simulator-local payload widening is permitted.
- Callback and ordering: Replay-safe browser callback plus same-fence session establishment.
- Fault injection: callback_replay, subject_mismatch, consent_declined
- Seeded fixtures: identity_subject_catalog, grant_scope_envelopes, route_intent_fixtures
- Observability hooks: auth.callback.accepted, auth.callback.replayed, identity.binding.blocked

### Actual_provider_strategy_later

- Execution workload: `wf_integration_dispatch`
- Onboarding prerequisites: Legal basis and selected access mode, Named approver and environment, Wrong-patient and rollback readiness evidence
- Security posture: Vault-backed redirect secrets later; simulator secrets remain local and synthetic now.
- Operational evidence: Feature-flag-off parity, No-match/multi-match regression, Wrong-patient hold preservation
- Bound differences: PDS stays optional and feature-flagged, Local binding and NHS login remain the baseline identity authority, Wrong-patient repair holds remain explicit even when enrichment is enabled, Replay and callback ordering stay identical, Authoritative proof ladder stays identical, Degradation posture remains bounded
- Rollback: Withdraw live callback tuple and return immediately to simulator-backed recovery mode.

## Telephony and IVR provider

### Mock_now_execution

- Execution workload: `wf_integration_simulation_lab`
- Auth model: Simulator-issued endpoint and webhook credentials with replay-safe event IDs.
- Request/response law: Use the published route intent, action record, effectKey, and allowed FHIR refs only; no simulator-local payload widening is permitted.
- Callback and ordering: Webhook or callback ingestion always replays onto the same provider correlation fence.
- Fault injection: duplicate_delivery, webhook_replay, unknown_recipient, delivery_timeout
- Seeded fixtures: message_dispatch_rows, delivery_event_sequences, callback_contact_routes
- Observability hooks: adapter.dispatch.accepted, adapter.receipt.replayed, delivery.disputed

### Actual_provider_strategy_later

- Execution workload: `wf_integration_dispatch`
- Onboarding prerequisites: Vendor approval and spend authority, Webhook security and replay posture, Recording policy approval plus named environment
- Security posture: Secrets later come from provider vault material; simulator webhooks stay deterministic and synthetic.
- Operational evidence: Urgent-live preemption parity, Recording-missing recovery parity, Webhook replay and signature-failure parity
- Bound differences: Webhook success never equals clinically usable evidence by itself, Urgent-live preemption outranks routine continuation, Recording availability stays weaker than evidence readiness, Replay and callback ordering stay identical, Authoritative proof ladder stays identical, Degradation posture remains bounded
- Rollback: Disable live webhook entry and continue from simulator-backed resend and repair drills.

## Transcription processing provider

### Mock_now_execution

- Execution workload: `wf_integration_simulation_lab`
- Auth model: Fixture-backed processing queues with seeded artifact and transcript catalogs.
- Request/response law: Use the published route intent, action record, effectKey, and allowed FHIR refs only; no simulator-local payload widening is permitted.
- Callback and ordering: Polling or callback ingest joins the same artifact or evidence fence.
- Fault injection: extractor_timeout, conflicting_outputs, malware_detection
- Seeded fixtures: evidence_snapshot_rows, artifact_hash_catalog, processing_fault_profiles
- Observability hooks: artifact.scan.accepted, artifact.scan.quarantined, transcript.derivation.failed

### Actual_provider_strategy_later

- Execution workload: `wf_integration_dispatch`
- Onboarding prerequisites: Region and retention posture, Webhook security evidence, Named approver and final operator acknowledgement
- Security posture: Live provider credentials later require artifact-scope IAM and quarantine-safe storage; mock uses local fixture-only material.
- Operational evidence: Queued/partial/ready parity, Supersession regression, Manual-review requirement parity
- Bound differences: Transcript output remains derivative, not source truth, Manual review remains explicit when coverage is inadequate, Superseded transcript runs stay visible and replayable, Replay and callback ordering stay identical, Authoritative proof ladder stays identical, Degradation posture remains bounded
- Rollback: Stop live processing adapters and preserve simulator-based quarantine and transcript drills.

## SMS notification provider

### Mock_now_execution

- Execution workload: `wf_integration_simulation_lab`
- Auth model: Simulator-issued endpoint and webhook credentials with replay-safe event IDs.
- Request/response law: Use the published route intent, action record, effectKey, and allowed FHIR refs only; no simulator-local payload widening is permitted.
- Callback and ordering: Webhook or callback ingestion always replays onto the same provider correlation fence.
- Fault injection: duplicate_delivery, webhook_replay, unknown_recipient, delivery_timeout
- Seeded fixtures: message_dispatch_rows, delivery_event_sequences, callback_contact_routes
- Observability hooks: adapter.dispatch.accepted, adapter.receipt.replayed, delivery.disputed

### Actual_provider_strategy_later

- Execution workload: `wf_integration_dispatch`
- Onboarding prerequisites: Repair policy approval, Audit log export and replay guard evidence, Human-only checkpoint policy from seq_039
- Security posture: Secrets later come from provider vault material; simulator webhooks stay deterministic and synthetic.
- Operational evidence: Replay fence regression, Controlled resend authorization parity, Support repair visibility parity
- Bound differences: Controlled resend always stays explicit and audited, Support replay never bypasses repair windows or scope fences, Disputed delivery remains a first-class blocker, Replay and callback ordering stay identical, Authoritative proof ladder stays identical, Degradation posture remains bounded
- Rollback: Disable live webhook entry and continue from simulator-backed resend and repair drills.

## Email notification provider

### Mock_now_execution

- Execution workload: `wf_integration_simulation_lab`
- Auth model: Simulator-issued endpoint and webhook credentials with replay-safe event IDs.
- Request/response law: Use the published route intent, action record, effectKey, and allowed FHIR refs only; no simulator-local payload widening is permitted.
- Callback and ordering: Webhook or callback ingestion always replays onto the same provider correlation fence.
- Fault injection: duplicate_delivery, webhook_replay, unknown_recipient, delivery_timeout
- Seeded fixtures: message_dispatch_rows, delivery_event_sequences, callback_contact_routes
- Observability hooks: adapter.dispatch.accepted, adapter.receipt.replayed, delivery.disputed

### Actual_provider_strategy_later

- Execution workload: `wf_integration_dispatch`
- Onboarding prerequisites: Repair policy approval, Audit log export and replay guard evidence, Human-only checkpoint policy from seq_039
- Security posture: Secrets later come from provider vault material; simulator webhooks stay deterministic and synthetic.
- Operational evidence: Replay fence regression, Controlled resend authorization parity, Support repair visibility parity
- Bound differences: Controlled resend always stays explicit and audited, Support replay never bypasses repair windows or scope fences, Disputed delivery remains a first-class blocker, Replay and callback ordering stay identical, Authoritative proof ladder stays identical, Degradation posture remains bounded
- Rollback: Disable live webhook entry and continue from simulator-backed resend and repair drills.

## Malware scanning provider

### Mock_now_execution

- Execution workload: `wf_integration_simulation_lab`
- Auth model: Fixture-backed processing queues with seeded artifact and transcript catalogs.
- Request/response law: Use the published route intent, action record, effectKey, and allowed FHIR refs only; no simulator-local payload widening is permitted.
- Callback and ordering: Polling or callback ingest joins the same artifact or evidence fence.
- Fault injection: extractor_timeout, conflicting_outputs, malware_detection
- Seeded fixtures: evidence_snapshot_rows, artifact_hash_catalog, processing_fault_profiles
- Observability hooks: artifact.scan.accepted, artifact.scan.quarantined, transcript.derivation.failed

### Actual_provider_strategy_later

- Execution workload: `wf_integration_dispatch`
- Onboarding prerequisites: Storage scope and quarantine policy, Webhook security and mutation gate posture, Named approver and operator acknowledgement
- Security posture: Live provider credentials later require artifact-scope IAM and quarantine-safe storage; mock uses local fixture-only material.
- Operational evidence: Suspicious/quarantine parity, Unreadable artifact regression, Manual release parity
- Bound differences: Suspicious and quarantined remain separate outcomes, Unreadable artifacts never silently pass, Manual release from quarantine remains explicit and auditable, Replay and callback ordering stay identical, Authoritative proof ladder stays identical, Degradation posture remains bounded
- Rollback: Stop live processing adapters and preserve simulator-based quarantine and transcript drills.

## IM1 pairing programme boundary

### Mock_now_execution

- Execution workload: `wf_integration_simulation_lab`
- Auth model: Provider twin uses deterministic supplier, practice, and roster tuples only.
- Request/response law: Use the published route intent, action record, effectKey, and allowed FHIR refs only; no simulator-local payload widening is permitted.
- Callback and ordering: Search, hold, commit, and manage callbacks replay onto one BookingProviderAdapterBinding hash.
- Fault injection: hold_expiry, capability_gap, confirmation_pending, projection_mismatch
- Seeded fixtures: supplier_roster_rows, booking_slot_windows, capacity_feed_snapshots
- Observability hooks: booking.adapter.accepted, booking.provider.receipt, booking.provider.collision_review

### Actual_provider_strategy_later

- Execution workload: `wf_integration_dispatch`
- Onboarding prerequisites: Current supplier roster and pairing approval, Bounded use-case approval, Named sponsor, approver, and environment
- Security posture: Live supplier credentials later remain estate-scoped and mutation-gated; simulator keeps supplier tuples synthetic.
- Operational evidence: Search/hold/commit parity, Commit ambiguity regression, Manage-booking coverage parity
- Bound differences: Supplier capability matrices remain explicit, Hold expiry and commit ambiguity stay separate from calm confirmation, Local waitlist and fallback law remain core-owned, Replay and callback ordering stay identical, Authoritative proof ladder stays identical, Degradation posture remains bounded
- Rollback: Withdraw live provider binding and revert all booking routes to simulator or assisted fallback mode.

## GP supplier path boundary

### Mock_now_execution

- Execution workload: `wf_integration_simulation_lab`
- Auth model: Provider twin uses deterministic supplier, practice, and roster tuples only.
- Request/response law: Use the published route intent, action record, effectKey, and allowed FHIR refs only; no simulator-local payload widening is permitted.
- Callback and ordering: Search, hold, commit, and manage callbacks replay onto one BookingProviderAdapterBinding hash.
- Fault injection: hold_expiry, capability_gap, confirmation_pending, projection_mismatch
- Seeded fixtures: supplier_roster_rows, booking_slot_windows, capacity_feed_snapshots
- Observability hooks: booking.adapter.accepted, booking.provider.receipt, booking.provider.collision_review

### Actual_provider_strategy_later

- Execution workload: `wf_integration_dispatch`
- Onboarding prerequisites: Current supplier roster and pairing approval, Bounded use-case approval, Named sponsor, approver, and environment
- Security posture: Live supplier credentials later remain estate-scoped and mutation-gated; simulator keeps supplier tuples synthetic.
- Operational evidence: Search/hold/commit parity, Commit ambiguity regression, Manage-booking coverage parity
- Bound differences: Supplier capability matrices remain explicit, Hold expiry and commit ambiguity stay separate from calm confirmation, Local waitlist and fallback law remain core-owned, Replay and callback ordering stay identical, Authoritative proof ladder stays identical, Degradation posture remains bounded
- Rollback: Withdraw live provider binding and revert all booking routes to simulator or assisted fallback mode.

## Local booking supplier adapters

### Mock_now_execution

- Execution workload: `wf_integration_simulation_lab`
- Auth model: Provider twin uses deterministic supplier, practice, and roster tuples only.
- Request/response law: Use the published route intent, action record, effectKey, and allowed FHIR refs only; no simulator-local payload widening is permitted.
- Callback and ordering: Search, hold, commit, and manage callbacks replay onto one BookingProviderAdapterBinding hash.
- Fault injection: hold_expiry, capability_gap, confirmation_pending, projection_mismatch
- Seeded fixtures: supplier_roster_rows, booking_slot_windows, capacity_feed_snapshots
- Observability hooks: booking.adapter.accepted, booking.provider.receipt, booking.provider.collision_review

### Actual_provider_strategy_later

- Execution workload: `wf_integration_dispatch`
- Onboarding prerequisites: Bounded booking MVP and architecture refresh, Named sponsor plus commissioning posture, Practice acknowledgement route evidence
- Security posture: Live supplier credentials later remain estate-scoped and mutation-gated; simulator keeps supplier tuples synthetic.
- Operational evidence: Ambiguous confirmation parity, Practice acknowledgement overdue regression, Commit-to-projection replay parity
- Bound differences: Acceptance never outruns confirmation truth, Practice acknowledgement remains separate from patient reassurance, Manual callback fallback remains explicit when proof is incomplete, Replay and callback ordering stay identical, Authoritative proof ladder stays identical, Degradation posture remains bounded
- Rollback: Withdraw live provider binding and revert all booking routes to simulator or assisted fallback mode.

## Network capacity partner feeds

### Mock_now_execution

- Execution workload: `wf_integration_simulation_lab`
- Auth model: Provider twin uses deterministic supplier, practice, and roster tuples only.
- Request/response law: Use the published route intent, action record, effectKey, and allowed FHIR refs only; no simulator-local payload widening is permitted.
- Callback and ordering: Search, hold, commit, and manage callbacks replay onto one BookingProviderAdapterBinding hash.
- Fault injection: hold_expiry, capability_gap, confirmation_pending, projection_mismatch
- Seeded fixtures: supplier_roster_rows, booking_slot_windows, capacity_feed_snapshots
- Observability hooks: booking.adapter.accepted, booking.provider.receipt, booking.provider.collision_review

### Actual_provider_strategy_later

- Execution workload: `wf_integration_dispatch`
- Onboarding prerequisites: Named partner feed provenance, Freshness and expiry policy, Callback fallback ownership evidence
- Security posture: Live supplier credentials later remain estate-scoped and mutation-gated; simulator keeps supplier tuples synthetic.
- Operational evidence: Stale-capacity regression, No-slot callback fallback parity, Feed freshness indicator parity
- Bound differences: No-slot and callback-required remain explicit states, Freshness proof stays visible to operators, Capacity feed updates never erase confirmation truth gates, Replay and callback ordering stay identical, Authoritative proof ladder stays identical, Degradation posture remains bounded
- Rollback: Withdraw live provider binding and revert all booking routes to simulator or assisted fallback mode.

## MESH secure messaging rail

### Mock_now_execution

- Execution workload: `wf_integration_simulation_lab`
- Auth model: Mailbox simulator uses deterministic ODS, mailbox, and route manager tuples.
- Request/response law: Use the published route intent, action record, effectKey, and allowed FHIR refs only; no simulator-local payload widening is permitted.
- Callback and ordering: Receipts and polling both replay to one mailbox or acknowledgement fence.
- Fault injection: ack_missing, partial_acceptance, duplicate_delivery
- Seeded fixtures: mailbox_paths, partner_ack_sequences, message_bundle_hashes
- Observability hooks: mesh.dispatch.accepted, mesh.receipt.replayed, mesh.delivery.escalated

### Actual_provider_strategy_later

- Execution workload: `wf_integration_dispatch`
- Onboarding prerequisites: Named ODS owner and manager mode, API onboarding completion or approved live path, Minimum-necessary review plus named approver
- Security posture: Later live mailbox ownership and manager mode stay explicit; simulator uses local mailbox twins only.
- Operational evidence: Receipt ambiguity parity, Replay and duplicate delivery regression, Workflow-specific escalation parity
- Bound differences: Transport receipt remains supporting evidence, not business truth, Replay fences stay mandatory, Escalation behavior remains explicit when mailbox or secure transport degrades, Replay and callback ordering stay identical, Authoritative proof ladder stays identical, Degradation posture remains bounded
- Rollback: Return immediately to simulator-backed secure messaging and manual escalation.

## Origin-practice acknowledgement rail

### Mock_now_execution

- Execution workload: `wf_integration_simulation_lab`
- Auth model: Mailbox simulator uses deterministic ODS, mailbox, and route manager tuples.
- Request/response law: Use the published route intent, action record, effectKey, and allowed FHIR refs only; no simulator-local payload widening is permitted.
- Callback and ordering: Receipts and polling both replay to one mailbox or acknowledgement fence.
- Fault injection: ack_missing, partial_acceptance, duplicate_delivery
- Seeded fixtures: mailbox_paths, partner_ack_sequences, message_bundle_hashes
- Observability hooks: mesh.dispatch.accepted, mesh.receipt.replayed, mesh.delivery.escalated

### Actual_provider_strategy_later

- Execution workload: `wf_integration_dispatch`
- Onboarding prerequisites: Bounded booking MVP and architecture refresh, Named sponsor plus commissioning posture, Practice acknowledgement route evidence
- Security posture: Later live mailbox ownership and manager mode stay explicit; simulator uses local mailbox twins only.
- Operational evidence: Ambiguous confirmation parity, Practice acknowledgement overdue regression, Commit-to-projection replay parity
- Bound differences: Acceptance never outruns confirmation truth, Practice acknowledgement remains separate from patient reassurance, Manual callback fallback remains explicit when proof is incomplete, Replay and callback ordering stay identical, Authoritative proof ladder stays identical, Degradation posture remains bounded
- Rollback: Return immediately to simulator-backed secure messaging and manual escalation.

## Pharmacy directory boundary

### Mock_now_execution

- Execution workload: `wf_integration_simulation_lab`
- Auth model: Directory, transport, and outcome twins use seeded provider and consent tuples.
- Request/response law: Use the published route intent, action record, effectKey, and allowed FHIR refs only; no simulator-local payload widening is permitted.
- Callback and ordering: Dispatch receipts, directory refresh, and outcome callbacks collapse onto one pharmacy case fence.
- Fault injection: directory_tuple_drift, transport_timeout, outcome_disputed, urgent_return_required
- Seeded fixtures: pharmacy_directory_rows, dispatch_envelopes, pharmacy_outcome_events
- Observability hooks: pharmacy.dispatch.accepted, pharmacy.outcome.disputed, pharmacy.urgent_return.required

### Actual_provider_strategy_later

- Execution workload: `wf_integration_dispatch`
- Onboarding prerequisites: Service Search access approval and route policy, Choice tuple freshness and capability evidence, Current environment-specific directory entitlement
- Security posture: Live access later needs named approver, environment, and urgent-return evidence; simulator stays local and deterministic.
- Operational evidence: Choice-tuple binding parity, Directory refresh regression, No-safe-provider fallback parity
- Bound differences: Choice proof binds the exact directory tuple, Directory lookup never equals dispatch or closure proof, Refresh and no-safe-provider states remain first-class, Replay and callback ordering stay identical, Authoritative proof ladder stays identical, Degradation posture remains bounded
- Rollback: Disable live route immediately and continue from simulator or manual pharmacy handoff.

## Pharmacy referral transport

### Mock_now_execution

- Execution workload: `wf_integration_simulation_lab`
- Auth model: Directory, transport, and outcome twins use seeded provider and consent tuples.
- Request/response law: Use the published route intent, action record, effectKey, and allowed FHIR refs only; no simulator-local payload widening is permitted.
- Callback and ordering: Dispatch receipts, directory refresh, and outcome callbacks collapse onto one pharmacy case fence.
- Fault injection: directory_tuple_drift, transport_timeout, outcome_disputed, urgent_return_required
- Seeded fixtures: pharmacy_directory_rows, dispatch_envelopes, pharmacy_outcome_events
- Observability hooks: pharmacy.dispatch.accepted, pharmacy.outcome.disputed, pharmacy.urgent_return.required

### Actual_provider_strategy_later

- Execution workload: `wf_integration_dispatch`
- Onboarding prerequisites: Named transport route profile and provider tuple, Dispatch proof and acknowledgement thresholds signed off, Manual urgent-return ownership rehearsal evidence
- Security posture: Live access later needs named approver, environment, and urgent-return evidence; simulator stays local and deterministic.
- Operational evidence: Dispatch acceptance-versus-confirmation parity, Expiry and redispatch regression, Urgent-return manual fallback preservation
- Bound differences: Dispatch proof never equals settled referral truth on acceptance alone, Acknowledgement and expiry remain separate facts, Manual urgent-return remains first-class even after live transport exists, Replay and callback ordering stay identical, Authoritative proof ladder stays identical, Degradation posture remains bounded
- Rollback: Disable live route immediately and continue from simulator or manual pharmacy handoff.

## Pharmacy outcome observation

### Mock_now_execution

- Execution workload: `wf_integration_simulation_lab`
- Auth model: Directory, transport, and outcome twins use seeded provider and consent tuples.
- Request/response law: Use the published route intent, action record, effectKey, and allowed FHIR refs only; no simulator-local payload widening is permitted.
- Callback and ordering: Dispatch receipts, directory refresh, and outcome callbacks collapse onto one pharmacy case fence.
- Fault injection: directory_tuple_drift, transport_timeout, outcome_disputed, urgent_return_required
- Seeded fixtures: pharmacy_directory_rows, dispatch_envelopes, pharmacy_outcome_events
- Observability hooks: pharmacy.dispatch.accepted, pharmacy.outcome.disputed, pharmacy.urgent_return.required

### Actual_provider_strategy_later

- Execution workload: `wf_integration_dispatch`
- Onboarding prerequisites: Assured supplier/system combination for Update Record, Reconciliation runtime implementation reference, Watch-register closure for visibility and manual fallback gaps
- Security posture: Live access later needs named approver, environment, and urgent-return evidence; simulator stays local and deterministic.
- Operational evidence: Weak-match and duplicate-outcome parity, Practice-disabled fallback parity, No-auto-close reconciliation regression
- Bound differences: Update Record is visibility only, never urgent transport, Weak or delayed outcomes never auto-close the request lineage, Practice-disabled fallback remains explicit and same-shell, Replay and callback ordering stay identical, Authoritative proof ladder stays identical, Degradation posture remains bounded
- Rollback: Disable live route immediately and continue from simulator or manual pharmacy handoff.

## Pharmacy urgent-return routes

### Mock_now_execution

- Execution workload: `wf_integration_simulation_lab`
- Auth model: Directory, transport, and outcome twins use seeded provider and consent tuples.
- Request/response law: Use the published route intent, action record, effectKey, and allowed FHIR refs only; no simulator-local payload widening is permitted.
- Callback and ordering: Dispatch receipts, directory refresh, and outcome callbacks collapse onto one pharmacy case fence.
- Fault injection: directory_tuple_drift, transport_timeout, outcome_disputed, urgent_return_required
- Seeded fixtures: pharmacy_directory_rows, dispatch_envelopes, pharmacy_outcome_events
- Observability hooks: pharmacy.dispatch.accepted, pharmacy.outcome.disputed, pharmacy.urgent_return.required

### Actual_provider_strategy_later

- Execution workload: `wf_integration_dispatch`
- Onboarding prerequisites: Named approver and environment, Secret posture and callback parity review, Bounded rollback to simulator-safe mode
- Security posture: Live access later needs named approver, environment, and urgent-return evidence; simulator stays local and deterministic.
- Operational evidence: Replay parity proof, Authoritative proof versus transport evidence proof, Rollback rehearsal
- Bound differences: Replay and callback ordering stay identical, Authoritative proof ladder stays identical, Degradation posture remains bounded
- Rollback: Disable live route immediately and continue from simulator or manual pharmacy handoff.

## NHS App embedded ecosystem

### Mock_now_execution

- Execution workload: `wf_integration_simulation_lab`
- Auth model: Embedded bridge twin uses placeholder site-link and signed continuity fixtures.
- Request/response law: Use the published route intent, action record, effectKey, and allowed FHIR refs only; no simulator-local payload widening is permitted.
- Callback and ordering: Return callbacks, embedded claims, and site-link evidence replay onto the same bridge fence.
- Fault injection: site_link_mismatch, callback_drift, channel_reentry_conflict
- Seeded fixtures: embedded_site_links, embedded_claim_paths, bridge_recovery_routes
- Observability hooks: embedded.bridge.accepted, embedded.bridge.recovery_only, embedded.bridge.drifted

### Actual_provider_strategy_later

- Execution workload: `wf_integration_dispatch`
- Onboarding prerequisites: Scope-window approval and commissioning posture, Current NHS login readiness for embedded use, Named environment, approver, and release evidence
- Security posture: Live site-link and bridge metadata remain environment-scoped and mutation-gated; simulator uses local placeholders only.
- Operational evidence: Embedded return parity, Webview limitation regression, Site-link publication parity
- Bound differences: Embedded return intent remains explicit, Header suppression and webview constraints remain testable, Site-link publication stays environment-scoped and mutation-gated, Replay and callback ordering stay identical, Authoritative proof ladder stays identical, Degradation posture remains bounded
- Rollback: Withdraw live embedded metadata and return immediately to the simulator bridge twin.

## Assistive vendor watch boundary

### Mock_now_execution

- Execution workload: `wf_integration_simulation_lab`
- Auth model: Watch-only shadow twins expose deterministic source digests and vendor verdict stubs.
- Request/response law: Use the published route intent, action record, effectKey, and allowed FHIR refs only; no simulator-local payload widening is permitted.
- Callback and ordering: Polling or import receipts replay onto one watch tuple and one source digest.
- Fault injection: source_drift, quarantine_required, digest_collision
- Seeded fixtures: assurance_source_snapshots, assistive_vendor_verdicts, watch_tuple_rows
- Observability hooks: assurance.watch.drifted, assistive.vendor.quarantined, standards.watch.blocked

### Actual_provider_strategy_later

- Execution workload: `wf_integration_dispatch`
- Onboarding prerequisites: Named approver and environment, Secret posture and callback parity review, Bounded rollback to simulator-safe mode
- Security posture: Live vendor and standards calls later remain read-mostly and digest-bound; current watch twins stay synthetic.
- Operational evidence: Replay parity proof, Authoritative proof versus transport evidence proof, Rollback rehearsal
- Bound differences: Replay and callback ordering stay identical, Authoritative proof ladder stays identical, Degradation posture remains bounded
- Rollback: Disable live watch ingestion and preserve the local watch-cache twins.

## NHS standards and assurance source watch

### Mock_now_execution

- Execution workload: `wf_integration_simulation_lab`
- Auth model: Watch-only shadow twins expose deterministic source digests and vendor verdict stubs.
- Request/response law: Use the published route intent, action record, effectKey, and allowed FHIR refs only; no simulator-local payload widening is permitted.
- Callback and ordering: Polling or import receipts replay onto one watch tuple and one source digest.
- Fault injection: source_drift, quarantine_required, digest_collision
- Seeded fixtures: assurance_source_snapshots, assistive_vendor_verdicts, watch_tuple_rows
- Observability hooks: assurance.watch.drifted, assistive.vendor.quarantined, standards.watch.blocked

### Actual_provider_strategy_later

- Execution workload: `wf_integration_dispatch`
- Onboarding prerequisites: Named approver and environment, Secret posture and callback parity review, Bounded rollback to simulator-safe mode
- Security posture: Live vendor and standards calls later remain read-mostly and digest-bound; current watch twins stay synthetic.
- Operational evidence: Replay parity proof, Authoritative proof versus transport evidence proof, Rollback rehearsal
- Bound differences: Replay and callback ordering stay identical, Authoritative proof ladder stays identical, Degradation posture remains bounded
- Rollback: Disable live watch ingestion and preserve the local watch-cache twins.
