# 37 Pharmacy Provider Gap And Watch Register

The watch register keeps the uncomfortable truth visible: live pharmacy routing is still blocked until route-specific access, transport assurance, visibility posture, and urgent fallback ownership all become concrete.

## Gap and watch matrix

| Gap | Route | Severity | Blocks actual strategy | Summary | Next step |
| --- | --- | --- | --- | --- | --- |
| GAP_PHARM_001 | service_search_v3_primary_candidate | high | yes | The live Service Search access path, certificate or credential posture, and tenancy overlays are not yet onboarded. | Carry directory onboarding through later provider access tasks before any live claim is made. |
| GAP_PHARM_002 | eps_dos_supporting_route | medium | no | EPS-facing supporting posture remains legacy debt and must not silently become the main directory story. | Keep the route watch-only until a separate policy review says otherwise. |
| GAP_PHARM_003 | dispatch_transport_primary_candidate | high | yes | The live referral dispatch route, proof thresholds, and manual-assisted redispatch posture are not yet frozen. | Complete the live transport selection and assurance-profile review before any provider claim. |
| GAP_PHARM_004 | gp_update_record_assured_path | high | yes | Seq_037 does not yet name the exact assured community-pharmacy and GP-system combination for Update Record. | Record the named combination and environment before any live visibility claim. |
| GAP_PHARM_005 | manual_nhsmail_or_phone_fallback | high | yes | The monitored mailbox or professional phone owner chain is not yet recorded per live tenant. | Freeze ownership and rehearse acknowledgement escalation before claiming a live urgent route. |
| GAP_PHARM_006 | practice_disabled_update_record_fallback | medium | no | The manual visibility runbook exists conceptually, but the per-practice rehearsal evidence is not yet current. | Exercise the disabled-Update-Record branch before allowing quiet operational assumptions. |
| GAP_PHARM_007 | mesh_or_transport_observation_dependency | high | yes | Supporting mailbox or workflow posture remains a watch dependency and cannot be treated as settled transport proof. | Keep seq_028 mailbox or workflow governance tied to the pharmacy route decision before any live opening. |
| GAP_PHARM_008 | gp_update_record_assured_path | high | yes | Weak-match, duplicate, and replay handling remain blocked until outcome parser quality and manual-review thresholds are signed off. | Freeze parser quality and manual-review policy before any live summary ingestion claim. |

## Gate-state digest

| Gate | Status | Summary | Required env |
| --- | --- | --- | --- |
| LIVE_GATE_PHARMACY_PROVIDER_SCORECARDS_APPROVED | pass | Seq_022 already froze the pharmacy directory, transport, and outcome scorecard families. | n/a |
| LIVE_GATE_PHARMACY_TRANSPORT_SCORECARDS_APPROVED | pass | Seq_028 already froze message-route and proof separation for pharmacy-related MESH posture. | n/a |
| LIVE_GATE_PHARMACY_MVP_APPROVED | blocked | Actual-provider work stays blocked until a bounded pharmacy MVP is explicitly named and approved. | PHARMACY_MVP_REF |
| LIVE_GATE_PHARMACY_CONSENT_AND_DISPATCH_MODELS_IMPLEMENTED | review_required | The canonical contracts are specified, but seq_037 does not claim runtime implementation is already complete. | PHARMACY_RUNTIME_IMPLEMENTATION_REF |
| LIVE_GATE_PHARMACY_NAMED_APPROVER_AND_ENVIRONMENT | blocked | Real-provider route discovery remains fail-closed until a named approver and environment target exist. | PHARMACY_NAMED_APPROVER; PHARMACY_TARGET_ENVIRONMENT |
| LIVE_GATE_PHARMACY_MUTATION_FLAG_ENABLED | blocked | Real provider mutation must remain blocked unless ALLOW_REAL_PROVIDER_MUTATION=true is supplied deliberately. | ALLOW_REAL_PROVIDER_MUTATION |
| LIVE_GATE_PHARMACY_WATCH_REGISTER_CLEAR | blocked | The current assurance gaps still include unresolved blockers across discovery, transport, urgent fallback, and outcome observation. | PHARMACY_WATCH_REGISTER_ACK |
| LIVE_GATE_PHARMACY_UPDATE_RECORD_COMBINATION_NAMED | blocked | GP Connect Update Record remains blocked until the exact assured combination and rollout context are recorded. | PHARMACY_UPDATE_RECORD_COMBINATION_REF |
| LIVE_GATE_PHARMACY_URGENT_RETURN_OWNERSHIP_REHEARSED | blocked | The manual safety-net route is mandatory, but live opening stays blocked until ownership and rehearsal evidence are recorded. | PHARMACY_URGENT_RETURN_REHEARSAL_REF |
| LIVE_GATE_PHASE0_EXTERNAL_FOUNDATION | blocked | Seq_020 still reports Phase 0 entry as withheld, so actual provider motion cannot be treated as current-baseline execution. | n/a |

## Route family split

| Purpose group | Route count | Representative routes |
| --- | --- | --- |
| discovery | 3 | service_search_v3_primary_candidate; dos_urgent_rest_watch_or_supporting_route; eps_dos_supporting_route |
| transport | 2 | dispatch_transport_primary_candidate; mesh_or_transport_observation_dependency |
| visibility | 1 | gp_update_record_assured_path |
| manual | 2 | manual_nhsmail_or_phone_fallback; practice_disabled_update_record_fallback |
