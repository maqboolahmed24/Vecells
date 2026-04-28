# 13 Event Spine And Namespace Baseline

        Vecells needs one canonical event spine with published namespaces, published contract ownership, mandatory normalization, and explicit quarantine for unknown producers or schema drift. Event naming may not drift by producer, vendor, or shell.

        ## Decision

        Chosen baseline: `OPT_CANONICAL_EVENT_SPINE`.

        ## Scorecard

        | Option | Contract Stability | Privacy | Replay | Observability | Decision |
| --- | --- | --- | --- | --- | --- |
| Producer-local event names consumed directly downstream | 1 | 2 | 2 | 1 | rejected |
| Canonical namespace spine with normalization and quarantine | 5 | 5 | 5 | 5 | chosen |
| FHIR change feed as the primary internal event source | 2 | 2 | 2 | 2 | rejected |

        ## Canonical Namespace Ownership

        | Namespace | Owner | Purpose | Family Role | Disclosure | Quarantine |
| --- | --- | --- | --- | --- | --- |
| request | foundation_control_plane | domain_lifecycle | authoritative | operational_internal_non_phi | queue_event_normalization_quarantine |
| intake | foundation_control_plane | domain_lifecycle | authoritative | operational_internal_non_phi | queue_event_normalization_quarantine |
| identity | foundation_identity_access | control_plane | authoritative | security_or_secret_sensitive | queue_event_normalization_quarantine |
| access | foundation_identity_access | control_plane | authoritative | security_or_secret_sensitive | queue_event_normalization_quarantine |
| telephony | callback_messaging | continuity | authoritative | descriptor_and_hash_only | queue_event_normalization_quarantine |
| safety | foundation_control_plane | domain_lifecycle | authoritative | operational_internal_non_phi | queue_event_normalization_quarantine |
| triage | triage_human_checkpoint | domain_lifecycle | authoritative | operational_internal_non_phi | queue_event_normalization_quarantine |
| booking | booking | domain_lifecycle | authoritative | operational_internal_non_phi | queue_event_normalization_quarantine |
| hub | hub_coordination | domain_lifecycle | authoritative | operational_internal_non_phi | queue_event_normalization_quarantine |
| pharmacy | pharmacy | domain_lifecycle | authoritative | operational_internal_non_phi | queue_event_normalization_quarantine |
| patient | patient_experience | continuity | derived_surface | descriptor_and_hash_only | queue_event_normalization_quarantine |
| communication | callback_messaging | domain_lifecycle | authoritative | descriptor_and_hash_only | queue_event_normalization_quarantine |
| reachability | foundation_identity_access | recovery | authoritative | descriptor_and_hash_only | queue_event_normalization_quarantine |
| exception | foundation_control_plane | recovery | authoritative | descriptor_and_hash_only | queue_event_normalization_quarantine |
| confirmation | foundation_control_plane | continuity | authoritative | descriptor_and_hash_only | queue_event_normalization_quarantine |
| capacity | booking | observability | authoritative | descriptor_and_hash_only | queue_event_normalization_quarantine |
| support | staff_support_operations | recovery | authoritative | audit_reference_only | queue_event_normalization_quarantine |
| assistive | assistive | observability | observational | descriptor_and_hash_only | queue_event_normalization_quarantine |
| policy | platform_configuration | control_plane | authoritative | descriptor_and_hash_only | queue_event_normalization_quarantine |
| release | runtime_release | control_plane | authoritative | descriptor_and_hash_only | queue_event_normalization_quarantine |
| analytics | assurance_and_governance | observability | observational | descriptor_and_hash_only | queue_event_normalization_quarantine |
| audit | assurance_and_governance | observability | observational | audit_reference_only | queue_event_normalization_quarantine |

        ## Backbone Law

        - Every state transition, blocker mutation, degraded transition, recovery transition, continuity-evidence change, and control-plane decision that matters downstream emits one canonical event envelope.
        - Producers may not deliver `ingest.*`, `tasks.*`, vendor callback names, or shell-local event names directly to projections, analytics, assurance, or audit.
        - Unknown producers, unknown namespaces, and semantically divergent replay must land in `queue_event_normalization_quarantine`.
        - Default compatibility is backward-compatible additive evolution. True breaks require a new published contract or, for family retirement, `compatibilityMode = namespace_break`.
        - Raw PHI, message bodies, transcripts, phone numbers, and binary payloads never travel on the spine; only governed refs, hashes, or masked descriptors do.

        ## Rejection Notes

        - Producer-local event names were rejected because Phase 0 explicitly outlaws them as downstream contracts.
        - FHIR change data capture was rejected as the primary internal feed because FHIR is derivative and cannot own lifecycle, blocker, or settlement meaning.
