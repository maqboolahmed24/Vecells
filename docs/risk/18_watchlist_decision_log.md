# 18 Watchlist Decision Log

        ## Register Decisions

        | Risk or gap | Status | Decision note | Due ref |

| --- | --- | --- | --- |
| GAP_016_DESIGN_RUNTIME_PUBLICATION_DRIFT | retired | Inherited from seq_016 architecture gap register with status resolved. | seq_017 |
| GAP_016_OPS_GOVERNANCE_CONTINUITY_SPLIT | retired | Inherited from seq_016 architecture gap register with status resolved. | seq_017 |
| GAP_016_ASSISTIVE_CENTRALITY | retired | Inherited from seq_016 architecture gap register with status resolved. | seq_017 |
| GAP_016_SCATTERED_DECISION_FREEZE | retired | Inherited from seq_016 architecture gap register with status resolved. | seq_017 |
| GAP_016_TENANT_SCOPE_DRIFT | retired | Inherited from seq_016 architecture gap register with status resolved. | seq_017 |
| GAP_016_ARTIFACT_MODE_TRUTH | retired | Inherited from seq_016 architecture gap register with status resolved. | seq_017 |
| GAP_016_PATIENT_DEGRADED_ROUTE_LOCALITY | retired | Inherited from seq_016 architecture gap register with status resolved. | seq_017 |
| GAP_016_PHASE0_CONTROL_PLANE_LOCALITY | retired | Inherited from seq_016 architecture gap register with status resolved. | seq_017 |
| GAP_016_PHASE7_DEFERRED_CHANNEL | accepted_with_guardrails | Inherited from seq_016 architecture gap register with status deferred. | seq_017 |

        ## Internal Dependency Rows Added In Seq_018

        | Dependency | Name | State | Notes |

| --- | --- | --- | --- |
| dep_alert_destination_binding | Alert-routing destination and on-call binding | blocked | Inherited open gap from seq_015 and seq_016. |
| dep_assurance_evidence_graph | Assurance evidence graph completeness engine | current | |
| dep_hsm_signing_key_provisioning | HSM-backed signing key provisioning seam | blocked | Inherited open gap from seq_015 and seq_016. |
| dep_release_publication_tuple_pipeline | Runtime publication and release tuple pipeline | current | |
| dep_restore_rehearsal_evidence | Restore rehearsal and recovery evidence pack | current | |
| dep_standards_baseline_map | Standards baseline and exception map | current | Internal dependency row added by seq_018 so standards hygiene cannot stay ownerless. |

        ## Assumptions

        | Assumption | Decision |

| --- | --- |
| ASSUMPTION_018_SIMULATOR_NOT_HEALTHY | Simulator or manual fallback posture counts as watch or replaceable-by-simulator, never as the dependency being fully healthy. |
| ASSUMPTION_018_RESOLVED_ADR_GAPS_STAY_VISIBLE | Resolved architecture gaps remain in the register as retired or guarded rows so later gate tasks can prove they were deliberately closed rather than forgotten. |
| ASSUMPTION_018_INTERNAL_WATCH_ROWS | Standards, release-publication, evidence-graph, HSM, alert-routing, and restore-rehearsal seams are added as internal dependency watch rows because the prompt requires one merged watch posture, not only external inventory rows. |
