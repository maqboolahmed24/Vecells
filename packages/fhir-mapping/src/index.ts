const representationContractsPayload = {
  task_id: "seq_049",
  generated_at: "2026-04-13T14:51:08+00:00",
  captured_on: "2026-04-13",
  visual_mode: "Clinical_Representation_Atlas",
  mission:
    "Define one canonical FHIR representation strategy so domain aggregates stay authoritative while FHIR remains replayable representation, governed interchange, callback correlation, and audit companion output.",
  source_precedence: [
    "prompt/049.md",
    "prompt/shared_operating_contract_046_to_055.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "blueprint/phase-0-the-foundation-protocol.md",
    "blueprint/phase-3-the-human-checkpoint.md",
    "blueprint/phase-4-the-booking-engine.md",
    "blueprint/phase-5-the-network-horizon.md",
    "blueprint/phase-6-the-pharmacy-loop.md",
    "blueprint/platform-runtime-and-release-blueprint.md",
    "blueprint/forensic-audit-findings.md",
    "data/analysis/request_lineage_transitions.json",
    "data/analysis/object_catalog.json",
    "data/analysis/external_dependency_inventory.csv",
    "data/analysis/degraded_mode_defaults.json",
    "data/analysis/domain_package_manifest.json",
    "data/analysis/canonical_event_contracts.json",
  ],
  upstream_inputs: [
    "data/analysis/request_lineage_transitions.json",
    "data/analysis/object_catalog.json",
    "data/analysis/external_dependency_inventory.csv",
    "data/analysis/degraded_mode_defaults.json",
    "data/analysis/domain_package_manifest.json",
    "data/analysis/canonical_event_contracts.json",
  ],
  summary: {
    contract_count: 13,
    active_contract_count: 13,
    mapped_aggregate_count: 10,
    representation_purpose_count: 4,
    representation_set_policy_count: 13,
    mapping_row_count: 44,
    watch_contract_count: 2,
    blocked_mapping_count: 8,
    assumption_count: 2,
  },
  contracts: [
    {
      fhirRepresentationContractId: "FRC_049_AUDIT_RECORD_AUDIT_COMPANION_V1",
      owningBoundedContextRef: "audit_compliance",
      governingAggregateType: "AuditRecord",
      representationPurpose: "audit_companion",
      triggerMilestoneTypes: ["audit.recorded", "audit.break_glass.used", "audit.export.generated"],
      requiredEvidenceRefs: ["AuditRecord", "AuditEvidenceReference"],
      allowedResourceTypes: ["AuditEvent", "Provenance"],
      requiredProfileCanonicalUrls: [
        "https://vecells.example/fhir/StructureDefinition/vecells-audit-event",
        "https://vecells.example/fhir/StructureDefinition/vecells-audit-provenance",
      ],
      identifierPolicyRef: "IDPOL_049_AUDIT_CHAIN_HASH",
      statusMappingPolicyRef: "STPOL_049_AUDIT_COMPANION",
      cardinalityPolicyRef: "CARDPOL_049_SINGLE_AUDIT_EVENT_PLUS_PROVENANCE",
      redactionPolicyRef: "REDPOL_049_AUDIT_COMPANION_MASKED",
      companionArtifactPolicyRef: "COMPPOL_049_AUDIT_HASH_JOIN",
      replayPolicyRef: "REPLAYPOL_049_AUDIT_HASH_APPEND_ONLY",
      supersessionPolicyRef: "SUPPOL_049_AUDIT_APPEND_ONLY_COMPANION",
      callbackCorrelationPolicyRef: "CALLPOL_049_NONE",
      declaredBundlePolicyRefs: ["FXBP_049_AUDIT_COMPANION_EXPORT_DOCUMENT"],
      contractVersionRef: "FRCV_049_AUDIT_RECORD_AUDIT_COMPANION_V1",
      contractState: "active",
      publishedAt: "2026-04-13T14:51:08+00:00",
      resourceProfiles: [
        {
          resourceType: "AuditEvent",
          profileCanonicalUrl:
            "https://vecells.example/fhir/StructureDefinition/vecells-audit-event",
        },
        {
          resourceType: "Provenance",
          profileCanonicalUrl:
            "https://vecells.example/fhir/StructureDefinition/vecells-audit-provenance",
        },
      ],
      defectState: "watch",
      source_refs: [
        "blueprint/phase-0-the-foundation-protocol.md#FhirRepresentationContract",
        "blueprint/phase-0-the-foundation-protocol.md#AuditRecord",
        "blueprint/platform-runtime-and-release-blueprint.md#AdapterContractProfile",
      ],
      rationale:
        "FHIR AuditEvent and Provenance remain companion outputs derived from immutable internal audit joins only.",
    },
    {
      fhirRepresentationContractId: "FRC_049_BOOKING_CASE_EXTERNAL_INTERCHANGE_V1",
      owningBoundedContextRef: "booking",
      governingAggregateType: "BookingCase",
      representationPurpose: "external_interchange",
      triggerMilestoneTypes: [
        "booking.commit.started",
        "booking.commit.confirmation_pending",
        "booking.commit.confirmed",
        "booking.commit.ambiguous",
      ],
      requiredEvidenceRefs: [
        "BookingCase",
        "BookingProviderAdapterBinding",
        "ExternalConfirmationGate",
      ],
      allowedResourceTypes: ["ServiceRequest", "Task", "Communication", "Provenance"],
      requiredProfileCanonicalUrls: [
        "https://vecells.example/fhir/StructureDefinition/vecells-booking-service-request",
        "https://vecells.example/fhir/StructureDefinition/vecells-booking-task",
        "https://vecells.example/fhir/StructureDefinition/vecells-booking-communication",
        "https://vecells.example/fhir/StructureDefinition/vecells-booking-provenance",
      ],
      identifierPolicyRef: "IDPOL_049_EXTERNAL_COMMITMENT_CASE",
      statusMappingPolicyRef: "STPOL_049_BOOKING_COMMITMENT",
      cardinalityPolicyRef: "CARDPOL_049_SINGLE_SERVICE_REQUEST_COMMITMENT",
      redactionPolicyRef: "REDPOL_049_MINIMAL_PARTNER_INTERCHANGE",
      companionArtifactPolicyRef: "COMPPOL_049_PARTNER_EXCHANGE_MANIFEST",
      replayPolicyRef: "REPLAYPOL_049_COMMITMENT_PROOF_STABLE_SERVICE_REQUEST",
      supersessionPolicyRef: "SUPPOL_049_COMMITMENT_SUPERSESSION_ON_AUTHORITATIVE_REFRESH",
      callbackCorrelationPolicyRef: "CALLPOL_049_EXTERNAL_CONFIRMATION_GATE",
      declaredBundlePolicyRefs: ["FXBP_049_BOOKING_PARTNER_OUTBOUND_MESSAGE"],
      contractVersionRef: "FRCV_049_BOOKING_CASE_EXTERNAL_INTERCHANGE_V1",
      contractState: "active",
      publishedAt: "2026-04-13T14:51:08+00:00",
      resourceProfiles: [
        {
          resourceType: "ServiceRequest",
          profileCanonicalUrl:
            "https://vecells.example/fhir/StructureDefinition/vecells-booking-service-request",
        },
        {
          resourceType: "Task",
          profileCanonicalUrl:
            "https://vecells.example/fhir/StructureDefinition/vecells-booking-task",
        },
        {
          resourceType: "Communication",
          profileCanonicalUrl:
            "https://vecells.example/fhir/StructureDefinition/vecells-booking-communication",
        },
        {
          resourceType: "Provenance",
          profileCanonicalUrl:
            "https://vecells.example/fhir/StructureDefinition/vecells-booking-provenance",
        },
      ],
      defectState: "active",
      source_refs: [
        "blueprint/phase-0-the-foundation-protocol.md#FhirRepresentationContract",
        "blueprint/phase-4-the-booking-engine.md#4E Commit path",
        "blueprint/platform-runtime-and-release-blueprint.md#AdapterContractProfile",
      ],
      rationale:
        "Booking commitment becomes FHIR only when a real external service commitment exists and remains bound to confirmation truth.",
    },
    {
      fhirRepresentationContractId: "FRC_049_BOOKING_CASE_PARTNER_CALLBACK_CORRELATION_V1",
      owningBoundedContextRef: "booking",
      governingAggregateType: "BookingCase",
      representationPurpose: "partner_callback_correlation",
      triggerMilestoneTypes: [
        "booking.commit.confirmation_pending",
        "booking.confirmation.truth.updated",
        "confirmation.gate.created",
        "confirmation.gate.confirmed",
        "confirmation.gate.disputed",
      ],
      requiredEvidenceRefs: [
        "BookingCase",
        "ExternalConfirmationGate",
        "BookingConfirmationTruthProjection",
      ],
      allowedResourceTypes: ["Communication", "Provenance"],
      requiredProfileCanonicalUrls: [
        "https://vecells.example/fhir/StructureDefinition/vecells-booking-callback-communication",
        "https://vecells.example/fhir/StructureDefinition/vecells-booking-callback-provenance",
      ],
      identifierPolicyRef: "IDPOL_049_TRANSPORT_CORRELATION_RECORD",
      statusMappingPolicyRef: "STPOL_049_MESSAGE_COMMUNICATION",
      cardinalityPolicyRef: "CARDPOL_049_SINGLE_COMMUNICATION_PER_DISPATCH",
      redactionPolicyRef: "REDPOL_049_CALLBACK_CORRELATION_MINIMAL",
      companionArtifactPolicyRef: "COMPPOL_049_CALLBACK_RECEIPT_REFS",
      replayPolicyRef: "REPLAYPOL_049_TRANSPORT_CORRELATION_STABLE_CALLBACK_SET",
      supersessionPolicyRef: "SUPPOL_049_CALLBACK_SUPERSESSION_ON_GATE_ROTATION",
      callbackCorrelationPolicyRef: "CALLPOL_049_EXTERNAL_CONFIRMATION_GATE",
      declaredBundlePolicyRefs: ["FXBP_049_PARTNER_CALLBACK_INBOUND_COLLECTION"],
      contractVersionRef: "FRCV_049_BOOKING_CASE_PARTNER_CALLBACK_CORRELATION_V1",
      contractState: "active",
      publishedAt: "2026-04-13T14:51:08+00:00",
      resourceProfiles: [
        {
          resourceType: "Communication",
          profileCanonicalUrl:
            "https://vecells.example/fhir/StructureDefinition/vecells-booking-callback-communication",
        },
        {
          resourceType: "Provenance",
          profileCanonicalUrl:
            "https://vecells.example/fhir/StructureDefinition/vecells-booking-callback-provenance",
        },
      ],
      defectState: "active",
      source_refs: [
        "blueprint/phase-0-the-foundation-protocol.md#FhirRepresentationContract",
        "blueprint/phase-4-the-booking-engine.md#4E Commit path",
        "blueprint/platform-runtime-and-release-blueprint.md#AdapterContractProfile",
      ],
      rationale:
        "Async supplier callbacks correlate through one published callback companion instead of custom booking-adapter payloads.",
    },
    {
      fhirRepresentationContractId: "FRC_049_CALLBACK_CASE_PARTNER_CALLBACK_CORRELATION_V1",
      owningBoundedContextRef: "communications",
      governingAggregateType: "CallbackCase",
      representationPurpose: "partner_callback_correlation",
      triggerMilestoneTypes: [
        "communication.callback.outcome.recorded",
        "confirmation.gate.created",
        "confirmation.gate.confirmed",
        "confirmation.gate.disputed",
      ],
      requiredEvidenceRefs: [
        "CallbackCase",
        "CallbackAttemptRecord",
        "CallbackOutcomeEvidenceBundle",
        "ExternalConfirmationGate",
      ],
      allowedResourceTypes: ["Communication", "Provenance"],
      requiredProfileCanonicalUrls: [
        "https://vecells.example/fhir/StructureDefinition/vecells-callback-communication",
        "https://vecells.example/fhir/StructureDefinition/vecells-callback-provenance",
      ],
      identifierPolicyRef: "IDPOL_049_TRANSPORT_CORRELATION_RECORD",
      statusMappingPolicyRef: "STPOL_049_MESSAGE_COMMUNICATION",
      cardinalityPolicyRef: "CARDPOL_049_SINGLE_COMMUNICATION_PER_DISPATCH",
      redactionPolicyRef: "REDPOL_049_CALLBACK_CORRELATION_MINIMAL",
      companionArtifactPolicyRef: "COMPPOL_049_CALLBACK_RECEIPT_REFS",
      replayPolicyRef: "REPLAYPOL_049_TRANSPORT_CORRELATION_STABLE_CALLBACK_SET",
      supersessionPolicyRef: "SUPPOL_049_CALLBACK_SUPERSESSION_ON_GATE_ROTATION",
      callbackCorrelationPolicyRef: "CALLPOL_049_EXTERNAL_CONFIRMATION_GATE",
      declaredBundlePolicyRefs: ["FXBP_049_PARTNER_CALLBACK_INBOUND_COLLECTION"],
      contractVersionRef: "FRCV_049_CALLBACK_CASE_PARTNER_CALLBACK_CORRELATION_V1",
      contractState: "active",
      publishedAt: "2026-04-13T14:51:08+00:00",
      resourceProfiles: [
        {
          resourceType: "Communication",
          profileCanonicalUrl:
            "https://vecells.example/fhir/StructureDefinition/vecells-callback-communication",
        },
        {
          resourceType: "Provenance",
          profileCanonicalUrl:
            "https://vecells.example/fhir/StructureDefinition/vecells-callback-provenance",
        },
      ],
      defectState: "active",
      source_refs: [
        "blueprint/phase-0-the-foundation-protocol.md#FhirRepresentationContract",
        "blueprint/callback-and-clinician-messaging-loop.md#Callback domain / Core object / CallbackCase",
        "blueprint/platform-runtime-and-release-blueprint.md#AdapterContractProfile",
      ],
      rationale:
        "Partner callback correlation remains explicit and replay-safe instead of living inside ad hoc webhook handlers.",
    },
    {
      fhirRepresentationContractId: "FRC_049_EVIDENCE_SNAPSHOT_CLINICAL_PERSISTENCE_V1",
      owningBoundedContextRef: "intake_safety",
      governingAggregateType: "EvidenceSnapshot",
      representationPurpose: "clinical_persistence",
      triggerMilestoneTypes: [
        "request.snapshot.created",
        "request.snapshot.superseded",
        "intake.attachment.quarantined",
      ],
      requiredEvidenceRefs: ["EvidenceSnapshot", "Attachment", "EvidenceAssimilationRecord"],
      allowedResourceTypes: ["DocumentReference", "Provenance"],
      requiredProfileCanonicalUrls: [
        "https://vecells.example/fhir/StructureDefinition/vecells-evidence-documentreference",
        "https://vecells.example/fhir/StructureDefinition/vecells-evidence-provenance",
      ],
      identifierPolicyRef: "IDPOL_049_SNAPSHOT_HASH_DOCUMENT",
      statusMappingPolicyRef: "STPOL_049_EVIDENCE_DOCUMENT_REFERENCE",
      cardinalityPolicyRef: "CARDPOL_049_SNAPSHOT_MANY_DOCREFS",
      redactionPolicyRef: "REDPOL_049_REFERENCE_ONLY_ARTIFACTS",
      companionArtifactPolicyRef: "COMPPOL_049_DOCUMENT_REFERENCE_BINARY_REFS",
      replayPolicyRef: "REPLAYPOL_049_SNAPSHOT_HASH_STABLE_DOCS",
      supersessionPolicyRef: "SUPPOL_049_DOCUMENT_REF_SUPERSESSION_ON_SNAPSHOT_REPLACEMENT",
      callbackCorrelationPolicyRef: "CALLPOL_049_NONE",
      declaredBundlePolicyRefs: [],
      contractVersionRef: "FRCV_049_EVIDENCE_SNAPSHOT_CLINICAL_PERSISTENCE_V1",
      contractState: "active",
      publishedAt: "2026-04-13T14:51:08+00:00",
      resourceProfiles: [
        {
          resourceType: "DocumentReference",
          profileCanonicalUrl:
            "https://vecells.example/fhir/StructureDefinition/vecells-evidence-documentreference",
        },
        {
          resourceType: "Provenance",
          profileCanonicalUrl:
            "https://vecells.example/fhir/StructureDefinition/vecells-evidence-provenance",
        },
      ],
      defectState: "watch",
      source_refs: [
        "blueprint/phase-0-the-foundation-protocol.md#FhirRepresentationContract",
        "blueprint/phase-0-the-foundation-protocol.md#EvidenceSnapshot",
        "blueprint/platform-runtime-and-release-blueprint.md#AdapterContractProfile",
      ],
      rationale:
        "Evidence snapshots materialize FHIR DocumentReference rows without transferring ownership away from the frozen snapshot chain.",
    },
    {
      fhirRepresentationContractId: "FRC_049_HUB_CASE_EXTERNAL_INTERCHANGE_V1",
      owningBoundedContextRef: "hub_coordination",
      governingAggregateType: "HubCoordinationCase",
      representationPurpose: "external_interchange",
      triggerMilestoneTypes: [
        "hub.offer.created",
        "hub.offer.accepted",
        "hub.booking.confirmation_pending",
        "hub.booking.externally_confirmed",
      ],
      requiredEvidenceRefs: [
        "HubCoordinationCase",
        "HubBookingEvidenceBundle",
        "ExternalConfirmationGate",
      ],
      allowedResourceTypes: ["ServiceRequest", "Communication", "DocumentReference", "Provenance"],
      requiredProfileCanonicalUrls: [
        "https://vecells.example/fhir/StructureDefinition/vecells-hub-service-request",
        "https://vecells.example/fhir/StructureDefinition/vecells-hub-communication",
        "https://vecells.example/fhir/StructureDefinition/vecells-hub-documentreference",
        "https://vecells.example/fhir/StructureDefinition/vecells-hub-provenance",
      ],
      identifierPolicyRef: "IDPOL_049_EXTERNAL_COMMITMENT_CASE",
      statusMappingPolicyRef: "STPOL_049_HUB_COMMITMENT",
      cardinalityPolicyRef: "CARDPOL_049_SINGLE_SERVICE_REQUEST_COMMITMENT",
      redactionPolicyRef: "REDPOL_049_MINIMAL_PARTNER_INTERCHANGE",
      companionArtifactPolicyRef: "COMPPOL_049_PARTNER_EXCHANGE_MANIFEST",
      replayPolicyRef: "REPLAYPOL_049_COMMITMENT_PROOF_STABLE_SERVICE_REQUEST",
      supersessionPolicyRef: "SUPPOL_049_COMMITMENT_SUPERSESSION_ON_AUTHORITATIVE_REFRESH",
      callbackCorrelationPolicyRef: "CALLPOL_049_EXTERNAL_CONFIRMATION_GATE",
      declaredBundlePolicyRefs: ["FXBP_049_HUB_PARTNER_OUTBOUND_MESSAGE"],
      contractVersionRef: "FRCV_049_HUB_CASE_EXTERNAL_INTERCHANGE_V1",
      contractState: "active",
      publishedAt: "2026-04-13T14:51:08+00:00",
      resourceProfiles: [
        {
          resourceType: "ServiceRequest",
          profileCanonicalUrl:
            "https://vecells.example/fhir/StructureDefinition/vecells-hub-service-request",
        },
        {
          resourceType: "Communication",
          profileCanonicalUrl:
            "https://vecells.example/fhir/StructureDefinition/vecells-hub-communication",
        },
        {
          resourceType: "DocumentReference",
          profileCanonicalUrl:
            "https://vecells.example/fhir/StructureDefinition/vecells-hub-documentreference",
        },
        {
          resourceType: "Provenance",
          profileCanonicalUrl:
            "https://vecells.example/fhir/StructureDefinition/vecells-hub-provenance",
        },
      ],
      defectState: "active",
      source_refs: [
        "blueprint/phase-0-the-foundation-protocol.md#FhirRepresentationContract",
        "blueprint/phase-5-the-network-horizon.md#Hub commit algorithm",
        "blueprint/platform-runtime-and-release-blueprint.md#AdapterContractProfile",
      ],
      rationale:
        "Hub-native exchange remains partner-safe while request closure and practice visibility stay on their owning aggregates.",
    },
    {
      fhirRepresentationContractId: "FRC_049_HUB_CASE_PARTNER_CALLBACK_CORRELATION_V1",
      owningBoundedContextRef: "hub_coordination",
      governingAggregateType: "HubCoordinationCase",
      representationPurpose: "partner_callback_correlation",
      triggerMilestoneTypes: [
        "hub.booking.confirmation_pending",
        "hub.booking.externally_confirmed",
        "confirmation.gate.created",
        "confirmation.gate.confirmed",
        "confirmation.gate.disputed",
      ],
      requiredEvidenceRefs: [
        "HubCoordinationCase",
        "HubReturnToPracticeRecord",
        "ExternalConfirmationGate",
      ],
      allowedResourceTypes: ["Communication", "Provenance"],
      requiredProfileCanonicalUrls: [
        "https://vecells.example/fhir/StructureDefinition/vecells-hub-callback-communication",
        "https://vecells.example/fhir/StructureDefinition/vecells-hub-callback-provenance",
      ],
      identifierPolicyRef: "IDPOL_049_TRANSPORT_CORRELATION_RECORD",
      statusMappingPolicyRef: "STPOL_049_MESSAGE_COMMUNICATION",
      cardinalityPolicyRef: "CARDPOL_049_SINGLE_COMMUNICATION_PER_DISPATCH",
      redactionPolicyRef: "REDPOL_049_CALLBACK_CORRELATION_MINIMAL",
      companionArtifactPolicyRef: "COMPPOL_049_CALLBACK_RECEIPT_REFS",
      replayPolicyRef: "REPLAYPOL_049_TRANSPORT_CORRELATION_STABLE_CALLBACK_SET",
      supersessionPolicyRef: "SUPPOL_049_CALLBACK_SUPERSESSION_ON_GATE_ROTATION",
      callbackCorrelationPolicyRef: "CALLPOL_049_EXTERNAL_CONFIRMATION_GATE",
      declaredBundlePolicyRefs: ["FXBP_049_PARTNER_CALLBACK_INBOUND_COLLECTION"],
      contractVersionRef: "FRCV_049_HUB_CASE_PARTNER_CALLBACK_CORRELATION_V1",
      contractState: "active",
      publishedAt: "2026-04-13T14:51:08+00:00",
      resourceProfiles: [
        {
          resourceType: "Communication",
          profileCanonicalUrl:
            "https://vecells.example/fhir/StructureDefinition/vecells-hub-callback-communication",
        },
        {
          resourceType: "Provenance",
          profileCanonicalUrl:
            "https://vecells.example/fhir/StructureDefinition/vecells-hub-callback-provenance",
        },
      ],
      defectState: "active",
      source_refs: [
        "blueprint/phase-0-the-foundation-protocol.md#FhirRepresentationContract",
        "blueprint/phase-5-the-network-horizon.md#Hub commit algorithm",
        "blueprint/platform-runtime-and-release-blueprint.md#AdapterContractProfile",
      ],
      rationale:
        "Hub confirmation and practice-visibility callbacks correlate through one declared bundle and gate policy.",
    },
    {
      fhirRepresentationContractId: "FRC_049_MESSAGE_DISPATCH_EXTERNAL_INTERCHANGE_V1",
      owningBoundedContextRef: "communications",
      governingAggregateType: "MessageDispatchEnvelope",
      representationPurpose: "external_interchange",
      triggerMilestoneTypes: [
        "communication.queued",
        "communication.delivery.evidence.recorded",
        "communication.command.settled",
      ],
      requiredEvidenceRefs: [
        "MessageDispatchEnvelope",
        "MessageDeliveryEvidenceBundle",
        "ConversationCommandSettlement",
      ],
      allowedResourceTypes: ["Communication", "Provenance"],
      requiredProfileCanonicalUrls: [
        "https://vecells.example/fhir/StructureDefinition/vecells-message-communication",
        "https://vecells.example/fhir/StructureDefinition/vecells-message-provenance",
      ],
      identifierPolicyRef: "IDPOL_049_TRANSPORT_CORRELATION_RECORD",
      statusMappingPolicyRef: "STPOL_049_MESSAGE_COMMUNICATION",
      cardinalityPolicyRef: "CARDPOL_049_SINGLE_COMMUNICATION_PER_DISPATCH",
      redactionPolicyRef: "REDPOL_049_MINIMAL_PARTNER_INTERCHANGE",
      companionArtifactPolicyRef: "COMPPOL_049_PARTNER_EXCHANGE_MANIFEST",
      replayPolicyRef: "REPLAYPOL_049_TRANSPORT_CORRELATION_STABLE_CALLBACK_SET",
      supersessionPolicyRef: "SUPPOL_049_COMMUNICATION_SUPERSESSION_ON_SETTLEMENT_REVISION",
      callbackCorrelationPolicyRef: "CALLPOL_049_TRANSPORT_CORRELATION_KEYS",
      declaredBundlePolicyRefs: ["FXBP_049_SECURE_MESSAGE_OUTBOUND_MESSAGE"],
      contractVersionRef: "FRCV_049_MESSAGE_DISPATCH_EXTERNAL_INTERCHANGE_V1",
      contractState: "active",
      publishedAt: "2026-04-13T14:51:08+00:00",
      resourceProfiles: [
        {
          resourceType: "Communication",
          profileCanonicalUrl:
            "https://vecells.example/fhir/StructureDefinition/vecells-message-communication",
        },
        {
          resourceType: "Provenance",
          profileCanonicalUrl:
            "https://vecells.example/fhir/StructureDefinition/vecells-message-provenance",
        },
      ],
      defectState: "active",
      source_refs: [
        "blueprint/phase-0-the-foundation-protocol.md#FhirRepresentationContract",
        "blueprint/callback-and-clinician-messaging-loop.md#Clinician message domain / MessageDispatchEnvelope",
        "blueprint/platform-runtime-and-release-blueprint.md#AdapterContractProfile",
      ],
      rationale:
        "Cross-organisation messaging uses a published Communication companion so callback and delivery proofs stay deterministic.",
    },
    {
      fhirRepresentationContractId: "FRC_049_PHARMACY_CASE_EXTERNAL_INTERCHANGE_V1",
      owningBoundedContextRef: "pharmacy",
      governingAggregateType: "PharmacyCase",
      representationPurpose: "external_interchange",
      triggerMilestoneTypes: [
        "pharmacy.dispatch.started",
        "pharmacy.dispatch.confirmed",
        "pharmacy.outcome.received",
        "pharmacy.outcome.reconciled",
      ],
      requiredEvidenceRefs: [
        "PharmacyCase",
        "PharmacyConsentCheckpoint",
        "DispatchProofEnvelope",
        "OutcomeEvidenceEnvelope",
      ],
      allowedResourceTypes: [
        "ServiceRequest",
        "Communication",
        "DocumentReference",
        "Consent",
        "Provenance",
        "AuditEvent",
      ],
      requiredProfileCanonicalUrls: [
        "https://vecells.example/fhir/StructureDefinition/vecells-pharmacy-service-request",
        "https://vecells.example/fhir/StructureDefinition/vecells-pharmacy-communication",
        "https://vecells.example/fhir/StructureDefinition/vecells-pharmacy-documentreference",
        "https://vecells.example/fhir/StructureDefinition/vecells-pharmacy-consent",
        "https://vecells.example/fhir/StructureDefinition/vecells-pharmacy-provenance",
        "https://vecells.example/fhir/StructureDefinition/vecells-pharmacy-audit-event",
      ],
      identifierPolicyRef: "IDPOL_049_PHARMACY_PACKAGE_FINGERPRINT",
      statusMappingPolicyRef: "STPOL_049_PHARMACY_REFERRAL",
      cardinalityPolicyRef: "CARDPOL_049_PHARMACY_REFERRAL_PACKAGE_SET",
      redactionPolicyRef: "REDPOL_049_MINIMAL_PARTNER_INTERCHANGE",
      companionArtifactPolicyRef: "COMPPOL_049_DISPATCH_MANIFEST_AND_OMISSIONS",
      replayPolicyRef: "REPLAYPOL_049_PACKAGE_HASH_STABLE_REFERRAL_SET",
      supersessionPolicyRef: "SUPPOL_049_COMMITMENT_SUPERSESSION_ON_AUTHORITATIVE_REFRESH",
      callbackCorrelationPolicyRef: "CALLPOL_049_DISPATCH_ATTEMPT_AND_OUTBOUND_REFERENCE_HASH",
      declaredBundlePolicyRefs: ["FXBP_049_PHARMACY_REFERRAL_OUTBOUND_MESSAGE"],
      contractVersionRef: "FRCV_049_PHARMACY_CASE_EXTERNAL_INTERCHANGE_V1",
      contractState: "active",
      publishedAt: "2026-04-13T14:51:08+00:00",
      resourceProfiles: [
        {
          resourceType: "ServiceRequest",
          profileCanonicalUrl:
            "https://vecells.example/fhir/StructureDefinition/vecells-pharmacy-service-request",
        },
        {
          resourceType: "Communication",
          profileCanonicalUrl:
            "https://vecells.example/fhir/StructureDefinition/vecells-pharmacy-communication",
        },
        {
          resourceType: "DocumentReference",
          profileCanonicalUrl:
            "https://vecells.example/fhir/StructureDefinition/vecells-pharmacy-documentreference",
        },
        {
          resourceType: "Consent",
          profileCanonicalUrl:
            "https://vecells.example/fhir/StructureDefinition/vecells-pharmacy-consent",
        },
        {
          resourceType: "Provenance",
          profileCanonicalUrl:
            "https://vecells.example/fhir/StructureDefinition/vecells-pharmacy-provenance",
        },
        {
          resourceType: "AuditEvent",
          profileCanonicalUrl:
            "https://vecells.example/fhir/StructureDefinition/vecells-pharmacy-audit-event",
        },
      ],
      defectState: "active",
      source_refs: [
        "blueprint/phase-0-the-foundation-protocol.md#FhirRepresentationContract",
        "blueprint/phase-6-the-pharmacy-loop.md#The right internal shape is a transport-neutral PharmacyReferralPackage",
        "blueprint/platform-runtime-and-release-blueprint.md#AdapterContractProfile",
      ],
      rationale:
        "Pharmacy referral sets are frozen, consent-gated, package-hash bound outputs, never hidden lifecycle owners.",
    },
    {
      fhirRepresentationContractId: "FRC_049_PHARMACY_CONSENT_CLINICAL_PERSISTENCE_V1",
      owningBoundedContextRef: "pharmacy",
      governingAggregateType: "PharmacyConsentRecord",
      representationPurpose: "clinical_persistence",
      triggerMilestoneTypes: [
        "pharmacy.consent.revocation.recorded",
        "pharmacy.consent.revoked",
        "pharmacy.dispatch.started",
      ],
      requiredEvidenceRefs: ["PharmacyConsentRecord", "PharmacyConsentCheckpoint"],
      allowedResourceTypes: ["Consent", "Provenance"],
      requiredProfileCanonicalUrls: [
        "https://vecells.example/fhir/StructureDefinition/vecells-pharmacy-consent",
        "https://vecells.example/fhir/StructureDefinition/vecells-pharmacy-consent-provenance",
      ],
      identifierPolicyRef: "IDPOL_049_CONSENT_SCOPE_FINGERPRINT",
      statusMappingPolicyRef: "STPOL_049_CONSENT_CHECKPOINT",
      cardinalityPolicyRef: "CARDPOL_049_SINGLE_CONSENT_PER_CHECKPOINT_VERSION",
      redactionPolicyRef: "REDPOL_049_MINIMAL_PARTNER_INTERCHANGE",
      companionArtifactPolicyRef: "COMPPOL_049_PARTNER_EXCHANGE_MANIFEST",
      replayPolicyRef: "REPLAYPOL_049_PACKAGE_HASH_STABLE_REFERRAL_SET",
      supersessionPolicyRef: "SUPPOL_049_CONSENT_INVALIDATION_ON_CHECKPOINT_DRIFT",
      callbackCorrelationPolicyRef: "CALLPOL_049_NONE",
      declaredBundlePolicyRefs: [],
      contractVersionRef: "FRCV_049_PHARMACY_CONSENT_CLINICAL_PERSISTENCE_V1",
      contractState: "active",
      publishedAt: "2026-04-13T14:51:08+00:00",
      resourceProfiles: [
        {
          resourceType: "Consent",
          profileCanonicalUrl:
            "https://vecells.example/fhir/StructureDefinition/vecells-pharmacy-consent",
        },
        {
          resourceType: "Provenance",
          profileCanonicalUrl:
            "https://vecells.example/fhir/StructureDefinition/vecells-pharmacy-consent-provenance",
        },
      ],
      defectState: "active",
      source_refs: [
        "blueprint/phase-0-the-foundation-protocol.md#FhirRepresentationContract",
        "blueprint/phase-6-the-pharmacy-loop.md#PharmacyConsentRecord",
        "blueprint/platform-runtime-and-release-blueprint.md#AdapterContractProfile",
      ],
      rationale:
        "FHIR Consent is allowed only as a representation of the governed pharmacy consent checkpoint, never the owning decision itself.",
    },
    {
      fhirRepresentationContractId: "FRC_049_PHARMACY_DISPATCH_PARTNER_CALLBACK_CORRELATION_V1",
      owningBoundedContextRef: "pharmacy",
      governingAggregateType: "PharmacyDispatchAttempt",
      representationPurpose: "partner_callback_correlation",
      triggerMilestoneTypes: [
        "pharmacy.dispatch.acknowledged",
        "pharmacy.dispatch.proof_missing",
        "confirmation.gate.created",
        "confirmation.gate.confirmed",
        "confirmation.gate.disputed",
      ],
      requiredEvidenceRefs: [
        "PharmacyDispatchAttempt",
        "DispatchProofEnvelope",
        "PharmacyCorrelationRecord",
        "ExternalConfirmationGate",
      ],
      allowedResourceTypes: ["Communication", "Provenance"],
      requiredProfileCanonicalUrls: [
        "https://vecells.example/fhir/StructureDefinition/vecells-pharmacy-callback-communication",
        "https://vecells.example/fhir/StructureDefinition/vecells-pharmacy-callback-provenance",
      ],
      identifierPolicyRef: "IDPOL_049_TRANSPORT_CORRELATION_RECORD",
      statusMappingPolicyRef: "STPOL_049_MESSAGE_COMMUNICATION",
      cardinalityPolicyRef: "CARDPOL_049_SINGLE_COMMUNICATION_PER_DISPATCH",
      redactionPolicyRef: "REDPOL_049_CALLBACK_CORRELATION_MINIMAL",
      companionArtifactPolicyRef: "COMPPOL_049_CALLBACK_RECEIPT_REFS",
      replayPolicyRef: "REPLAYPOL_049_TRANSPORT_CORRELATION_STABLE_CALLBACK_SET",
      supersessionPolicyRef: "SUPPOL_049_CALLBACK_SUPERSESSION_ON_GATE_ROTATION",
      callbackCorrelationPolicyRef: "CALLPOL_049_DISPATCH_ATTEMPT_AND_OUTBOUND_REFERENCE_HASH",
      declaredBundlePolicyRefs: ["FXBP_049_PARTNER_CALLBACK_INBOUND_COLLECTION"],
      contractVersionRef: "FRCV_049_PHARMACY_DISPATCH_PARTNER_CALLBACK_CORRELATION_V1",
      contractState: "active",
      publishedAt: "2026-04-13T14:51:08+00:00",
      resourceProfiles: [
        {
          resourceType: "Communication",
          profileCanonicalUrl:
            "https://vecells.example/fhir/StructureDefinition/vecells-pharmacy-callback-communication",
        },
        {
          resourceType: "Provenance",
          profileCanonicalUrl:
            "https://vecells.example/fhir/StructureDefinition/vecells-pharmacy-callback-provenance",
        },
      ],
      defectState: "active",
      source_refs: [
        "blueprint/phase-0-the-foundation-protocol.md#FhirRepresentationContract",
        "blueprint/phase-6-the-pharmacy-loop.md#Make dispatch idempotent, consent-gated, and acknowledgement-aware",
        "blueprint/platform-runtime-and-release-blueprint.md#AdapterContractProfile",
      ],
      rationale:
        "Pharmacy callback proof and contradiction lanes are explicit bundle-driven companions, not mailbox-local booleans.",
    },
    {
      fhirRepresentationContractId: "FRC_049_REQUEST_CLINICAL_PERSISTENCE_V1",
      owningBoundedContextRef: "foundation_control_plane",
      governingAggregateType: "Request",
      representationPurpose: "clinical_persistence",
      triggerMilestoneTypes: [
        "request.submitted",
        "request.snapshot.created",
        "request.representation.emitted",
        "request.representation.superseded",
      ],
      requiredEvidenceRefs: [
        "EvidenceSnapshot",
        "SubmissionPromotionRecord",
        "RequestClosureRecord",
      ],
      allowedResourceTypes: ["Task", "DocumentReference", "Provenance"],
      requiredProfileCanonicalUrls: [
        "https://vecells.example/fhir/StructureDefinition/vecells-request-task",
        "https://vecells.example/fhir/StructureDefinition/vecells-request-evidence-documentreference",
        "https://vecells.example/fhir/StructureDefinition/vecells-request-provenance",
      ],
      identifierPolicyRef: "IDPOL_049_REQUEST_VERSION_FINGERPRINT",
      statusMappingPolicyRef: "STPOL_049_REQUEST_TASK_LIFECYCLE",
      cardinalityPolicyRef: "CARDPOL_049_REQUEST_ONE_TASK_MANY_DOCS",
      redactionPolicyRef: "REDPOL_049_REFERENCE_ONLY_ARTIFACTS",
      companionArtifactPolicyRef: "COMPPOL_049_DOCUMENT_REFERENCE_BINARY_REFS",
      replayPolicyRef: "REPLAYPOL_049_AGGREGATE_VERSION_STABLE_SET",
      supersessionPolicyRef: "SUPPOL_049_APPEND_ONLY_BY_AGGREGATE_VERSION",
      callbackCorrelationPolicyRef: "CALLPOL_049_NONE",
      declaredBundlePolicyRefs: [],
      contractVersionRef: "FRCV_049_REQUEST_CLINICAL_PERSISTENCE_V1",
      contractState: "active",
      publishedAt: "2026-04-13T14:51:08+00:00",
      resourceProfiles: [
        {
          resourceType: "Task",
          profileCanonicalUrl:
            "https://vecells.example/fhir/StructureDefinition/vecells-request-task",
        },
        {
          resourceType: "DocumentReference",
          profileCanonicalUrl:
            "https://vecells.example/fhir/StructureDefinition/vecells-request-evidence-documentreference",
        },
        {
          resourceType: "Provenance",
          profileCanonicalUrl:
            "https://vecells.example/fhir/StructureDefinition/vecells-request-provenance",
        },
      ],
      defectState: "active",
      source_refs: [
        "blueprint/phase-0-the-foundation-protocol.md#FhirRepresentationContract",
        "blueprint/phase-0-the-foundation-protocol.md#On the FHIR side, the mapping layer must now be explicit and replayable",
        "blueprint/platform-runtime-and-release-blueprint.md#AdapterContractProfile",
      ],
      rationale:
        "Request remains lifecycle authority; FHIR Task and supporting documents are replayable companions only.",
    },
    {
      fhirRepresentationContractId: "FRC_049_REQUEST_EXTERNAL_INTERCHANGE_V1",
      owningBoundedContextRef: "foundation_control_plane",
      governingAggregateType: "Request",
      representationPurpose: "external_interchange",
      triggerMilestoneTypes: [
        "request.submitted",
        "request.evidence.capture.frozen",
        "request.representation.emitted",
      ],
      requiredEvidenceRefs: [
        "EvidenceSnapshot",
        "ConversationCommandSettlement",
        "RequestClosureRecord",
      ],
      allowedResourceTypes: ["Task", "DocumentReference", "Provenance"],
      requiredProfileCanonicalUrls: [
        "https://vecells.example/fhir/StructureDefinition/vecells-request-interchange-task",
        "https://vecells.example/fhir/StructureDefinition/vecells-request-interchange-documentreference",
        "https://vecells.example/fhir/StructureDefinition/vecells-request-interchange-provenance",
      ],
      identifierPolicyRef: "IDPOL_049_REQUEST_VERSION_FINGERPRINT",
      statusMappingPolicyRef: "STPOL_049_REQUEST_TASK_LIFECYCLE",
      cardinalityPolicyRef: "CARDPOL_049_REQUEST_ONE_TASK_MANY_DOCS",
      redactionPolicyRef: "REDPOL_049_MINIMAL_PARTNER_INTERCHANGE",
      companionArtifactPolicyRef: "COMPPOL_049_PARTNER_EXCHANGE_MANIFEST",
      replayPolicyRef: "REPLAYPOL_049_AGGREGATE_VERSION_STABLE_SET",
      supersessionPolicyRef: "SUPPOL_049_APPEND_ONLY_BY_AGGREGATE_VERSION",
      callbackCorrelationPolicyRef: "CALLPOL_049_NONE",
      declaredBundlePolicyRefs: ["FXBP_049_REQUEST_OUTBOUND_DOCUMENT"],
      contractVersionRef: "FRCV_049_REQUEST_EXTERNAL_INTERCHANGE_V1",
      contractState: "active",
      publishedAt: "2026-04-13T14:51:08+00:00",
      resourceProfiles: [
        {
          resourceType: "Task",
          profileCanonicalUrl:
            "https://vecells.example/fhir/StructureDefinition/vecells-request-interchange-task",
        },
        {
          resourceType: "DocumentReference",
          profileCanonicalUrl:
            "https://vecells.example/fhir/StructureDefinition/vecells-request-interchange-documentreference",
        },
        {
          resourceType: "Provenance",
          profileCanonicalUrl:
            "https://vecells.example/fhir/StructureDefinition/vecells-request-interchange-provenance",
        },
      ],
      defectState: "active",
      source_refs: [
        "blueprint/phase-0-the-foundation-protocol.md#FhirRepresentationContract",
        "blueprint/phase-3-the-human-checkpoint.md#Message and callback flow / Phase 3 dispatch and callback split",
        "blueprint/platform-runtime-and-release-blueprint.md#AdapterContractProfile",
      ],
      rationale:
        "Request-level interchange is allowed only as a governed package emitted from settled aggregate truth and frozen evidence.",
    },
  ],
  representationSetPolicies: [
    {
      fhirRepresentationSetPolicyId: "FRSP_049_AUDIT_RECORD_AUDIT_COMPANION_V1",
      representationContractRef: "FRC_049_AUDIT_RECORD_AUDIT_COMPANION_V1",
      governingAggregateType: "AuditRecord",
      representationPurpose: "audit_companion",
      materializationTrigger:
        "Materialize after the declared milestone chain settles: audit.recorded, audit.break_glass.used, audit.export.generated.",
      resourceMembershipRule:
        "Replay must reproduce the same ordered resource membership for the same governing aggregate version, evidence set, and policy tuple.",
      legalBundlePolicyRefs: ["FXBP_049_AUDIT_COMPANION_EXPORT_DOCUMENT"],
      authoritativeSuccessDefinition:
        "The representation set becomes authoritative only when the governing aggregate version, required evidence, and policy tuple hash are all current and replay-safe.",
      supersessionBehavior: "SUPPOL_049_AUDIT_APPEND_ONLY_COMPANION",
      invalidationBehavior:
        "Invalidate the set when identifier inputs, redaction posture, or declared evidence prerequisites drift.",
      mandatoryProofRefs: ["AuditRecord", "AuditEvidenceReference"],
      source_refs: [
        "blueprint/phase-0-the-foundation-protocol.md#FhirRepresentationContract",
        "blueprint/phase-0-the-foundation-protocol.md#AuditRecord",
        "blueprint/platform-runtime-and-release-blueprint.md#AdapterContractProfile",
      ],
    },
    {
      fhirRepresentationSetPolicyId: "FRSP_049_BOOKING_CASE_EXTERNAL_INTERCHANGE_V1",
      representationContractRef: "FRC_049_BOOKING_CASE_EXTERNAL_INTERCHANGE_V1",
      governingAggregateType: "BookingCase",
      representationPurpose: "external_interchange",
      materializationTrigger:
        "Materialize after the declared milestone chain settles: booking.commit.started, booking.commit.confirmation_pending, booking.commit.confirmed, booking.commit.ambiguous.",
      resourceMembershipRule:
        "Replay must reproduce the same ordered resource membership for the same governing aggregate version, evidence set, and policy tuple.",
      legalBundlePolicyRefs: ["FXBP_049_BOOKING_PARTNER_OUTBOUND_MESSAGE"],
      authoritativeSuccessDefinition:
        "The representation set becomes authoritative only when the governing aggregate version, required evidence, and policy tuple hash are all current and replay-safe.",
      supersessionBehavior: "SUPPOL_049_COMMITMENT_SUPERSESSION_ON_AUTHORITATIVE_REFRESH",
      invalidationBehavior:
        "Invalidate the set when identifier inputs, redaction posture, or declared evidence prerequisites drift.",
      mandatoryProofRefs: [
        "BookingCase",
        "BookingProviderAdapterBinding",
        "ExternalConfirmationGate",
      ],
      source_refs: [
        "blueprint/phase-0-the-foundation-protocol.md#FhirRepresentationContract",
        "blueprint/phase-4-the-booking-engine.md#4E Commit path",
        "blueprint/platform-runtime-and-release-blueprint.md#AdapterContractProfile",
      ],
    },
    {
      fhirRepresentationSetPolicyId: "FRSP_049_BOOKING_CASE_PARTNER_CALLBACK_CORRELATION_V1",
      representationContractRef: "FRC_049_BOOKING_CASE_PARTNER_CALLBACK_CORRELATION_V1",
      governingAggregateType: "BookingCase",
      representationPurpose: "partner_callback_correlation",
      materializationTrigger:
        "Materialize after the declared milestone chain settles: booking.commit.confirmation_pending, booking.confirmation.truth.updated, confirmation.gate.created, confirmation.gate.confirmed, confirmation.gate.disputed.",
      resourceMembershipRule:
        "Replay must reproduce the same ordered resource membership for the same governing aggregate version, evidence set, and policy tuple.",
      legalBundlePolicyRefs: ["FXBP_049_PARTNER_CALLBACK_INBOUND_COLLECTION"],
      authoritativeSuccessDefinition:
        "The representation set becomes authoritative only when the governing aggregate version, required evidence, and policy tuple hash are all current and replay-safe.",
      supersessionBehavior: "SUPPOL_049_CALLBACK_SUPERSESSION_ON_GATE_ROTATION",
      invalidationBehavior:
        "Invalidate the set when identifier inputs, redaction posture, or declared evidence prerequisites drift.",
      mandatoryProofRefs: [
        "BookingCase",
        "ExternalConfirmationGate",
        "BookingConfirmationTruthProjection",
      ],
      source_refs: [
        "blueprint/phase-0-the-foundation-protocol.md#FhirRepresentationContract",
        "blueprint/phase-4-the-booking-engine.md#4E Commit path",
        "blueprint/platform-runtime-and-release-blueprint.md#AdapterContractProfile",
      ],
    },
    {
      fhirRepresentationSetPolicyId: "FRSP_049_CALLBACK_CASE_PARTNER_CALLBACK_CORRELATION_V1",
      representationContractRef: "FRC_049_CALLBACK_CASE_PARTNER_CALLBACK_CORRELATION_V1",
      governingAggregateType: "CallbackCase",
      representationPurpose: "partner_callback_correlation",
      materializationTrigger:
        "Materialize after the declared milestone chain settles: communication.callback.outcome.recorded, confirmation.gate.created, confirmation.gate.confirmed, confirmation.gate.disputed.",
      resourceMembershipRule:
        "Replay must reproduce the same ordered resource membership for the same governing aggregate version, evidence set, and policy tuple.",
      legalBundlePolicyRefs: ["FXBP_049_PARTNER_CALLBACK_INBOUND_COLLECTION"],
      authoritativeSuccessDefinition:
        "The representation set becomes authoritative only when the governing aggregate version, required evidence, and policy tuple hash are all current and replay-safe.",
      supersessionBehavior: "SUPPOL_049_CALLBACK_SUPERSESSION_ON_GATE_ROTATION",
      invalidationBehavior:
        "Invalidate the set when identifier inputs, redaction posture, or declared evidence prerequisites drift.",
      mandatoryProofRefs: [
        "CallbackCase",
        "CallbackAttemptRecord",
        "CallbackOutcomeEvidenceBundle",
        "ExternalConfirmationGate",
      ],
      source_refs: [
        "blueprint/phase-0-the-foundation-protocol.md#FhirRepresentationContract",
        "blueprint/callback-and-clinician-messaging-loop.md#Callback domain / Core object / CallbackCase",
        "blueprint/platform-runtime-and-release-blueprint.md#AdapterContractProfile",
      ],
    },
    {
      fhirRepresentationSetPolicyId: "FRSP_049_EVIDENCE_SNAPSHOT_CLINICAL_PERSISTENCE_V1",
      representationContractRef: "FRC_049_EVIDENCE_SNAPSHOT_CLINICAL_PERSISTENCE_V1",
      governingAggregateType: "EvidenceSnapshot",
      representationPurpose: "clinical_persistence",
      materializationTrigger:
        "Materialize after the declared milestone chain settles: request.snapshot.created, request.snapshot.superseded, intake.attachment.quarantined.",
      resourceMembershipRule:
        "Replay must reproduce the same ordered resource membership for the same governing aggregate version, evidence set, and policy tuple.",
      legalBundlePolicyRefs: [],
      authoritativeSuccessDefinition:
        "The representation set becomes authoritative only when the governing aggregate version, required evidence, and policy tuple hash are all current and replay-safe.",
      supersessionBehavior: "SUPPOL_049_DOCUMENT_REF_SUPERSESSION_ON_SNAPSHOT_REPLACEMENT",
      invalidationBehavior:
        "Invalidate the set when identifier inputs, redaction posture, or declared evidence prerequisites drift.",
      mandatoryProofRefs: ["EvidenceSnapshot", "Attachment", "EvidenceAssimilationRecord"],
      source_refs: [
        "blueprint/phase-0-the-foundation-protocol.md#FhirRepresentationContract",
        "blueprint/phase-0-the-foundation-protocol.md#EvidenceSnapshot",
        "blueprint/platform-runtime-and-release-blueprint.md#AdapterContractProfile",
      ],
    },
    {
      fhirRepresentationSetPolicyId: "FRSP_049_HUB_CASE_EXTERNAL_INTERCHANGE_V1",
      representationContractRef: "FRC_049_HUB_CASE_EXTERNAL_INTERCHANGE_V1",
      governingAggregateType: "HubCoordinationCase",
      representationPurpose: "external_interchange",
      materializationTrigger:
        "Materialize after the declared milestone chain settles: hub.offer.created, hub.offer.accepted, hub.booking.confirmation_pending, hub.booking.externally_confirmed.",
      resourceMembershipRule:
        "Replay must reproduce the same ordered resource membership for the same governing aggregate version, evidence set, and policy tuple.",
      legalBundlePolicyRefs: ["FXBP_049_HUB_PARTNER_OUTBOUND_MESSAGE"],
      authoritativeSuccessDefinition:
        "The representation set becomes authoritative only when the governing aggregate version, required evidence, and policy tuple hash are all current and replay-safe.",
      supersessionBehavior: "SUPPOL_049_COMMITMENT_SUPERSESSION_ON_AUTHORITATIVE_REFRESH",
      invalidationBehavior:
        "Invalidate the set when identifier inputs, redaction posture, or declared evidence prerequisites drift.",
      mandatoryProofRefs: [
        "HubCoordinationCase",
        "HubBookingEvidenceBundle",
        "ExternalConfirmationGate",
      ],
      source_refs: [
        "blueprint/phase-0-the-foundation-protocol.md#FhirRepresentationContract",
        "blueprint/phase-5-the-network-horizon.md#Hub commit algorithm",
        "blueprint/platform-runtime-and-release-blueprint.md#AdapterContractProfile",
      ],
    },
    {
      fhirRepresentationSetPolicyId: "FRSP_049_HUB_CASE_PARTNER_CALLBACK_CORRELATION_V1",
      representationContractRef: "FRC_049_HUB_CASE_PARTNER_CALLBACK_CORRELATION_V1",
      governingAggregateType: "HubCoordinationCase",
      representationPurpose: "partner_callback_correlation",
      materializationTrigger:
        "Materialize after the declared milestone chain settles: hub.booking.confirmation_pending, hub.booking.externally_confirmed, confirmation.gate.created, confirmation.gate.confirmed, confirmation.gate.disputed.",
      resourceMembershipRule:
        "Replay must reproduce the same ordered resource membership for the same governing aggregate version, evidence set, and policy tuple.",
      legalBundlePolicyRefs: ["FXBP_049_PARTNER_CALLBACK_INBOUND_COLLECTION"],
      authoritativeSuccessDefinition:
        "The representation set becomes authoritative only when the governing aggregate version, required evidence, and policy tuple hash are all current and replay-safe.",
      supersessionBehavior: "SUPPOL_049_CALLBACK_SUPERSESSION_ON_GATE_ROTATION",
      invalidationBehavior:
        "Invalidate the set when identifier inputs, redaction posture, or declared evidence prerequisites drift.",
      mandatoryProofRefs: [
        "HubCoordinationCase",
        "HubReturnToPracticeRecord",
        "ExternalConfirmationGate",
      ],
      source_refs: [
        "blueprint/phase-0-the-foundation-protocol.md#FhirRepresentationContract",
        "blueprint/phase-5-the-network-horizon.md#Hub commit algorithm",
        "blueprint/platform-runtime-and-release-blueprint.md#AdapterContractProfile",
      ],
    },
    {
      fhirRepresentationSetPolicyId: "FRSP_049_MESSAGE_DISPATCH_EXTERNAL_INTERCHANGE_V1",
      representationContractRef: "FRC_049_MESSAGE_DISPATCH_EXTERNAL_INTERCHANGE_V1",
      governingAggregateType: "MessageDispatchEnvelope",
      representationPurpose: "external_interchange",
      materializationTrigger:
        "Materialize after the declared milestone chain settles: communication.queued, communication.delivery.evidence.recorded, communication.command.settled.",
      resourceMembershipRule:
        "Replay must reproduce the same ordered resource membership for the same governing aggregate version, evidence set, and policy tuple.",
      legalBundlePolicyRefs: ["FXBP_049_SECURE_MESSAGE_OUTBOUND_MESSAGE"],
      authoritativeSuccessDefinition:
        "The representation set becomes authoritative only when the governing aggregate version, required evidence, and policy tuple hash are all current and replay-safe.",
      supersessionBehavior: "SUPPOL_049_COMMUNICATION_SUPERSESSION_ON_SETTLEMENT_REVISION",
      invalidationBehavior:
        "Invalidate the set when identifier inputs, redaction posture, or declared evidence prerequisites drift.",
      mandatoryProofRefs: [
        "MessageDispatchEnvelope",
        "MessageDeliveryEvidenceBundle",
        "ConversationCommandSettlement",
      ],
      source_refs: [
        "blueprint/phase-0-the-foundation-protocol.md#FhirRepresentationContract",
        "blueprint/callback-and-clinician-messaging-loop.md#Clinician message domain / MessageDispatchEnvelope",
        "blueprint/platform-runtime-and-release-blueprint.md#AdapterContractProfile",
      ],
    },
    {
      fhirRepresentationSetPolicyId: "FRSP_049_PHARMACY_CASE_EXTERNAL_INTERCHANGE_V1",
      representationContractRef: "FRC_049_PHARMACY_CASE_EXTERNAL_INTERCHANGE_V1",
      governingAggregateType: "PharmacyCase",
      representationPurpose: "external_interchange",
      materializationTrigger:
        "Materialize after the declared milestone chain settles: pharmacy.dispatch.started, pharmacy.dispatch.confirmed, pharmacy.outcome.received, pharmacy.outcome.reconciled.",
      resourceMembershipRule:
        "Replay must reproduce the same ordered resource membership for the same governing aggregate version, evidence set, and policy tuple.",
      legalBundlePolicyRefs: ["FXBP_049_PHARMACY_REFERRAL_OUTBOUND_MESSAGE"],
      authoritativeSuccessDefinition:
        "The representation set becomes authoritative only when the governing aggregate version, required evidence, and policy tuple hash are all current and replay-safe.",
      supersessionBehavior: "SUPPOL_049_COMMITMENT_SUPERSESSION_ON_AUTHORITATIVE_REFRESH",
      invalidationBehavior:
        "Invalidate the set when identifier inputs, redaction posture, or declared evidence prerequisites drift.",
      mandatoryProofRefs: [
        "PharmacyCase",
        "PharmacyConsentCheckpoint",
        "DispatchProofEnvelope",
        "OutcomeEvidenceEnvelope",
      ],
      source_refs: [
        "blueprint/phase-0-the-foundation-protocol.md#FhirRepresentationContract",
        "blueprint/phase-6-the-pharmacy-loop.md#The right internal shape is a transport-neutral PharmacyReferralPackage",
        "blueprint/platform-runtime-and-release-blueprint.md#AdapterContractProfile",
      ],
    },
    {
      fhirRepresentationSetPolicyId: "FRSP_049_PHARMACY_CONSENT_CLINICAL_PERSISTENCE_V1",
      representationContractRef: "FRC_049_PHARMACY_CONSENT_CLINICAL_PERSISTENCE_V1",
      governingAggregateType: "PharmacyConsentRecord",
      representationPurpose: "clinical_persistence",
      materializationTrigger:
        "Materialize after the declared milestone chain settles: pharmacy.consent.revocation.recorded, pharmacy.consent.revoked, pharmacy.dispatch.started.",
      resourceMembershipRule:
        "Replay must reproduce the same ordered resource membership for the same governing aggregate version, evidence set, and policy tuple.",
      legalBundlePolicyRefs: [],
      authoritativeSuccessDefinition:
        "The representation set becomes authoritative only when the governing aggregate version, required evidence, and policy tuple hash are all current and replay-safe.",
      supersessionBehavior: "SUPPOL_049_CONSENT_INVALIDATION_ON_CHECKPOINT_DRIFT",
      invalidationBehavior:
        "Invalidate the set when identifier inputs, redaction posture, or declared evidence prerequisites drift.",
      mandatoryProofRefs: ["PharmacyConsentRecord", "PharmacyConsentCheckpoint"],
      source_refs: [
        "blueprint/phase-0-the-foundation-protocol.md#FhirRepresentationContract",
        "blueprint/phase-6-the-pharmacy-loop.md#PharmacyConsentRecord",
        "blueprint/platform-runtime-and-release-blueprint.md#AdapterContractProfile",
      ],
    },
    {
      fhirRepresentationSetPolicyId: "FRSP_049_PHARMACY_DISPATCH_PARTNER_CALLBACK_CORRELATION_V1",
      representationContractRef: "FRC_049_PHARMACY_DISPATCH_PARTNER_CALLBACK_CORRELATION_V1",
      governingAggregateType: "PharmacyDispatchAttempt",
      representationPurpose: "partner_callback_correlation",
      materializationTrigger:
        "Materialize after the declared milestone chain settles: pharmacy.dispatch.acknowledged, pharmacy.dispatch.proof_missing, confirmation.gate.created, confirmation.gate.confirmed, confirmation.gate.disputed.",
      resourceMembershipRule:
        "Replay must reproduce the same ordered resource membership for the same governing aggregate version, evidence set, and policy tuple.",
      legalBundlePolicyRefs: ["FXBP_049_PARTNER_CALLBACK_INBOUND_COLLECTION"],
      authoritativeSuccessDefinition:
        "The representation set becomes authoritative only when the governing aggregate version, required evidence, and policy tuple hash are all current and replay-safe.",
      supersessionBehavior: "SUPPOL_049_CALLBACK_SUPERSESSION_ON_GATE_ROTATION",
      invalidationBehavior:
        "Invalidate the set when identifier inputs, redaction posture, or declared evidence prerequisites drift.",
      mandatoryProofRefs: [
        "PharmacyDispatchAttempt",
        "DispatchProofEnvelope",
        "PharmacyCorrelationRecord",
        "ExternalConfirmationGate",
      ],
      source_refs: [
        "blueprint/phase-0-the-foundation-protocol.md#FhirRepresentationContract",
        "blueprint/phase-6-the-pharmacy-loop.md#Make dispatch idempotent, consent-gated, and acknowledgement-aware",
        "blueprint/platform-runtime-and-release-blueprint.md#AdapterContractProfile",
      ],
    },
    {
      fhirRepresentationSetPolicyId: "FRSP_049_REQUEST_CLINICAL_PERSISTENCE_V1",
      representationContractRef: "FRC_049_REQUEST_CLINICAL_PERSISTENCE_V1",
      governingAggregateType: "Request",
      representationPurpose: "clinical_persistence",
      materializationTrigger:
        "Materialize after the declared milestone chain settles: request.submitted, request.snapshot.created, request.representation.emitted, request.representation.superseded.",
      resourceMembershipRule:
        "Replay must reproduce the same ordered resource membership for the same governing aggregate version, evidence set, and policy tuple.",
      legalBundlePolicyRefs: [],
      authoritativeSuccessDefinition:
        "The representation set becomes authoritative only when the governing aggregate version, required evidence, and policy tuple hash are all current and replay-safe.",
      supersessionBehavior: "SUPPOL_049_APPEND_ONLY_BY_AGGREGATE_VERSION",
      invalidationBehavior:
        "Invalidate the set when identifier inputs, redaction posture, or declared evidence prerequisites drift.",
      mandatoryProofRefs: ["EvidenceSnapshot", "SubmissionPromotionRecord", "RequestClosureRecord"],
      source_refs: [
        "blueprint/phase-0-the-foundation-protocol.md#FhirRepresentationContract",
        "blueprint/phase-0-the-foundation-protocol.md#On the FHIR side, the mapping layer must now be explicit and replayable",
        "blueprint/platform-runtime-and-release-blueprint.md#AdapterContractProfile",
      ],
    },
    {
      fhirRepresentationSetPolicyId: "FRSP_049_REQUEST_EXTERNAL_INTERCHANGE_V1",
      representationContractRef: "FRC_049_REQUEST_EXTERNAL_INTERCHANGE_V1",
      governingAggregateType: "Request",
      representationPurpose: "external_interchange",
      materializationTrigger:
        "Materialize after the declared milestone chain settles: request.submitted, request.evidence.capture.frozen, request.representation.emitted.",
      resourceMembershipRule:
        "Replay must reproduce the same ordered resource membership for the same governing aggregate version, evidence set, and policy tuple.",
      legalBundlePolicyRefs: ["FXBP_049_REQUEST_OUTBOUND_DOCUMENT"],
      authoritativeSuccessDefinition:
        "The representation set becomes authoritative only when the governing aggregate version, required evidence, and policy tuple hash are all current and replay-safe.",
      supersessionBehavior: "SUPPOL_049_APPEND_ONLY_BY_AGGREGATE_VERSION",
      invalidationBehavior:
        "Invalidate the set when identifier inputs, redaction posture, or declared evidence prerequisites drift.",
      mandatoryProofRefs: [
        "EvidenceSnapshot",
        "ConversationCommandSettlement",
        "RequestClosureRecord",
      ],
      source_refs: [
        "blueprint/phase-0-the-foundation-protocol.md#FhirRepresentationContract",
        "blueprint/phase-3-the-human-checkpoint.md#Message and callback flow / Phase 3 dispatch and callback split",
        "blueprint/platform-runtime-and-release-blueprint.md#AdapterContractProfile",
      ],
    },
  ],
  assumptions: [
    {
      assumptionId: "ASSUMPTION_049_AUDIT_RECORD_RESOLVES_FROM_PHASE0_AND_EVENT_REGISTRY",
      state: "watch",
      statement:
        "The seq_006 object catalog does not currently carry a first-class AuditRecord row, so seq_049 resolves AuditRecord authority from Phase 0 and the seq_048 audit event contracts until seq_053 publishes the authoritative audit ledger pack.",
      source_refs: [
        "blueprint/phase-0-the-foundation-protocol.md#AuditRecord",
        "data/analysis/canonical_event_contracts.json#audit.recorded",
        "prompt/053.md",
      ],
    },
    {
      assumptionId: "ASSUMPTION_049_EVIDENCE_SNAPSHOT_MATERIALIZATION_STAYS_IN_INTAKE_SAFETY",
      state: "watch",
      statement:
        "EvidenceSnapshot ownership is still marked `unknown` in the seq_006 catalog, so seq_049 anchors representation materialization to `intake_safety` because request snapshot freeze, attachment quarantine, and representation emission already converge there.",
      source_refs: [
        "data/analysis/object_catalog.json#EvidenceSnapshot",
        "data/analysis/canonical_event_contracts.json#request.snapshot.created",
        "data/analysis/canonical_event_contracts.json#request.representation.emitted",
      ],
    },
  ],
  representationDefects: [
    {
      defectId: "ASSUMPTION_049_AUDIT_RECORD_RESOLVES_FROM_PHASE0_AND_EVENT_REGISTRY",
      defectState: "watch",
      summary:
        "The seq_006 object catalog does not currently carry a first-class AuditRecord row, so seq_049 resolves AuditRecord authority from Phase 0 and the seq_048 audit event contracts until seq_053 publishes the authoritative audit ledger pack.",
      source_refs: [
        "blueprint/phase-0-the-foundation-protocol.md#AuditRecord",
        "data/analysis/canonical_event_contracts.json#audit.recorded",
        "prompt/053.md",
      ],
    },
    {
      defectId: "ASSUMPTION_049_EVIDENCE_SNAPSHOT_MATERIALIZATION_STAYS_IN_INTAKE_SAFETY",
      defectState: "watch",
      summary:
        "EvidenceSnapshot ownership is still marked `unknown` in the seq_006 catalog, so seq_049 anchors representation materialization to `intake_safety` because request snapshot freeze, attachment quarantine, and representation emission already converge there.",
      source_refs: [
        "data/analysis/object_catalog.json#EvidenceSnapshot",
        "data/analysis/canonical_event_contracts.json#request.snapshot.created",
        "data/analysis/canonical_event_contracts.json#request.representation.emitted",
      ],
    },
  ],
  representationContractTupleHash:
    "adf301d9e9ba61fe9078935265b0225b310bf75d10ff30eb959448ddd9a575c4",
} as const;
const exchangeBundlePoliciesPayload = {
  task_id: "seq_049",
  generated_at: "2026-04-13T14:51:08+00:00",
  captured_on: "2026-04-13",
  summary: {
    policy_count: 7,
    adapter_profile_count: 7,
    bundle_type_count: 3,
  },
  policies: [
    {
      policyId: "FXBP_049_REQUEST_OUTBOUND_DOCUMENT",
      representationContractRefs: ["FRC_049_REQUEST_EXTERNAL_INTERCHANGE_V1"],
      direction: "outbound",
      legalBundleTypes: ["document"],
      adapterProfileRefs: ["ACP_049_CLINICAL_REQUEST_INTERCHANGE"],
      boundDependencyRefs: [],
      correlationKeyFields: ["requestId", "representationSetId", "bundleHash"],
      receiptCheckpointRefs: ["AdapterReceiptCheckpoint", "CommandSettlementRecord"],
      authoritativeSuccess:
        "Declared partner acceptance plus durable correlation of the emitted document bundle.",
      supersessionBehavior:
        "New request version or snapshot hash supersedes the older bundle and retires its writable use.",
      invalidationBehavior:
        "Any missing snapshot parity, redaction drift, or route-intent mismatch invalidates the bundle.",
      mandatoryProofRefs: ["EvidenceSnapshot", "RequestClosureRecord"],
      exchangeStates: ["staged", "dispatched", "accepted", "replayed", "failed", "superseded"],
      source_refs: [
        "blueprint/phase-0-the-foundation-protocol.md#FhirExchangeBundle",
        "prompt/049.md",
      ],
    },
    {
      policyId: "FXBP_049_SECURE_MESSAGE_OUTBOUND_MESSAGE",
      representationContractRefs: ["FRC_049_MESSAGE_DISPATCH_EXTERNAL_INTERCHANGE_V1"],
      direction: "outbound",
      legalBundleTypes: ["message"],
      adapterProfileRefs: ["ACP_049_SECURE_MESSAGE_DISPATCH"],
      boundDependencyRefs: ["dep_cross_org_secure_messaging_mesh", "dep_origin_practice_ack_rail"],
      correlationKeyFields: ["messageDispatchEnvelopeId", "transportCorrelationKey", "bundleHash"],
      receiptCheckpointRefs: ["AdapterReceiptCheckpoint", "MessageDeliveryEvidenceBundle"],
      authoritativeSuccess:
        "Transport acceptance and delivery evidence must both settle on the same dispatch envelope and correlation key.",
      supersessionBehavior:
        "Settlement upgrades supersede earlier pending companions without rewriting the dispatch envelope.",
      invalidationBehavior:
        "Semantic drift or correlation reuse opens replay collision review and invalidates current confirmation.",
      mandatoryProofRefs: ["ConversationCommandSettlement", "MessageDeliveryEvidenceBundle"],
      exchangeStates: ["staged", "dispatched", "accepted", "replayed", "failed", "superseded"],
      source_refs: [
        "blueprint/platform-runtime-and-release-blueprint.md#AdapterContractProfile",
        "blueprint/callback-and-clinician-messaging-loop.md#Clinician message domain / MessageDispatchEnvelope",
      ],
    },
    {
      policyId: "FXBP_049_BOOKING_PARTNER_OUTBOUND_MESSAGE",
      representationContractRefs: ["FRC_049_BOOKING_CASE_EXTERNAL_INTERCHANGE_V1"],
      direction: "outbound",
      legalBundleTypes: ["message"],
      adapterProfileRefs: ["ACP_049_GP_BOOKING_SUPPLIER_FHIR"],
      boundDependencyRefs: ["dep_gp_system_supplier_paths", "dep_local_booking_supplier_adapters"],
      correlationKeyFields: ["bookingCaseId", "commitmentEpoch", "partnerRef", "bundleHash"],
      receiptCheckpointRefs: ["AdapterReceiptCheckpoint", "ExternalConfirmationGate"],
      authoritativeSuccess:
        "Only authoritative supplier proof or same-commit read-after-write evidence may settle the bundle as confirmed.",
      supersessionBehavior: "New commitment epoch or cancellation supersedes the older bundle.",
      invalidationBehavior:
        "Capability tuple drift, confirmation ambiguity, or gate dispute invalidates writable success posture.",
      mandatoryProofRefs: ["BookingProviderAdapterBinding", "ExternalConfirmationGate"],
      exchangeStates: ["staged", "dispatched", "accepted", "replayed", "failed", "superseded"],
      source_refs: [
        "blueprint/phase-4-the-booking-engine.md#4E Commit path",
        "blueprint/platform-runtime-and-release-blueprint.md#AdapterContractProfile",
      ],
    },
    {
      policyId: "FXBP_049_HUB_PARTNER_OUTBOUND_MESSAGE",
      representationContractRefs: ["FRC_049_HUB_CASE_EXTERNAL_INTERCHANGE_V1"],
      direction: "outbound",
      legalBundleTypes: ["message"],
      adapterProfileRefs: ["ACP_049_HUB_PARTNER_CAPACITY_EXCHANGE"],
      boundDependencyRefs: ["dep_network_capacity_partner_feeds", "dep_origin_practice_ack_rail"],
      correlationKeyFields: ["hubCoordinationCaseId", "confirmationGateId", "bundleHash"],
      receiptCheckpointRefs: [
        "AdapterReceiptCheckpoint",
        "ExternalConfirmationGate",
        "PracticeAcknowledgementRecord",
      ],
      authoritativeSuccess:
        "Native partner confirmation plus required practice-visibility acknowledgement for the same generation.",
      supersessionBehavior:
        "New hub selection or confirmation epoch supersedes the older partner bundle.",
      invalidationBehavior:
        "Practice-visibility debt, gate dispute, or candidate supersession invalidates the bundle.",
      mandatoryProofRefs: ["HubBookingEvidenceBundle", "ExternalConfirmationGate"],
      exchangeStates: ["staged", "dispatched", "accepted", "replayed", "failed", "superseded"],
      source_refs: [
        "blueprint/phase-5-the-network-horizon.md#Hub commit algorithm",
        "blueprint/platform-runtime-and-release-blueprint.md#AdapterContractProfile",
      ],
    },
    {
      policyId: "FXBP_049_PHARMACY_REFERRAL_OUTBOUND_MESSAGE",
      representationContractRefs: ["FRC_049_PHARMACY_CASE_EXTERNAL_INTERCHANGE_V1"],
      direction: "outbound",
      legalBundleTypes: ["message", "document"],
      adapterProfileRefs: ["ACP_049_PHARMACY_REFERRAL_TRANSPORT"],
      boundDependencyRefs: [
        "dep_pharmacy_referral_transport",
        "dep_cross_org_secure_messaging_mesh",
      ],
      correlationKeyFields: [
        "pharmacyCaseId",
        "dispatchAttemptId",
        "packageHash",
        "outboundReferenceSetHash",
      ],
      receiptCheckpointRefs: [
        "AdapterReceiptCheckpoint",
        "DispatchProofEnvelope",
        "ExternalConfirmationGate",
      ],
      authoritativeSuccess:
        "Dispatch proof must satisfy the active transport assurance profile for the same dispatch attempt and package hash.",
      supersessionBehavior:
        "Any new package hash, provider, or dispatch plan supersedes the older bundle and correlation set.",
      invalidationBehavior:
        "Consent drift, checkpoint drift, bundle hash drift, or contradictory proof invalidates the bundle immediately.",
      mandatoryProofRefs: [
        "PharmacyConsentCheckpoint",
        "DispatchProofEnvelope",
        "PharmacyCorrelationRecord",
      ],
      exchangeStates: ["staged", "dispatched", "accepted", "replayed", "failed", "superseded"],
      source_refs: [
        "blueprint/phase-6-the-pharmacy-loop.md#The right internal shape is a transport-neutral PharmacyReferralPackage",
        "blueprint/platform-runtime-and-release-blueprint.md#AdapterContractProfile",
      ],
    },
    {
      policyId: "FXBP_049_PARTNER_CALLBACK_INBOUND_COLLECTION",
      representationContractRefs: [
        "FRC_049_CALLBACK_CASE_PARTNER_CALLBACK_CORRELATION_V1",
        "FRC_049_BOOKING_CASE_PARTNER_CALLBACK_CORRELATION_V1",
        "FRC_049_HUB_CASE_PARTNER_CALLBACK_CORRELATION_V1",
        "FRC_049_PHARMACY_DISPATCH_PARTNER_CALLBACK_CORRELATION_V1",
      ],
      direction: "inbound",
      legalBundleTypes: ["collection", "message"],
      adapterProfileRefs: ["ACP_049_PARTNER_CALLBACK_INGRESS"],
      boundDependencyRefs: ["dep_gp_system_supplier_paths", "dep_pharmacy_outcome_observation"],
      correlationKeyFields: [
        "partnerCorrelationKey",
        "dispatchAttemptId",
        "confirmationGateId",
        "bundleHash",
      ],
      receiptCheckpointRefs: [
        "AdapterReceiptCheckpoint",
        "ExternalConfirmationGate",
        "ReplayCollisionReview",
      ],
      authoritativeSuccess:
        "A callback is authoritative only when it binds to the current gate or dispatch epoch and survives ordering and collision policy.",
      supersessionBehavior:
        "New confirmation or dispatch epochs supersede older callback collections explicitly.",
      invalidationBehavior:
        "Unknown correlation, reordered semantic drift, or contradictory same-key evidence invalidates the callback bundle.",
      mandatoryProofRefs: ["ExternalConfirmationGate", "ReplayCollisionReview"],
      exchangeStates: ["staged", "accepted", "replayed", "failed", "superseded"],
      source_refs: [
        "blueprint/platform-runtime-and-release-blueprint.md#AdapterContractProfile",
        "blueprint/forensic-audit-findings.md#Finding 40 - External outcomes were not modelled as adapter-side event producers",
      ],
    },
    {
      policyId: "FXBP_049_AUDIT_COMPANION_EXPORT_DOCUMENT",
      representationContractRefs: ["FRC_049_AUDIT_RECORD_AUDIT_COMPANION_V1"],
      direction: "outbound",
      legalBundleTypes: ["document", "collection"],
      adapterProfileRefs: ["ACP_049_ASSURANCE_AUDIT_EXPORT"],
      boundDependencyRefs: [],
      correlationKeyFields: ["auditRecordId", "auditHash", "exportBatchId"],
      receiptCheckpointRefs: ["AuditExportCheckpoint"],
      authoritativeSuccess:
        "Export completion is authoritative only when the emitted bundle joins back to the same immutable audit hash chain.",
      supersessionBehavior:
        "New exports append new bundles; they never supersede immutable prior audit truth.",
      invalidationBehavior:
        "Digest drift or missing audit hash join invalidates the export bundle.",
      mandatoryProofRefs: ["AuditRecord", "AuditEvidenceReference"],
      exchangeStates: ["staged", "dispatched", "accepted", "replayed", "failed"],
      source_refs: [
        "blueprint/phase-0-the-foundation-protocol.md#AuditRecord",
        "blueprint/platform-runtime-and-release-blueprint.md#Runtime publication completeness / FhirRepresentationContract",
      ],
    },
  ],
  exchangeTupleHash: "1023ed1ff510f58d65b99f41cd0e8bc1025bf98d05ed7aabda6beaf1d34b5bbe",
} as const;
const policyPayload = {
  task_id: "seq_049",
  generated_at: "2026-04-13T14:51:08+00:00",
  captured_on: "2026-04-13",
  summary: {
    identifier_policy_count: 7,
    status_mapping_policy_count: 8,
    cardinality_policy_count: 7,
    redaction_policy_count: 4,
    companion_artifact_policy_count: 5,
    replay_policy_count: 6,
    supersession_policy_count: 7,
    callback_correlation_policy_count: 4,
    blocked_lifecycle_owner_count: 8,
    assumption_count: 2,
  },
  identifierPolicies: [
    {
      policyId: "IDPOL_049_REQUEST_VERSION_FINGERPRINT",
      label: "Request version fingerprint",
      description:
        "Task logical ids are derived from request lineage and the aggregate version hash.",
      stableInputs: ["requestId", "requestVersion", "representationPurpose"],
      versionRule:
        "Logical id is stable per aggregate version; new version emits new versionId only.",
    },
    {
      policyId: "IDPOL_049_SNAPSHOT_HASH_DOCUMENT",
      label: "Snapshot hash document key",
      description:
        "DocumentReference identifiers are tied to the frozen evidence snapshot hash and artifact hash set.",
      stableInputs: ["evidenceSnapshotId", "snapshotHash", "artifactSetHash"],
      versionRule:
        "New snapshot hash emits a new DocumentReference version and supersedes prior set membership.",
    },
    {
      policyId: "IDPOL_049_TRANSPORT_CORRELATION_RECORD",
      label: "Transport correlation key",
      description:
        "Communication identifiers bind dispatch or callback correlation tokens to the governing case and attempt.",
      stableInputs: ["governingCaseId", "transportCorrelationKey", "dispatchAttemptId"],
      versionRule:
        "Duplicate transport receipts update the same logical id; semantic drift opens replay collision review.",
    },
    {
      policyId: "IDPOL_049_EXTERNAL_COMMITMENT_CASE",
      label: "External commitment case key",
      description:
        "ServiceRequest identifiers bind one external commitment epoch to the governing booking or hub case.",
      stableInputs: ["caseId", "commitmentEpoch", "partnerRef"],
      versionRule:
        "Authoritative commitment refresh increments versionId while preserving case lineage.",
    },
    {
      policyId: "IDPOL_049_PHARMACY_PACKAGE_FINGERPRINT",
      label: "Pharmacy package fingerprint",
      description:
        "Referral identifiers bind the frozen package hash, consent checkpoint, and selected provider tuple.",
      stableInputs: ["pharmacyCaseId", "packageHash", "consentCheckpointId", "providerRef"],
      versionRule:
        "Changing package hash, provider, or consent checkpoint forces new logical ids and plan supersession.",
    },
    {
      policyId: "IDPOL_049_CONSENT_SCOPE_FINGERPRINT",
      label: "Consent scope fingerprint",
      description:
        "FHIR Consent identifiers bind the chosen provider, scope hash, and consent checkpoint generation.",
      stableInputs: ["consentRecordId", "providerRef", "referralScopeHash", "selectionBindingHash"],
      versionRule:
        "Withdrawal or supersession issues a new version tied to the next checkpoint state.",
    },
    {
      policyId: "IDPOL_049_AUDIT_CHAIN_HASH",
      label: "Audit chain hash",
      description:
        "Audit companion resources derive identifiers from the immutable audit chain hash and causal join token.",
      stableInputs: ["auditRecordId", "auditHash", "causalToken"],
      versionRule:
        "Companion audit rows are append-only; they never mutate prior logical ids in place.",
    },
  ],
  statusMappingPolicies: [
    {
      policyId: "STPOL_049_REQUEST_TASK_LIFECYCLE",
      label: "Request task lifecycle mapping",
      resourceType: "Task",
      mappings: {
        submitted: "requested",
        triage_ready: "ready",
        triage_active: "in-progress",
        handoff_active: "in-progress",
        outcome_recorded: "completed",
        closed: "completed",
      },
    },
    {
      policyId: "STPOL_049_EVIDENCE_DOCUMENT_REFERENCE",
      label: "Evidence document mapping",
      resourceType: "DocumentReference",
      mappings: {
        created: "current",
        superseded: "superseded",
        quarantined: "entered-in-error",
      },
    },
    {
      policyId: "STPOL_049_MESSAGE_COMMUNICATION",
      label: "Message and callback communication mapping",
      resourceType: "Communication",
      mappings: {
        queued: "preparation",
        delivery_recorded: "in-progress",
        outcome_recorded: "completed",
        disputed: "stopped",
      },
    },
    {
      policyId: "STPOL_049_BOOKING_COMMITMENT",
      label: "Booking commitment mapping",
      resourceType: "ServiceRequest",
      mappings: {
        commit_started: "active",
        confirmation_pending: "active",
        commit_confirmed: "completed",
        commit_ambiguous: "on-hold",
        cancelled: "revoked",
      },
    },
    {
      policyId: "STPOL_049_HUB_COMMITMENT",
      label: "Hub commitment mapping",
      resourceType: "ServiceRequest",
      mappings: {
        offer_created: "draft",
        offer_accepted: "active",
        confirmation_pending: "on-hold",
        externally_confirmed: "completed",
        return_required: "revoked",
      },
    },
    {
      policyId: "STPOL_049_PHARMACY_REFERRAL",
      label: "Pharmacy referral mapping",
      resourceType: "ServiceRequest",
      mappings: {
        package_ready: "active",
        dispatch_pending: "on-hold",
        referred: "completed",
        outcome_reconciliation_pending: "on-hold",
        resolved: "completed",
        bounce_back: "revoked",
      },
    },
    {
      policyId: "STPOL_049_CONSENT_CHECKPOINT",
      label: "Consent checkpoint mapping",
      resourceType: "Consent",
      mappings: {
        satisfied: "active",
        expiring: "active",
        renewal_required: "inactive",
        withdrawn: "inactive",
        revoked_post_dispatch: "inactive",
      },
    },
    {
      policyId: "STPOL_049_AUDIT_COMPANION",
      label: "Audit companion mapping",
      resourceType: "AuditEvent",
      mappings: {
        recorded: "final",
        break_glass: "final",
        export_generated: "final",
      },
    },
  ],
  cardinalityPolicies: [
    {
      policyId: "CARDPOL_049_REQUEST_ONE_TASK_MANY_DOCS",
      label: "One task plus bounded document set",
      description:
        "One Request aggregate version emits exactly one primary Task and zero or more supporting DocumentReference rows.",
    },
    {
      policyId: "CARDPOL_049_SNAPSHOT_MANY_DOCREFS",
      label: "Snapshot document fan-out",
      description:
        "One EvidenceSnapshot may emit many DocumentReference rows but all belong to one representation set hash.",
    },
    {
      policyId: "CARDPOL_049_SINGLE_COMMUNICATION_PER_DISPATCH",
      label: "Single communication per dispatch or callback epoch",
      description:
        "Each dispatch or callback epoch emits at most one current Communication companion at a time.",
    },
    {
      policyId: "CARDPOL_049_SINGLE_SERVICE_REQUEST_COMMITMENT",
      label: "Single commitment per case epoch",
      description:
        "Each booking, hub, or pharmacy commitment epoch may emit one current ServiceRequest with companion resources.",
    },
    {
      policyId: "CARDPOL_049_PHARMACY_REFERRAL_PACKAGE_SET",
      label: "Referral package set",
      description:
        "Each pharmacy package hash emits one ServiceRequest plus bounded supporting Communication, Consent, DocumentReference, Provenance, and AuditEvent rows.",
    },
    {
      policyId: "CARDPOL_049_SINGLE_CONSENT_PER_CHECKPOINT_VERSION",
      label: "Single consent per checkpoint version",
      description:
        "Each PharmacyConsentCheckpoint version emits one current Consent row with append-only supersession.",
    },
    {
      policyId: "CARDPOL_049_SINGLE_AUDIT_EVENT_PLUS_PROVENANCE",
      label: "Single audit companion pair",
      description: "Each immutable audit join emits one AuditEvent and one Provenance row only.",
    },
  ],
  redactionPolicies: [
    {
      policyId: "REDPOL_049_REFERENCE_ONLY_ARTIFACTS",
      label: "Reference-only artifacts",
      description:
        "Payloads carry governed artifact refs, checksums, and masked descriptors only; no binary bodies or transcript text.",
    },
    {
      policyId: "REDPOL_049_MINIMAL_PARTNER_INTERCHANGE",
      label: "Minimal partner interchange",
      description:
        "Only partner-required structured fields and declared profile elements may cross the boundary.",
    },
    {
      policyId: "REDPOL_049_CALLBACK_CORRELATION_MINIMAL",
      label: "Callback correlation minimal disclosure",
      description:
        "Inbound callback correlation exposes only partner correlation tokens, declared identifiers, and checkpoint posture.",
    },
    {
      policyId: "REDPOL_049_AUDIT_COMPANION_MASKED",
      label: "Audit companion masked detail",
      description:
        "FHIR AuditEvent and Provenance carry masked operator and actor descriptors while the immutable internal audit row stays authoritative.",
    },
  ],
  companionArtifactPolicies: [
    {
      policyId: "COMPPOL_049_DOCUMENT_REFERENCE_BINARY_REFS",
      label: "DocumentReference binary refs",
      description:
        "DocumentReference rows may reference Attachment object keys, checksums, and malware/quarantine posture but not inline payload bodies.",
    },
    {
      policyId: "COMPPOL_049_PARTNER_EXCHANGE_MANIFEST",
      label: "Partner exchange manifest",
      description:
        "External bundles may carry an omission/redaction manifest that traces every excluded artifact or field to policy.",
    },
    {
      policyId: "COMPPOL_049_CALLBACK_RECEIPT_REFS",
      label: "Callback receipt refs",
      description:
        "Callback bundles must join to receipt checkpoints and replay-collision evidence instead of local receipt booleans.",
    },
    {
      policyId: "COMPPOL_049_DISPATCH_MANIFEST_AND_OMISSIONS",
      label: "Dispatch manifest and omissions",
      description:
        "Pharmacy referral transport may include manifest evidence describing redactions or transport-specific omissions without rewriting the frozen canonical set.",
    },
    {
      policyId: "COMPPOL_049_AUDIT_HASH_JOIN",
      label: "Audit hash join",
      description:
        "Audit companions must keep the immutable audit hash join and provenance linkage explicit.",
    },
  ],
  replayPolicies: [
    {
      policyId: "REPLAYPOL_049_AGGREGATE_VERSION_STABLE_SET",
      label: "Stable set by aggregate version",
      stableMembershipOnReplay: true,
      description:
        "Replaying the same aggregate version rematerializes the same resource membership and identifier set.",
    },
    {
      policyId: "REPLAYPOL_049_SNAPSHOT_HASH_STABLE_DOCS",
      label: "Stable docs by snapshot hash",
      stableMembershipOnReplay: true,
      description:
        "EvidenceSnapshot replay reproduces the same DocumentReference collection while snapshot hash inputs are unchanged.",
    },
    {
      policyId: "REPLAYPOL_049_TRANSPORT_CORRELATION_STABLE_CALLBACK_SET",
      label: "Stable callback set by transport correlation",
      stableMembershipOnReplay: true,
      description:
        "Duplicate or reordered callbacks target the same representation set until semantic drift forces collision review.",
    },
    {
      policyId: "REPLAYPOL_049_COMMITMENT_PROOF_STABLE_SERVICE_REQUEST",
      label: "Stable commitment by proof tuple",
      stableMembershipOnReplay: true,
      description:
        "Booking and hub commitment replay reproduces the same ServiceRequest membership until the authoritative commitment tuple changes.",
    },
    {
      policyId: "REPLAYPOL_049_PACKAGE_HASH_STABLE_REFERRAL_SET",
      label: "Stable referral by package hash",
      stableMembershipOnReplay: true,
      description:
        "The same pharmacy package hash, consent checkpoint, and provider tuple must rematerialize the same referral set.",
    },
    {
      policyId: "REPLAYPOL_049_AUDIT_HASH_APPEND_ONLY",
      label: "Append-only audit replay",
      stableMembershipOnReplay: true,
      description:
        "Audit companion replay may append new exports but may not silently fork prior audit companions for the same audit hash.",
    },
  ],
  supersessionPolicies: [
    {
      policyId: "SUPPOL_049_APPEND_ONLY_BY_AGGREGATE_VERSION",
      label: "Append-only by aggregate version",
      description:
        "New aggregate versions append new representation sets and explicitly supersede prior versions without mutating history.",
    },
    {
      policyId: "SUPPOL_049_DOCUMENT_REF_SUPERSESSION_ON_SNAPSHOT_REPLACEMENT",
      label: "Snapshot replacement supersedes documents",
      description:
        "Superseding an EvidenceSnapshot invalidates the older DocumentReference membership while preserving immutable prior rows.",
    },
    {
      policyId: "SUPPOL_049_COMMUNICATION_SUPERSESSION_ON_SETTLEMENT_REVISION",
      label: "Communication supersession on settlement revision",
      description:
        "Communication companions supersede only when the same dispatch or callback epoch receives a stronger settlement or contradiction.",
    },
    {
      policyId: "SUPPOL_049_COMMITMENT_SUPERSESSION_ON_AUTHORITATIVE_REFRESH",
      label: "Commitment supersession on authoritative refresh",
      description:
        "Booking and hub ServiceRequest resources supersede only on authoritative refresh or cancellation evidence.",
    },
    {
      policyId: "SUPPOL_049_CALLBACK_SUPERSESSION_ON_GATE_ROTATION",
      label: "Callback supersession on gate rotation",
      description:
        "Callback correlation representations supersede only when a new confirmation gate or correlation epoch replaces the old one.",
    },
    {
      policyId: "SUPPOL_049_CONSENT_INVALIDATION_ON_CHECKPOINT_DRIFT",
      label: "Consent invalidation on checkpoint drift",
      description:
        "Consent drift, withdrawal, or renewed checkpoint invalidates the prior current Consent row and requires a new representation set.",
    },
    {
      policyId: "SUPPOL_049_AUDIT_APPEND_ONLY_COMPANION",
      label: "Audit append-only companion",
      description:
        "Audit companions never rewrite the underlying audit truth; new exports append a new companion row with the same causal join.",
    },
  ],
  callbackCorrelationPolicies: [
    {
      policyId: "CALLPOL_049_NONE",
      label: "No callback correlation",
      description:
        "Clinical persistence-only contracts do not participate in partner callback correlation.",
    },
    {
      policyId: "CALLPOL_049_TRANSPORT_CORRELATION_KEYS",
      label: "Transport correlation keys",
      description:
        "Message or callback companions correlate via declared transport tokens and durable receipt checkpoints only.",
    },
    {
      policyId: "CALLPOL_049_EXTERNAL_CONFIRMATION_GATE",
      label: "External confirmation gate correlation",
      description:
        "Callback representations bind to one current ExternalConfirmationGate and may not infer final success from transport acceptance alone.",
    },
    {
      policyId: "CALLPOL_049_DISPATCH_ATTEMPT_AND_OUTBOUND_REFERENCE_HASH",
      label: "Dispatch attempt and outbound reference hash",
      description:
        "Pharmacy callback and proof correlation bind to the active dispatch attempt, dispatch plan hash, and outbound reference set hash.",
    },
  ],
  prohibitedLifecycleOwners: [
    {
      objectType: "AccessGrant",
      blockedReason:
        "Access grants are internal capability truth and may not surface as FHIR lifecycle owners.",
      source_refs: [
        "blueprint/phase-0-the-foundation-protocol.md#On the FHIR side, the mapping layer must now be explicit and replayable",
      ],
    },
    {
      objectType: "CapabilityDecision",
      blockedReason:
        "CapabilityDecision is internal trust law and may not be flattened into FHIR status.",
      source_refs: [
        "blueprint/phase-0-the-foundation-protocol.md#On the FHIR side, the mapping layer must now be explicit and replayable",
      ],
    },
    {
      objectType: "Session",
      blockedReason: "Session is local authority and never partner-visible FHIR lifecycle truth.",
      source_refs: [
        "blueprint/phase-0-the-foundation-protocol.md#On the FHIR side, the mapping layer must now be explicit and replayable",
      ],
    },
    {
      objectType: "RequestLifecycleLease",
      blockedReason: "Lease ownership and takeover are control-plane facts, not FHIR statuses.",
      source_refs: [
        "blueprint/phase-0-the-foundation-protocol.md#On the FHIR side, the mapping layer must now be explicit and replayable",
      ],
    },
    {
      objectType: "CapacityReservation",
      blockedReason:
        "Reservation truth remains internal and may not be replaced by FHIR commitment state.",
      source_refs: [
        "blueprint/phase-0-the-foundation-protocol.md#On the FHIR side, the mapping layer must now be explicit and replayable",
      ],
    },
    {
      objectType: "AudienceSurfaceRuntimeBinding",
      blockedReason: "Browser/runtime parity tuples are release controls, not clinical resources.",
      source_refs: [
        "blueprint/platform-runtime-and-release-blueprint.md#AudienceSurfaceRuntimeBinding",
      ],
    },
    {
      objectType: "ReleasePublicationParityRecord",
      blockedReason:
        "Publication parity remains release control truth and may not leak into FHIR authority.",
      source_refs: [
        "blueprint/platform-runtime-and-release-blueprint.md#ReleasePublicationParityRecord",
      ],
    },
    {
      objectType: "ReleaseTrustFreezeVerdict",
      blockedReason:
        "Trust and freeze posture are control-plane decisions, not FHIR-owned lifecycle state.",
      source_refs: [
        "blueprint/platform-runtime-and-release-blueprint.md#ReleaseTrustFreezeVerdict",
      ],
    },
  ],
  assumptions: [
    {
      assumptionId: "ASSUMPTION_049_AUDIT_RECORD_RESOLVES_FROM_PHASE0_AND_EVENT_REGISTRY",
      state: "watch",
      statement:
        "The seq_006 object catalog does not currently carry a first-class AuditRecord row, so seq_049 resolves AuditRecord authority from Phase 0 and the seq_048 audit event contracts until seq_053 publishes the authoritative audit ledger pack.",
      source_refs: [
        "blueprint/phase-0-the-foundation-protocol.md#AuditRecord",
        "data/analysis/canonical_event_contracts.json#audit.recorded",
        "prompt/053.md",
      ],
    },
    {
      assumptionId: "ASSUMPTION_049_EVIDENCE_SNAPSHOT_MATERIALIZATION_STAYS_IN_INTAKE_SAFETY",
      state: "watch",
      statement:
        "EvidenceSnapshot ownership is still marked `unknown` in the seq_006 catalog, so seq_049 anchors representation materialization to `intake_safety` because request snapshot freeze, attachment quarantine, and representation emission already converge there.",
      source_refs: [
        "data/analysis/object_catalog.json#EvidenceSnapshot",
        "data/analysis/canonical_event_contracts.json#request.snapshot.created",
        "data/analysis/canonical_event_contracts.json#request.representation.emitted",
      ],
    },
  ],
  policyTupleHash: "3d09e58e18cf96cbe94f931a09953579acc1f70f24ab00ee9a521247eee313a8",
} as const;
const contractCatalog = {
  task_id: "seq_049",
  generated_at: "2026-04-13T14:51:08+00:00",
  artifacts: [
    {
      artifactType: "representation_contracts",
      artifactPath: "packages/fhir-mapping/contracts/representation-contracts.json",
    },
    {
      artifactType: "exchange_bundle_policies",
      artifactPath: "packages/fhir-mapping/contracts/exchange-bundle-policies.json",
    },
    {
      artifactType: "identifier_and_status_policies",
      artifactPath: "packages/fhir-mapping/contracts/identifier-and-status-policies.json",
    },
    {
      contractId: "FRC_049_AUDIT_RECORD_AUDIT_COMPANION_V1",
      artifactPath:
        "packages/fhir-mapping/contracts/contracts/frc-049-audit-record-audit-companion-v1.json",
      artifactHash: "7b0edfe140ede3d75763fd3a799b2bd562653a8c75429885c63673ee5d48967e",
    },
    {
      contractId: "FRC_049_BOOKING_CASE_EXTERNAL_INTERCHANGE_V1",
      artifactPath:
        "packages/fhir-mapping/contracts/contracts/frc-049-booking-case-external-interchange-v1.json",
      artifactHash: "cc3fd3bc01a0a355e23dbde639013454bedab81558fac85154f5ade325df6289",
    },
    {
      contractId: "FRC_049_BOOKING_CASE_PARTNER_CALLBACK_CORRELATION_V1",
      artifactPath:
        "packages/fhir-mapping/contracts/contracts/frc-049-booking-case-partner-callback-correlation-v1.json",
      artifactHash: "07b5a7e97cf6d7d0c135adc787b10b0bdc0077d05fd9e216314e50e7debd819e",
    },
    {
      contractId: "FRC_049_CALLBACK_CASE_PARTNER_CALLBACK_CORRELATION_V1",
      artifactPath:
        "packages/fhir-mapping/contracts/contracts/frc-049-callback-case-partner-callback-correlation-v1.json",
      artifactHash: "3004558e3f35e2cc72ea0b869ebd16bcbb768d19d72cccca1d81b209abb40e9c",
    },
    {
      contractId: "FRC_049_EVIDENCE_SNAPSHOT_CLINICAL_PERSISTENCE_V1",
      artifactPath:
        "packages/fhir-mapping/contracts/contracts/frc-049-evidence-snapshot-clinical-persistence-v1.json",
      artifactHash: "b868e347c256f84f6dede789ee9af5b746ebbcfc95615452cd9a22ba2a87b2ce",
    },
    {
      contractId: "FRC_049_HUB_CASE_EXTERNAL_INTERCHANGE_V1",
      artifactPath:
        "packages/fhir-mapping/contracts/contracts/frc-049-hub-case-external-interchange-v1.json",
      artifactHash: "51a4f0e2fdf73df48b684c138f6802c6190e0976d262943ccf48d36c50f81fc7",
    },
    {
      contractId: "FRC_049_HUB_CASE_PARTNER_CALLBACK_CORRELATION_V1",
      artifactPath:
        "packages/fhir-mapping/contracts/contracts/frc-049-hub-case-partner-callback-correlation-v1.json",
      artifactHash: "3bf92e8a1d383b0afdda40490c5b2490fcee932c3757e167b0b75ddf35ef2c7e",
    },
    {
      contractId: "FRC_049_MESSAGE_DISPATCH_EXTERNAL_INTERCHANGE_V1",
      artifactPath:
        "packages/fhir-mapping/contracts/contracts/frc-049-message-dispatch-external-interchange-v1.json",
      artifactHash: "9f476ad52bce2f4d33a8c6d7ad5c824ac15f08f0113cc57e577f67e6faa2d050",
    },
    {
      contractId: "FRC_049_PHARMACY_CASE_EXTERNAL_INTERCHANGE_V1",
      artifactPath:
        "packages/fhir-mapping/contracts/contracts/frc-049-pharmacy-case-external-interchange-v1.json",
      artifactHash: "911fdc28192c3901b4ed96583d3da6afb378f0af21f329b7cf69485bdb37f936",
    },
    {
      contractId: "FRC_049_PHARMACY_CONSENT_CLINICAL_PERSISTENCE_V1",
      artifactPath:
        "packages/fhir-mapping/contracts/contracts/frc-049-pharmacy-consent-clinical-persistence-v1.json",
      artifactHash: "1bbccd38b9b66615292a12a1b72b6a9eb763a3981c9a771dedb5c4139d14fed9",
    },
    {
      contractId: "FRC_049_PHARMACY_DISPATCH_PARTNER_CALLBACK_CORRELATION_V1",
      artifactPath:
        "packages/fhir-mapping/contracts/contracts/frc-049-pharmacy-dispatch-partner-callback-correlation-v1.json",
      artifactHash: "65d40913fc10fdc01f237eff05ba1ad761b9356be2665dd43a11fa209be82de1",
    },
    {
      contractId: "FRC_049_REQUEST_CLINICAL_PERSISTENCE_V1",
      artifactPath:
        "packages/fhir-mapping/contracts/contracts/frc-049-request-clinical-persistence-v1.json",
      artifactHash: "fa17576d4e1d51086e52cccfc877dba29782ce8556edebb9ecde6bf39e454ebd",
    },
    {
      contractId: "FRC_049_REQUEST_EXTERNAL_INTERCHANGE_V1",
      artifactPath:
        "packages/fhir-mapping/contracts/contracts/frc-049-request-external-interchange-v1.json",
      artifactHash: "f99011e612dbcc1774adffa8d03a03deaa2565a0d75a0080aaa6b4808b532304",
    },
  ],
  catalogHash: "2e72743c080a5c825335934639224601e9b36cd44e4f876bba854d39f00a42c4",
} as const;

export const foundationFhirMappings = {
  request_task: "Task",
  evidence_snapshot: "DocumentReference",
  message_dispatch: "Communication",
  booking_commitment: "ServiceRequest",
  hub_commitment: "ServiceRequest",
  pharmacy_referral: "ServiceRequest",
  pharmacy_consent: "Consent",
  audit_companion: "AuditEvent",
} as const;

export interface OwnedObjectFamily {
  canonicalName: string;
  objectKind: string;
  boundedContext: string;
  authoritativeOwner: string;
  sourceRef: string;
}

export interface OwnedContractFamily {
  contractFamilyId: string;
  label: string;
  description: string;
  versioningPosture: string;
  consumerContractIds: readonly string[];
  consumerOwnerCodes: readonly string[];
  consumerSelectors: readonly string[];
  sourceRefs: readonly string[];
  ownedObjectFamilyCount: number;
}

export interface PackageContract {
  artifactId: string;
  packageName: string;
  packageRole: string;
  ownerContextCode: string;
  ownerContextLabel: string;
  purpose: string;
  versioningPosture: string;
  allowedDependencies: readonly string[];
  forbiddenDependencies: readonly string[];
  dependencyContractRefs: readonly string[];
  objectFamilyCount: number;
  contractFamilyCount: number;
  sourceContexts: readonly string[];
}

export const packageContract = {
  artifactId: "package_fhir_mapping",
  packageName: "@vecells/fhir-mapping",
  packageRole: "shared",
  ownerContextCode: "shared_contracts",
  ownerContextLabel: "Shared Contracts",
  purpose:
    "Canonical FHIR representation contract authority for replay-safe clinical persistence, partner interchange, callback correlation, and audit companion output.",
  versioningPosture:
    "Workspace-private published contract boundary. Public exports are explicit, diffable, and versionable.",
  allowedDependencies: [
    "packages/domain-kernel",
    "packages/event-contracts",
    "packages/domains/* (representation-only entrypoints)",
  ],
  forbiddenDependencies: ["apps/*", "services/* raw-store writes"],
  dependencyContractRefs: ["CBC_041_PROJECTION_WORKER_TO_FHIR_MAPPING"],
  objectFamilyCount: 4,
  contractFamilyCount: 2,
  sourceContexts: [
    "audit_compliance",
    "booking",
    "communications",
    "foundation_control_plane",
    "hub_coordination",
    "intake_safety",
    "pharmacy",
    "runtime_release",
  ],
} as const satisfies PackageContract;

export const ownedObjectFamilies = [
  {
    canonicalName: "FhirRepresentationContract",
    objectKind: "contract",
    boundedContext: "runtime_release",
    authoritativeOwner: "Clinical representation mapper",
    sourceRef: "blueprint/phase-0-the-foundation-protocol.md#FhirRepresentationContract",
  },
  {
    canonicalName: "FhirRepresentationSet",
    objectKind: "record",
    boundedContext: "runtime_release",
    authoritativeOwner: "Clinical representation mapper",
    sourceRef: "blueprint/phase-0-the-foundation-protocol.md#FhirRepresentationSet",
  },
  {
    canonicalName: "FhirResourceRecord",
    objectKind: "record",
    boundedContext: "runtime_release",
    authoritativeOwner: "Clinical representation mapper",
    sourceRef: "blueprint/phase-0-the-foundation-protocol.md#FhirResourceRecord",
  },
  {
    canonicalName: "FhirExchangeBundle",
    objectKind: "bundle",
    boundedContext: "runtime_release",
    authoritativeOwner: "Clinical representation mapper",
    sourceRef: "blueprint/phase-0-the-foundation-protocol.md#FhirExchangeBundle",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const ownedContractFamilies = [
  {
    contractFamilyId: "CF_049_FHIR_REPRESENTATION_AUTHORITY",
    label: "FHIR representation authority",
    description:
      "Canonical mapping authority for turning domain aggregates into replay-safe FHIR representation sets.",
    versioningPosture:
      "Contract-first and replay-safe. Aggregate truth stays authoritative while FHIR remains representational.",
    consumerContractIds: [
      "CBC_041_PROJECTION_WORKER_TO_FHIR_MAPPING",
      "CBC_041_ADAPTER_SIMULATORS_TO_CONTRACT_AND_FIXTURE_PACKAGES",
    ],
    consumerOwnerCodes: ["platform_integration", "platform_runtime"],
    consumerSelectors: ["services/adapter-simulators", "services/projection-worker"],
    sourceRefs: [
      "blueprint/phase-0-the-foundation-protocol.md#FhirRepresentationContract",
      "prompt/049.md",
    ],
    ownedObjectFamilyCount: 4,
  },
  {
    contractFamilyId: "CF_049_FHIR_EXCHANGE_BUNDLE_LAW",
    label: "FHIR exchange bundle law",
    description:
      "Adapter-boundary bundle policies for outbound interchange, inbound callbacks, and audit-companion export.",
    versioningPosture:
      "Bundle types, adapter profile refs, and proof-upgrade law are explicit and diffable.",
    consumerContractIds: [
      "CBC_041_PROJECTION_WORKER_TO_FHIR_MAPPING",
      "CBC_041_ADAPTER_SIMULATORS_TO_CONTRACT_AND_FIXTURE_PACKAGES",
    ],
    consumerOwnerCodes: ["platform_integration", "platform_runtime"],
    consumerSelectors: ["services/adapter-simulators", "services/projection-worker"],
    sourceRefs: [
      "blueprint/platform-runtime-and-release-blueprint.md#AdapterContractProfile",
      "prompt/049.md",
    ],
    ownedObjectFamilyCount: 4,
  },
] as const satisfies readonly OwnedContractFamily[];

export const eventFamilies = [] as const satisfies readonly OwnedObjectFamily[];
export const policyFamilies = ownedObjectFamilies;
export const projectionFamilies = [] as const satisfies readonly OwnedObjectFamily[];

export const fhirRepresentationFamilies = ownedObjectFamilies;
export const fhirRepresentationContracts = representationContractsPayload.contracts;
export const fhirRepresentationSetPolicies =
  representationContractsPayload.representationSetPolicies;
export const fhirExchangeBundlePolicies = exchangeBundlePoliciesPayload.policies;
export const fhirIdentifierPolicies = policyPayload.identifierPolicies;
export const fhirStatusMappingPolicies = policyPayload.statusMappingPolicies;
export const blockedFhirLifecycleOwners = policyPayload.prohibitedLifecycleOwners;
export const fhirContractCatalog = contractCatalog;

export function makeFhirMappingKey(resourceType: string, profile: string): string {
  return `${resourceType}::${profile}`;
}

export function bootstrapSharedPackage() {
  return {
    packageName: packageContract.packageName,
    objectFamilies: ownedObjectFamilies.length,
    contractFamilies: ownedContractFamilies.length,
    representationContracts: fhirRepresentationContracts.length,
    exchangeBundlePolicies: fhirExchangeBundlePolicies.length,
    blockedLifecycleOwners: blockedFhirLifecycleOwners.length,
  };
}

export * from "./representation-compiler";
