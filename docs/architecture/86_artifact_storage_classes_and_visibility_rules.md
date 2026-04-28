# 86 Artifact Storage Classes And Visibility Rules

        ## Non-negotiable Rules

        - Quarantine, source evidence, derived artifacts, redacted presentation artifacts, outbound bundles, and recovery staging remain separate storage classes.
        - Raw and quarantined bytes are never browser-addressable.
        - Object keys are digest-based and may not embed PHI, channel identifiers, or stable public handles.
        - Visibility stays governed by `ArtifactPresentationContract`, `OutboundNavigationGrant`, or recovery posture, never by bucket paths or long-lived object URLs.
        - Retention and legal-hold changes never mutate artifact identity or checksum lineage.

        ## Object-Key Law

        | Segment | Render template | Derivation |
        | --- | --- | --- |
        | `seg_086_tenant_scope_digest` | `tenant/{tenant_scope_digest}` | `sha256(tenant_scope)[:16]` |
| `seg_086_lineage_scope_digest` | `lineage/{lineage_scope_digest}` | `sha256(lineage_scope)[:16]` |
| `seg_086_artifact_ref_digest` | `artifact/{artifact_ref_digest}` | `sha256(artifact_ref)[:16]` |
| `seg_086_payload_hash` | `sha/{payload_sha256[:20]}` | `sha256(payload_bytes)[:20]` |

        Prohibited key material: `patient_name`, `date_of_birth`, `email_address`, `phone_number`, `nhs_number`, `postal_address`

        ## Hold And Visibility Matrix

        | Storage class | Hold ref | Visibility authority |
        | --- | --- | --- |
        | `quarantine_raw` | `hold_086_quarantine_raw` | `never_browser_visible` |
| `evidence_source_immutable` | `hold_086_source_evidence` | `evidence_manifest_and_presentation_contract` |
| `derived_internal` | `hold_086_derived_internal` | `derivation_manifest_only` |
| `redacted_presentation` | `hold_086_redacted_presentation` | `artifact_presentation_contract_only` |
| `outbound_ephemeral` | `hold_086_outbound_ephemeral` | `outbound_navigation_grant_only` |
| `ops_recovery_staging` | `hold_086_ops_recovery` | `recovery_control_posture_only` |

        ## Malware-Scan Handoff

        - Handoff ref: `msh_086_quarantine_release_gate`
        - Source class: `quarantine_raw`
        - Clean target: `evidence_source_immutable`
        - Blocked browser paths: `true`
        - Required verdicts: `scan_clean`, `hash_recorded`, `manifest_attached`, `lineage_bound`
