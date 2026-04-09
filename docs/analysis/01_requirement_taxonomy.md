# Requirement taxonomy

The registry normalizes individual rows into the six task-driven taxonomy buckets required by Prompt 001. Each bucket keeps its original source traceability and requirement type.

| Taxonomy bucket | Requirement types | Count |
| --- | --- | --- |
| UI and continuity requirements | `accessibility`, `content`, `frontend` | 145 |
| audit and assurance requirements | `assurance` | 114 |
| business capability requirements | `functional`, `workflow` | 20 |
| control-plane requirements | `backend`, `domain_object`, `invariant`, `state_machine` | 237 |
| runtime and release requirements | `runtime_release`, `test` | 911 |
| safety, identity, and privacy requirements | `privacy`, `security` | 26 |

## Notes

- `domain_object`, `invariant`, `state_machine`, `backend`, and `integration` rows form the machine-readable control plane expected by later roadmap tasks.
- `frontend`, `accessibility`, and `content` rows capture shell continuity, artifact posture, semantic coverage, and user-facing communication duties.
- `runtime_release`, `test`, and `assurance` rows preserve the verification ladder, release tuples, and anti-regression controls needed for promotion and conformance gates.
- `derived_from_canonical_gap_closure` rows remain distinct from original prose so later tasks can tell patched requirements from directly stated canonical contracts.
