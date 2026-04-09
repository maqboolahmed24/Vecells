# 10 Audit Posture And Event Disclosure

Audit, telemetry, and replay now follow one disclosure posture. Standard telemetry and logs keep only PHI-safe descriptors, refs, hashes, and causal identifiers; richer diagnostic evidence requires the audit or investigation scope envelope.

| Event family | Name | Telemetry | Logs | Audit / Replay | Prohibited identifiers |
| --- | --- | --- | --- | --- | --- |
| EV_UI_TELEMETRY_PATIENT | Patient and public UI telemetry | descriptor_and_hash_only | diagnostic_refs_only | bounded_detail_with_scope | raw JWT<br>raw phone number<br>message body<br>clinical narrative<br>full route params<br>assertedLoginIdentity |
| EV_UI_TELEMETRY_EMBEDDED | Embedded NHS App UI telemetry | descriptor_and_hash_only | diagnostic_refs_only | bounded_detail_with_scope | assertedLoginIdentity<br>JWT body<br>raw destination URL<br>raw document title with PHI |
| EV_UI_TELEMETRY_WORKSPACE | Workspace, hub, pharmacy, and support UI telemetry | masked_scope_and_refs_only | masked_scope_and_refs_only | bounded_detail_with_scope | raw patient name<br>raw phone number<br>thread body<br>artifact bytes<br>raw identity claim |
| EV_STRUCTURED_LOG_RUNTIME | Structured application and worker logs | not_applicable | diagnostic_refs_only | bounded_detail_with_scope | JWT<br>secret<br>raw phone number<br>raw claim snapshot<br>clinical narrative<br>message body |
| EV_CANONICAL_EVENT_BUS | Canonical domain events crossing internal boundaries | descriptor_and_hash_only | diagnostic_refs_only | bounded_detail_with_scope | raw identity values<br>raw phone numbers<br>contact claims<br>secret material |
| EV_IMMUTABLE_AUDIT_LEDGER | Immutable audit ledger | audit_reference_only | audit_reference_only | bounded_detail_with_scope | unmasked replay body outside scope<br>free-form payload dump |
| EV_ASSURANCE_LEDGER_ENTRY | Assurance ledger and evidence graph entries | audit_reference_only | audit_reference_only | bounded_detail_with_scope | raw source payload<br>inline clinical content<br>raw secret material |
| EV_SUPPORT_REPLAY_VIEW | Support replay and observe views | masked_scope_and_refs_only | masked_scope_and_refs_only | masked_timeline | held drafts<br>raw message body outside current mask scope<br>broader anchor than the source envelope |
| EV_BREAK_GLASS_REVIEW | Break-glass review records and UI | masked_scope_and_refs_only | audit_reference_only | bounded_detail_with_scope | broad unscoped timeline<br>mutating command payloads |
| EV_INVESTIGATION_EXPORT_BUNDLE | Investigation, export, and replay bundles | descriptor_only | audit_reference_only | full_evidence_with_scope | scope drift<br>fresher anchor than the source query<br>export without redaction transform |
| EV_ARTIFACT_HANDOFF_AUDIT | Artifact handoff, download, and print audit trail | descriptor_only | diagnostic_refs_only | bounded_detail_with_scope | raw PHI URL<br>download token<br>browser history fallback only |

## Platform Rules

- Standard telemetry is sufficient for deterministic replay only through hashes, ids, class codes, and causal tokens.
- Immutable audit, assurance ledger, support replay, and investigation export each stay bound to one current scope envelope.
- Structured logs remain diagnostic only and are not a substitute export surface.
