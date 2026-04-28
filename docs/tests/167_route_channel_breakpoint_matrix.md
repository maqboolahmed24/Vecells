# 167 Route Channel Breakpoint Matrix

The authoritative route rows live in `data/test/167_channel_route_matrix.csv`. This document records the contract interpretation used by the validator and browser suite.

| Route case                          | Request type | Entry posture                | Expected outcome           | Viewports               |
| ----------------------------------- | ------------ | ---------------------------- | -------------------------- | ----------------------- |
| `CH167_SYMPTOMS_URGENT`             | Symptoms     | signed-out start             | urgent diversion required  | mobile, tablet, desktop |
| `CH167_MEDS_ROUTINE_RECEIPT`        | Meds         | signed-out start             | routine receipt            | mobile, tablet, desktop |
| `CH167_ADMIN_ROUTINE_RECEIPT`       | Admin        | signed-out start             | routine receipt            | mobile, tablet, desktop |
| `CH167_RESULTS_ROUTINE_RECEIPT`     | Results      | signed-out start             | routine receipt            | mobile, tablet, desktop |
| `CH167_MINIMAL_TRACKING`            | Meds         | minimal tracking             | request status             | mobile, tablet, desktop |
| `CH167_REFRESH_RESUME`              | Results      | bounded refresh/resume       | safe resume posture        | mobile, tablet, desktop |
| `CH167_STALE_TOKEN_RECOVERY`        | Admin        | stale promoted draft token   | receipt recovery           | mobile, tablet, desktop |
| `CH167_POST_UPLIFT_READONLY_RETURN` | Symptoms     | post-uplift read-only return | same-route read-only shell | mobile, tablet, desktop |

## Route Law

- Every row remains inside `rf_intake_self_service`.
- Every row keeps `patient.portal.requests` as the shell continuity key through the browser proof.
- Outcome rows use `request-return`; in-progress capture rows use `request-proof`.
- The sticky footer/action tray must never obscure focused controls in any viewport.
- Transport or local save messages may support orientation, but they cannot replace the settlement-level status owner.
