# 53 Audit Chain And Disclosure Model

## Hash Chain

- Canonicalization mode: `RFC8785_JCS`.
- Hash algorithm: `SHA-256`.
- Chain root: `be77a689111bda6aa32eeaaa3e1196f5d4a0fd7a5cd555a9daf19a39374e2927`.
- Genesis previous-hash seed: `GENESIS_053_AUDIT_JOIN_SPINE`.

## Required Audit Join Fields

| Field | Why it is mandatory |
| --- | --- |
| `edgeCorrelationId` | Immutable ingress join key across browser intent, command dispatch, projection visibility, and audit. |
| `routeIntentRef` | Prevents route-local shell state from standing in for authoritative route authority. |
| `commandActionRef` + `commandSettlementRef` | Binds accepted and authoritative command truth into the same immutable chain. |
| `uiEventRef` + `uiEventCausalityFrameRef` + `uiTransitionSettlementRef` | Keeps UI continuity and settlement explainable rather than inferred from telemetry. |
| `projectionVisibilityRef` | Proves what became visible before calm success, replay restore, or frozen posture. |
| `selectedAnchorRef` + `shellDecisionClass` | Preserves same-shell continuity and restore semantics in replay and investigation. |
| `disclosureFenceRef` | Makes minimum-necessary disclosure part of canonical audit truth. |

## Supersession And Disclosure

- Supersession is append-only: a later audit row may point to `supersedesAuditRecordRef`, but earlier rows are never mutated in place.
- Source IP and user-agent handling stay hashed or service-identity-only; raw diagnostic payloads are not required for authoritative replay.
- Disclosure fences and masking policy refs remain first-class so audit and export do not widen beyond the approved scope envelope.

## FHIR Companion Matrix

- Companion rows generated: `18`.
- Every companion row asserts `AuditRecord_canonical_companion_only` and uses the same active audit-companion FHIR contract.
