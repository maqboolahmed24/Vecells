# 06 Object Catalog Gap Report

Gap objects are retained because the corpus relies on them semantically, but they still lack one stronger canonical schema block. They are bounded rather than silently omitted.

## Gap Objects

| Object ID | Canonical name | Context | Source | Why bounded |
| --- | --- | --- | --- | --- |

## Risks

- RISK_OBJECT_001: Flow-only gap objects still need stronger standalone blueprint blocks if later implementation tasks require field-level schemas.
- RISK_OBJECT_002: Runtime publication/event-contract objects remain more prose-backed than schema-backed and should be formalized before code generation depends on them mechanically.

## Assumptions

- ASSUMPTION_OBJECT_001: Flow-only nouns were retained as explicit gap or implied objects when the corpus clearly depends on them.
- ASSUMPTION_OBJECT_002: Route families, shell types, audience tiers, and channel profiles stay glossary concepts or contract artifacts rather than being promoted to aggregates.
- ASSUMPTION_OBJECT_003: Child-domain cases remain distinct from canonical Request milestone truth even when the flow baseline uses summary verbs like booked or resolved.
