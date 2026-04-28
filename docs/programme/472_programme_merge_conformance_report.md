# Programme Merge Conformance Report

Scorecard: `programme-core-release-472-cross-phase-conformance`
State: `exact`
Hash: `dcff92a4ec426a773c5908a331c78991b259450709c81ea9d37677295b021197`

## Reconciliation Result

Phase 0 through Phase 6, Phase 8, Phase 9, and the cross-cutting blueprint families reconcile through one deterministic scorecard. Phase 7 is not hidden: the live NHS App channel is deferred to task 473, while its active route-freeze, artifact-presentation, outbound-grant, embedded-context, and continuity dependencies remain in the current scorecard.

## Row Families

- `phase_0` Phase 0 foundation/control plane: `exact` (28db4b406491083e08321195883a32fadadbd38474c7da8d37803e2be439523c)
- `phase_1` Phase 1 red-flag gate: `exact` (77d9a8497c46065000bc5c22a6377b2e9db602a3f6f346ecdcbda9951c0e8484)
- `phase_2` Phase 2 identity and access: `exact` (0b8e7f825b57f9bc8f0eb9438bd50b5b6d8c0d185b661cfd0f2ef3973a06a8f0)
- `phase_3` Phase 3 human checkpoint/workspace: `exact` (4188b3c9198139a319dc5d80e63626e7d34a9cbd7919a1dfc7a61a09bdb8fee0)
- `phase_4` Phase 4 booking engine: `exact` (f108949ed7863f11f4fe992fa45618866cd430330d85b86225f0a3f4a3605b00)
- `phase_5` Phase 5 network/hub coordination: `exact` (cab0beb475199d24bafc3ed5f78aebe12d0e6980179ac2ad590217e3365832a0)
- `phase_6` Phase 6 pharmacy loop: `exact` (902c9dd9fa2c303de9c56bbb61e1ccce0cd23a62eaa325d153ef5f76c8fa3076)
- `phase_7` Phase 7 deferred NHS App/channel scope and active dependencies: `deferred_scope` (38d209d9e2ee44950de94896a7a41887990244403ffaf8d11077454e60ad9d88)
- `phase_8` Phase 8 assistive layer: `exact` (d17f8ce5b9b2e1a0ed8d8297622cd852691443beebdc5de024313e03752e0f50)
- `phase_9` Phase 9 assurance ledger and BAU transfer: `exact` (153fd687453a772c6edfe1ed45cea5914f703077d35633c2d48b42c41fc99a96)
- `patient_shell_continuity` patient shell continuity: `exact` (76feb93808d9e29647d623bca6977d9077d126d6296d0b84ac4359195672f539)
- `staff_workspace_continuity` staff workspace continuity: `exact` (c56b0f9bb4604ffba27d1f9723431c8972776c7b16db45659688704d9c66432c)
- `operations_console_continuity` operations console continuity: `exact` (7d57dfdfbdaac12a995c9d61bc5a9635607c7ff64e587c3a4586d66507b614c3)
- `governance_admin_config_access` governance/admin config and access: `exact` (5859b540a5f9f7b2d66183b3a0cd4a031fe387d66e40596f45bc0ead14a974d8)
- `audit_break_glass_support_replay` audit/break-glass/support replay: `exact` (812f6ba0d09e0f5f3e4b40c1a3bb3b41919f8ab79fb04a6ab462c81ad67994bc)
- `assurance_pack_evidence_graph` assurance pack and evidence graph: `exact` (d9f06dcd1281bbcf7a24ab948112adcdfa9dcbd629588e1539c1b53597396006)
- `records_lifecycle_retention` records lifecycle/retention: `exact` (f46c60d99c1e77e32a91a62ee9090effadf1cc8f2312c246238d009fa395f665)
- `resilience_restore_failover_chaos` resilience/restore/failover/chaos: `exact` (267183b48c70af1a27d0677fd617b016b4fa7f948adb6a9e4f2f6d6caccd6cfc)
- `incident_near_miss_reportability_capa` incident/near miss/reportability/CAPA: `exact` (64372f70b05c778b8f512b2311d46bcd197a0436cbff60514e2e76d66eb6be84)
- `tenant_config_standards_dependency_hygiene` tenant config/standards dependency hygiene: `exact` (0f58cc4bff7c6be0cda19db0610d918763447ab424f07b2725e356df5c12fcd7)
- `release_runtime_publication_recovery_disposition` release/runtime publication and recovery disposition: `exact` (e42eab01a8c3391de5694799130d40bac962183334529b6dd0c2d1f0911e30ce)
- `accessibility_content_design_contract` accessibility/content and design contract publication: `exact` (09dc701c76464bd2c391014404f14379b99450c9ac603160663e4578c198cf91)
- `artifact_presentation_outbound_navigation_grant` artifact presentation/outbound navigation grant: `exact` (fb19b7b5a4451c357323aa84494a888ef6e9cc0f4f43109a06751ccab6b1097f)
- `ui_telemetry_disclosure_fence` UI telemetry/disclosure fence: `exact` (eb98f77a6525d0fae2f17b9b03071cbf93045439aed2850c71a4d56539dce461)
- `identity_access` identity/access: `exact` (3bf8c32555695c83004fc36236b8dad3cc007733ab6ef6ea8beb5f5d042db7d3)
- `settlement_idempotency_replay` settlement/idempotency/replay: `exact` (2c5b20eefc2b6928187c946c67dc867709ff2c0797b9bfb7f1be931c399bec2d)

## Summary Alignment Corrections

Blocked original summary claims are preserved in `data/conformance/472_summary_alignment_corrections.json`. Corrections are applied by row state and hash, not by rewriting narrative status.

## BAU Readiness

BAU handoff is ready for this core release baseline because the Phase 9 exit gate is approved, mandatory rows are exact, the only deferred row is explicit and permitted, and recovery/runbook/on-call prerequisites are present.
