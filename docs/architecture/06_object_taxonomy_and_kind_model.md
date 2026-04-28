# 06 Object Taxonomy And Kind Model

This taxonomy separates domain truths, control-plane primitives, runtime/publication contracts, and surface projections so later tasks do not flatten them into one noun bucket.

## Kind Model

| Kind | Definition | Count |
| --- | --- | --- |
| aggregate | Durable domain truth with its own lifecycle and mutation rules. | 7 |
| record | Append-only or immutable record of a fact, attempt, decision, or observation. | 182 |
| case | Durable operational case with domain-local workflow and blockers. | 9 |
| thread | Durable conversational or message-centric workflow lineage. | 1 |
| projection | Derived read model or truth bridge for a surface or downstream consumer. | 87 |
| digest | Condensed, read-optimized derivative for prioritization or concise display. | 21 |
| contract | Published or compiled rule contract consumed across runtime boundaries. | 40 |
| policy | Rule or policy source governing decision, visibility, or publication behavior. | 27 |
| bundle | Versioned bundle or package of related contracts, artifacts, or proofs. | 30 |
| manifest | Published manifest enumerating members, artifacts, or runtime composition. | 12 |
| tuple | Explicit tuple object used to bind scope, lineage, or publication facts. | 3 |
| token | Short-lived continuation or correlation token. | 8 |
| grant | Capability or access grant governing what the holder may do. | 6 |
| lease | Fenced ownership or exclusivity primitive with expiry and takeover semantics. | 22 |
| gate | Gate or fence that must be satisfied before work may proceed or settle. | 19 |
| blocker | Explicit blocker object keeping work or closure open until satisfied. | 1 |
| witness | Proof-bearing witness or certificate object. | 6 |
| settlement | Authoritative settlement or completion proof for an action or transition. | 32 |
| checkpoint | Current checkpoint that governs actionability, TTL, or admissibility. | 13 |
| event_contract | Canonical event namespace member, milestone, signal, or envelope contract. | 10 |
| descriptor | Descriptor or binding object that names runtime, surface, or scope shape. | 72 |
| artifact | Published or rendered artifact with governed presentation or proof role. | 22 |
| namespace | Namespace object used to group event or telemetry contracts. | 1 |
| other | Bounded concept retained because the corpus relies on it, but it does not fit a stronger primary kind. | 319 |

## Family Model

| Family | Kinds | Count |
| --- | --- | --- |
| Domain truths and child workflows | aggregate<br>case<br>thread<br>record<br>settlement<br>checkpoint<br>gate<br>lease<br>grant<br>witness<br>blocker | 298 |
| Projection, digest, artifact, and surface descriptors | projection<br>digest<br>descriptor<br>artifact | 202 |
| Policy, contract, bundle, manifest, tuple, namespace, and event contracts | policy<br>contract<br>bundle<br>manifest<br>tuple<br>namespace<br>event_contract | 123 |
| Bounded gap objects |  | 0 |
