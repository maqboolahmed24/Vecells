# 06 Object Catalog

The full machine-readable catalog lives in `data/analysis/object_catalog.json`. This index keeps the primary fields reviewable in one human-readable document.

## Counts

| Object kind | Count |
| --- | --- |
| aggregate | 7 |
| artifact | 22 |
| blocker | 1 |
| bundle | 30 |
| case | 9 |
| checkpoint | 13 |
| contract | 40 |
| descriptor | 72 |
| digest | 21 |
| event_contract | 10 |
| gate | 19 |
| grant | 6 |
| lease | 22 |
| manifest | 12 |
| namespace | 1 |
| other | 319 |
| policy | 27 |
| projection | 87 |
| record | 182 |
| settlement | 32 |
| thread | 1 |
| token | 8 |
| tuple | 3 |
| witness | 6 |

## Catalog Index

| Object ID | Canonical name | Kind | Context | Phase | Owner | Source |
| --- | --- | --- | --- | --- | --- | --- |
| OBJ_ABSTENTIONRECORD | AbstentionRecord | record | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_ACCESSADMINISTRATIONWORKSPACE | AccessAdministrationWorkspace | other | platform_configuration | cross_cutting_platform_admin | Platform administration and configuration | platform-admin-and-config-blueprint.md |
| OBJ_ACCESSEVENTINDEX | AccessEventIndex | other | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_ACCESSFREEZEDISPOSITION | AccessFreezeDisposition | record | platform_configuration | cross_cutting_platform_admin | Platform administration and configuration | platform-admin-and-config-blueprint.md |
| OBJ_ACCESSGRANT | AccessGrant | grant | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_ACCESSGRANTREDEMPTIONRECORD | AccessGrantRedemptionRecord | record | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_ACCESSGRANTSCOPEENVELOPE | AccessGrantScopeEnvelope | record | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_ACCESSGRANTSERVICE | AccessGrantService | other | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_ACCESSGRANTSUPERSESSIONRECORD | AccessGrantSupersessionRecord | record | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_ACCESSIBILITYEQUIVALENCECHECK | AccessibilityEquivalenceCheck | other | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_ACCESSIBILITYSEMANTICCOVERAGEPROFILE | AccessibilitySemanticCoverageProfile | descriptor | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_ACCESSIBLECONTENTVARIANT | AccessibleContentVariant | other | unknown | phase_7_embedded_channel_deferred | Programme architecture registry | phase-7-inside-the-nhs-app.md |
| OBJ_ACCESSIBLESURFACECONTRACT | AccessibleSurfaceContract | contract | frontend_runtime | cross_cutting_accessibility_content | Frontend continuity runtime | accessibility-and-content-system-contract.md |
| OBJ_ACCESSIMPACTDIGEST | AccessImpactDigest | digest | platform_configuration | cross_cutting_platform_admin | Platform administration and configuration | platform-admin-and-config-blueprint.md |
| OBJ_ACTINGCONTEXT | ActingContext | other | hub_coordination | phase_5_network_horizon | Hub coordination domain | phase-5-the-network-horizon.md |
| OBJ_ACTINGCONTEXTGOVERNOR | ActingContextGovernor | other | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_ACTINGSCOPETUPLE | ActingScopeTuple | tuple | unknown | audited_flow_baseline | Programme architecture registry | vecells-complete-end-to-end-flow.md |
| OBJ_ADAPTERCONTRACTPROFILE | AdapterContractProfile | descriptor | booking | phase_4_booking_engine | Booking domain | phase-4-the-booking-engine.md |
| OBJ_ADAPTERDISPATCHATTEMPT | AdapterDispatchAttempt | record | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_ADAPTERRECEIPTCHECKPOINT | AdapterReceiptCheckpoint | checkpoint | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_ADMINACTIONRECORD | AdminActionRecord | record | platform_configuration | cross_cutting_platform_admin | Platform administration and configuration | platform-admin-and-config-blueprint.md |
| OBJ_ADMINACTIONSETTLEMENT | AdminActionSettlement | settlement | platform_configuration | cross_cutting_platform_admin | Platform administration and configuration | platform-admin-and-config-blueprint.md |
| OBJ_ADMINRESOLUTIONACTIONRECORD | AdminResolutionActionRecord | record | self_care_admin_resolution | cross_cutting_self_care_admin_resolution | Self-care and admin-resolution domain | self-care-content-and-admin-resolution-blueprint.md |
| OBJ_ADMINRESOLUTIONCASE | AdminResolutionCase | case | self_care_admin_resolution | phase_0_foundation | Self-care and admin-resolution domain | phase-0-the-foundation-protocol.md |
| OBJ_ADMINRESOLUTIONCOMPLETIONARTIFACT | AdminResolutionCompletionArtifact | artifact | self_care_admin_resolution | cross_cutting_self_care_admin_resolution | Self-care and admin-resolution domain | self-care-content-and-admin-resolution-blueprint.md |
| OBJ_ADMINRESOLUTIONDIGEST | AdminResolutionDigest | digest | staff_support_operations | cross_cutting_staff_workspace | Staff, support, and operations control | staff-workspace-interface-architecture.md |
| OBJ_ADMINRESOLUTIONEXPERIENCEPROJECTION | AdminResolutionExperienceProjection | projection | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_ADMINRESOLUTIONSETTLEMENT | AdminResolutionSettlement | settlement | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_ADMINRESOLUTIONSUBTYPEPROFILE | AdminResolutionSubtypeProfile | descriptor | self_care_admin_resolution | cross_cutting_self_care_admin_resolution | Self-care and admin-resolution domain | self-care-content-and-admin-resolution-blueprint.md |
| OBJ_ADVICEADMINDEPENDENCYSET | AdviceAdminDependencySet | other | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_ADVICEADMINRELEASEWATCH | AdviceAdminReleaseWatch | other | self_care_admin_resolution | cross_cutting_self_care_admin_resolution | Self-care and admin-resolution domain | self-care-content-and-admin-resolution-blueprint.md |
| OBJ_ADVICEBUNDLEVERSION | AdviceBundleVersion | other | self_care_admin_resolution | cross_cutting_self_care_admin_resolution | Self-care and admin-resolution domain | self-care-content-and-admin-resolution-blueprint.md |
| OBJ_ADVICEELIGIBILITYGRANT | AdviceEligibilityGrant | grant | self_care_admin_resolution | cross_cutting_self_care_admin_resolution | Self-care and admin-resolution domain | self-care-content-and-admin-resolution-blueprint.md |
| OBJ_ADVICEFOLLOWUPWATCHWINDOW | AdviceFollowUpWatchWindow | other | self_care_admin_resolution | cross_cutting_self_care_admin_resolution | Self-care and admin-resolution domain | self-care-content-and-admin-resolution-blueprint.md |
| OBJ_ADVICERENDERSETTLEMENT | AdviceRenderSettlement | settlement | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_ADVICESETTLEMENTDIGEST | AdviceSettlementDigest | digest | staff_support_operations | cross_cutting_staff_workspace | Staff, support, and operations control | staff-workspace-interface-architecture.md |
| OBJ_ADVICEVARIANTSET | AdviceVariantSet | other | self_care_admin_resolution | cross_cutting_self_care_admin_resolution | Self-care and admin-resolution domain | self-care-content-and-admin-resolution-blueprint.md |
| OBJ_ALTERNATIVEOFFERENTRY | AlternativeOfferEntry | other | hub_coordination | phase_5_network_horizon | Hub coordination domain | phase-5-the-network-horizon.md |
| OBJ_ALTERNATIVEOFFERFALLBACKCARD | AlternativeOfferFallbackCard | other | hub_coordination | phase_5_network_horizon | Hub coordination domain | phase-5-the-network-horizon.md |
| OBJ_ALTERNATIVEOFFEROPTIMISATIONPLAN | AlternativeOfferOptimisationPlan | other | hub_coordination | phase_5_network_horizon | Hub coordination domain | phase-5-the-network-horizon.md |
| OBJ_ALTERNATIVEOFFERREGENERATIONSETTLEMENT | AlternativeOfferRegenerationSettlement | settlement | hub_coordination | phase_5_network_horizon | Hub coordination domain | phase-5-the-network-horizon.md |
| OBJ_ALTERNATIVEOFFERSESSION | AlternativeOfferSession | other | hub_coordination | phase_5_network_horizon | Hub coordination domain | phase-5-the-network-horizon.md |
| OBJ_AMBIENTSTATERIBBON | AmbientStateRibbon | other | foundation_runtime_experience | phase_0_foundation | Frontend continuity runtime | phase-0-the-foundation-protocol.md |
| OBJ_APPOINTMENTMANAGECOMMAND | AppointmentManageCommand | other | booking | phase_4_booking_engine | Booking domain | phase-4-the-booking-engine.md |
| OBJ_APPOINTMENTPRESENTATIONARTIFACT | AppointmentPresentationArtifact | artifact | booking | phase_4_booking_engine | Booking domain | phase-4-the-booking-engine.md |
| OBJ_APPOINTMENTRECORD | AppointmentRecord | record | booking | phase_4_booking_engine | Booking domain | phase-4-the-booking-engine.md |
| OBJ_APPPAGEINTENT | AppPageIntent | other | unknown | phase_7_embedded_channel_deferred | Programme architecture registry | phase-7-inside-the-nhs-app.md |
| OBJ_APPROVALCHECKPOINT | ApprovalCheckpoint | checkpoint | triage_human_checkpoint | phase_3_human_checkpoint | Triage domain | phase-3-the-human-checkpoint.md |
| OBJ_APPROVALEVIDENCEBUNDLE | ApprovalEvidenceBundle | bundle | triage_human_checkpoint | phase_3_human_checkpoint | Triage domain | phase-3-the-human-checkpoint.md |
| OBJ_APPROVALREVIEWFRAME | ApprovalReviewFrame | other | staff_support_operations | cross_cutting_staff_workspace | Staff, support, and operations control | staff-workspace-interface-architecture.md |
| OBJ_ARCHIVEMANIFEST | ArchiveManifest | manifest | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_ARTIFACTBYTEGRANT | ArtifactByteGrant | grant | unknown | phase_7_embedded_channel_deferred | Programme architecture registry | phase-7-inside-the-nhs-app.md |
| OBJ_ARTIFACTDEPENDENCYLINK | ArtifactDependencyLink | other | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_ARTIFACTEXPERIENCECOORDINATOR | ArtifactExperienceCoordinator | other | foundation_runtime_experience | phase_0_foundation | Frontend continuity runtime | phase-0-the-foundation-protocol.md |
| OBJ_ARTIFACTFALLBACKDISPOSITION | ArtifactFallbackDisposition | record | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_ARTIFACTMODEPRESENTATIONPROFILE | ArtifactModePresentationProfile | descriptor | frontend_runtime | cross_cutting_ui_contract | Frontend continuity runtime | canonical-ui-contract-kernel.md |
| OBJ_ARTIFACTMODETRUTHPROJECTION | ArtifactModeTruthProjection | projection | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_ARTIFACTPARITYDIGEST | ArtifactParityDigest | digest | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_ARTIFACTPRESENTATIONCONTRACT | ArtifactPresentationContract | contract | frontend_runtime | phase_0_foundation | Frontend continuity runtime | phase-0-the-foundation-protocol.md |
| OBJ_ARTIFACTSURFACEBINDING | ArtifactSurfaceBinding | descriptor | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_ARTIFACTSURFACECONTEXT | ArtifactSurfaceContext | other | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_ARTIFACTSURFACEFRAME | ArtifactSurfaceFrame | other | foundation_runtime_experience | phase_0_foundation | Frontend continuity runtime | phase-0-the-foundation-protocol.md |
| OBJ_ARTIFACTTRANSFERSETTLEMENT | ArtifactTransferSettlement | settlement | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_ASSISTEDBOOKINGSESSION | AssistedBookingSession | other | booking | phase_4_booking_engine | Booking domain | phase-4-the-booking-engine.md |
| OBJ_ASSISTIVEANNOUNCEMENTCONTRACT | AssistiveAnnouncementContract | contract | audited_flow_gap | cross_cutting_accessibility_content | Cross-phase gap register | accessibility-and-content-system-contract.md |
| OBJ_ASSISTIVEANNOUNCEMENTINTENT | AssistiveAnnouncementIntent | other | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_ASSISTIVEANNOUNCEMENTTRUTHPROJECTION | AssistiveAnnouncementTruthProjection | projection | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_ASSISTIVEARTIFACTACTIONRECORD | AssistiveArtifactActionRecord | record | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_ASSISTIVECAPABILITYMANIFEST | AssistiveCapabilityManifest | manifest | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_ASSISTIVECAPABILITYROLLOUTVERDICT | AssistiveCapabilityRolloutVerdict | witness | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_ASSISTIVECAPABILITYTRUSTENVELOPE | AssistiveCapabilityTrustEnvelope | record | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_ASSISTIVECAPABILITYTRUSTPROJECTION | AssistiveCapabilityTrustProjection | projection | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_ASSISTIVECAPABILITYWATCHTUPLE | AssistiveCapabilityWatchTuple | tuple | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_ASSISTIVECOMPANIONPRESENTATIONPROFILE | AssistiveCompanionPresentationProfile | descriptor | staff_support_operations | cross_cutting_staff_workspace | Staff, support, and operations control | staff-workspace-interface-architecture.md |
| OBJ_ASSISTIVECOMPOSITIONPOLICY | AssistiveCompositionPolicy | policy | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_ASSISTIVECONFIDENCEDIGEST | AssistiveConfidenceDigest | digest | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_ASSISTIVECONTINUITYEVIDENCEPROJECTION | AssistiveContinuityEvidenceProjection | projection | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_ASSISTIVEDRAFTINSERTIONPOINT | AssistiveDraftInsertionPoint | other | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_ASSISTIVEDRAFTPATCHLEASE | AssistiveDraftPatchLease | lease | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_ASSISTIVEEVALUATIONSURFACEBINDING | AssistiveEvaluationSurfaceBinding | descriptor | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_ASSISTIVEFEEDBACKCHAIN | AssistiveFeedbackChain | other | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_ASSISTIVEFREEZEDISPOSITION | AssistiveFreezeDisposition | record | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_ASSISTIVEFREEZEFRAME | AssistiveFreezeFrame | other | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_ASSISTIVEINCIDENTLINK | AssistiveIncidentLink | other | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_ASSISTIVEINVOCATIONGRANT | AssistiveInvocationGrant | grant | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_ASSISTIVEKILLSWITCH | AssistiveKillSwitch | other | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_ASSISTIVEKILLSWITCHSTATE | AssistiveKillSwitchState | descriptor | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_ASSISTIVEOPSACTIONLEASE | AssistiveOpsActionLease | lease | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_ASSISTIVEOPSSURFACEBINDING | AssistiveOpsSurfaceBinding | descriptor | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_ASSISTIVEPRESENTATIONCONTRACT | AssistivePresentationContract | contract | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_ASSISTIVEPROVENANCEENVELOPE | AssistiveProvenanceEnvelope | record | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_ASSISTIVERELEASEACTIONRECORD | AssistiveReleaseActionRecord | record | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_ASSISTIVERELEASEACTIONSETTLEMENT | AssistiveReleaseActionSettlement | settlement | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_ASSISTIVERELEASECANDIDATE | AssistiveReleaseCandidate | other | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_ASSISTIVERELEASEFREEZERECORD | AssistiveReleaseFreezeRecord | record | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_ASSISTIVERELEASESTATE | AssistiveReleaseState | descriptor | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_ASSISTIVEROLLOUTLADDERPOLICY | AssistiveRolloutLadderPolicy | policy | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_ASSISTIVEROLLOUTSLICECONTRACT | AssistiveRolloutSliceContract | contract | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_ASSISTIVERUNSETTLEMENT | AssistiveRunSettlement | settlement | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_ASSISTIVESESSION | AssistiveSession | other | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_ASSISTIVESUMMARYSTUB | AssistiveSummaryStub | other | staff_support_operations | cross_cutting_staff_workspace | Staff, support, and operations control | staff-workspace-interface-architecture.md |
| OBJ_ASSISTIVESURFACEBINDING | AssistiveSurfaceBinding | descriptor | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_ASSISTIVETEXTPOLICY | AssistiveTextPolicy | policy | frontend_runtime | cross_cutting_accessibility_content | Frontend continuity runtime | accessibility-and-content-system-contract.md |
| OBJ_ASSISTIVEVISIBILITYPOLICY | AssistiveVisibilityPolicy | policy | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_ASSISTIVEWORKPROTECTIONLEASE | AssistiveWorkProtectionLease | lease | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_ASSISTIVEWORKSPACESTAGEBINDING | AssistiveWorkspaceStageBinding | descriptor | staff_support_operations | cross_cutting_staff_workspace | Staff, support, and operations control | staff-workspace-interface-architecture.md |
| OBJ_ASSURANCEBASELINESNAPSHOT | AssuranceBaselineSnapshot | record | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_ASSURANCECONTROLRECORD | AssuranceControlRecord | record | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_ASSURANCEEVIDENCEGRAPHEDGE | AssuranceEvidenceGraphEdge | record | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_ASSURANCEEVIDENCEGRAPHSNAPSHOT | AssuranceEvidenceGraphSnapshot | record | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_ASSURANCEFREEZESTATE | AssuranceFreezeState | descriptor | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_ASSURANCEGRAPHCOMPLETENESSVERDICT | AssuranceGraphCompletenessVerdict | witness | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_ASSURANCEINGESTCHECKPOINT | AssuranceIngestCheckpoint | checkpoint | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_ASSURANCELEDGERENTRY | AssuranceLedgerEntry | record | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_ASSURANCEPACK | AssurancePack | bundle | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_ASSURANCEPACKACTIONRECORD | AssurancePackActionRecord | record | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_ASSURANCEPACKSETTLEMENT | AssurancePackSettlement | settlement | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_ASSURANCESLICEPROBE | AssuranceSliceProbe | other | runtime_release | cross_cutting_runtime_release | Runtime publication control plane | platform-runtime-and-release-blueprint.md |
| OBJ_ASSURANCESLICETRUSTRECORD | AssuranceSliceTrustRecord | record | assurance_and_governance | phase_0_foundation | Assurance and governance spine | phase-0-the-foundation-protocol.md |
| OBJ_ASSURANCESUPERVISOR | AssuranceSupervisor | other | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_ASSURANCESURFACERUNTIMEBINDING | AssuranceSurfaceRuntimeBinding | descriptor | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_ATTENTIONBUDGET | AttentionBudget | other | foundation_runtime_experience | phase_0_foundation | Frontend continuity runtime | phase-0-the-foundation-protocol.md |
| OBJ_ATTESTATIONRECORD | AttestationRecord | record | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_AUDIENCESURFACEPUBLICATIONREF | AudienceSurfacePublicationRef | other | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_AUDIENCESURFACEROUTECONTRACT | AudienceSurfaceRouteContract | contract | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_AUDIENCESURFACERUNTIMEBINDING | AudienceSurfaceRuntimeBinding | descriptor | frontend_runtime | phase_0_foundation | Frontend continuity runtime | phase-0-the-foundation-protocol.md |
| OBJ_AUDIENCEVISIBILITYCOVERAGE | AudienceVisibilityCoverage | other | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_AUDIOCAPTURESESSION | AudioCaptureSession | other | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_AUDITEVIDENCEREFERENCE | AuditEvidenceReference | other | unknown | phase_7_embedded_channel_deferred | Programme architecture registry | phase-7-inside-the-nhs-app.md |
| OBJ_AUDITQUERYSESSION | AuditQuerySession | other | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_AUTHBRIDGE | AuthBridge | other | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_AUTHBRIDGETRANSACTION | AuthBridgeTransaction | other | unknown | phase_7_embedded_channel_deferred | Programme architecture registry | phase-7-inside-the-nhs-app.md |
| OBJ_AUTHSCOPEBUNDLE | AuthScopeBundle | bundle | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_AUTHTRANSACTION | AuthTransaction | other | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_AUTOMATIONANCHORMAP | AutomationAnchorMap | other | frontend_runtime | cross_cutting_ui_contract | Frontend continuity runtime | canonical-ui-contract-kernel.md |
| OBJ_AUTOMATIONANCHORPROFILE | AutomationAnchorProfile | descriptor | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_BACKUPSETMANIFEST | BackupSetManifest | manifest | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_BAUREADINESSPACK | BAUReadinessPack | bundle | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_BIASSLICEMETRIC | BiasSliceMetric | other | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_BINARYARTIFACTDELIVERY | BinaryArtifactDelivery | artifact | unknown | phase_7_embedded_channel_deferred | Programme architecture registry | phase-7-inside-the-nhs-app.md |
| OBJ_BOOKINGCAPABILITYPROJECTION | BookingCapabilityProjection | projection | booking | phase_4_booking_engine | Booking domain | phase-4-the-booking-engine.md |
| OBJ_BOOKINGCAPABILITYRESOLUTION | BookingCapabilityResolution | other | booking | phase_4_booking_engine | Booking domain | phase-4-the-booking-engine.md |
| OBJ_BOOKINGCASE | BookingCase | case | booking | phase_4_booking_engine | Booking domain | phase-4-the-booking-engine.md |
| OBJ_BOOKINGCONFIRMATIONTRUTHPROJECTION | BookingConfirmationTruthProjection | projection | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_BOOKINGCONTINUITYEVIDENCEPROJECTION | BookingContinuityEvidenceProjection | projection | booking | phase_4_booking_engine | Booking domain | phase-4-the-booking-engine.md |
| OBJ_BOOKINGEXCEPTION | BookingException | other | booking | phase_4_booking_engine | Booking domain | phase-4-the-booking-engine.md |
| OBJ_BOOKINGEXCEPTIONQUEUE | BookingExceptionQueue | other | booking | phase_4_booking_engine | Booking domain | phase-4-the-booking-engine.md |
| OBJ_BOOKINGINTENT | BookingIntent | descriptor | triage_human_checkpoint | phase_3_human_checkpoint | Triage domain | phase-3-the-human-checkpoint.md |
| OBJ_BOOKINGMANAGESETTLEMENT | BookingManageSettlement | settlement | booking | phase_4_booking_engine | Booking domain | phase-4-the-booking-engine.md |
| OBJ_BOOKINGPROVIDERADAPTERBINDING | BookingProviderAdapterBinding | descriptor | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_BOOKINGTRANSACTION | BookingTransaction | other | booking | phase_4_booking_engine | Booking domain | phase-4-the-booking-engine.md |
| OBJ_BOUNDEDCONTEXTIMPACTDIGEST | BoundedContextImpactDigest | digest | platform_configuration | cross_cutting_platform_admin | Platform administration and configuration | platform-admin-and-config-blueprint.md |
| OBJ_BREACHRISKRECORD | BreachRiskRecord | record | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_BREAKGLASSREVIEWRECORD | BreakGlassReviewRecord | record | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_BREAKPOINTINTERPOLATIONRULE | BreakpointInterpolationRule | other | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_BRIDGEACTIONLEASE | BridgeActionLease | lease | unknown | phase_7_embedded_channel_deferred | Programme architecture registry | phase-7-inside-the-nhs-app.md |
| OBJ_BRIDGECAPABILITYMATRIX | BridgeCapabilityMatrix | other | unknown | phase_7_embedded_channel_deferred | Programme architecture registry | phase-7-inside-the-nhs-app.md |
| OBJ_BUILDPROVENANCERECORD | BuildProvenanceRecord | record | runtime_release | cross_cutting_runtime_release | Runtime publication control plane | platform-runtime-and-release-blueprint.md |
| OBJ_CALLBACKATTEMPTRECORD | CallbackAttemptRecord | record | callback_messaging | cross_cutting_callback_and_messaging | Callback and messaging domain | callback-and-clinician-messaging-loop.md |
| OBJ_CALLBACKCASE | CallbackCase | case | callback_messaging | cross_cutting_callback_and_messaging | Callback and messaging domain | callback-and-clinician-messaging-loop.md |
| OBJ_CALLBACKEXPECTATIONENVELOPE | CallbackExpectationEnvelope | record | callback_messaging | cross_cutting_callback_and_messaging | Callback and messaging domain | callback-and-clinician-messaging-loop.md |
| OBJ_CALLBACKFALLBACKRECORD | CallbackFallbackRecord | record | hub_coordination | phase_5_network_horizon | Hub coordination domain | phase-5-the-network-horizon.md |
| OBJ_CALLBACKINTENTLEASE | CallbackIntentLease | lease | callback_messaging | cross_cutting_callback_and_messaging | Callback and messaging domain | callback-and-clinician-messaging-loop.md |
| OBJ_CALLBACKOUTCOMEEVIDENCEBUNDLE | CallbackOutcomeEvidenceBundle | bundle | callback_messaging | cross_cutting_callback_and_messaging | Callback and messaging domain | callback-and-clinician-messaging-loop.md |
| OBJ_CALLBACKRESOLUTIONGATE | CallbackResolutionGate | gate | callback_messaging | cross_cutting_callback_and_messaging | Callback and messaging domain | callback-and-clinician-messaging-loop.md |
| OBJ_CALLSESSION | CallSession | other | unknown | phase_2_identity_and_echoes | Programme architecture registry | phase-2-identity-and-echoes.md |
| OBJ_CALMDEGRADEDSTATECONTRACT | CalmDegradedStateContract | contract | frontend_runtime | cross_cutting_ux_redesign | Frontend continuity runtime | ux-quiet-clarity-redesign.md |
| OBJ_CANCELLATIONMAKEUPLEDGER | CancellationMakeUpLedger | other | hub_coordination | phase_5_network_horizon | Hub coordination domain | phase-5-the-network-horizon.md |
| OBJ_CANONICALEVENTCONTRACT | CanonicalEventContract | event_contract | runtime_release | cross_cutting_runtime_release | Runtime publication control plane | platform-runtime-and-release-blueprint.md |
| OBJ_CANONICALEVENTNAMESPACE | CanonicalEventNamespace | namespace | runtime_release | cross_cutting_runtime_release | Runtime publication control plane | platform-runtime-and-release-blueprint.md |
| OBJ_CANONICALSLOTIDENTITY | CanonicalSlotIdentity | other | booking | phase_4_booking_engine | Booking domain | phase-4-the-booking-engine.md |
| OBJ_CAPAACTION | CAPAAction | other | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_CAPABILITYDECISION | CapabilityDecision | descriptor | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_CAPACITYIDENTITY | CapacityIdentity | other | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_CAPACITYRESERVATION | CapacityReservation | other | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_CASEPULSE | CasePulse | other | foundation_runtime_experience | phase_0_foundation | Frontend continuity runtime | phase-0-the-foundation-protocol.md |
| OBJ_CASEREPLAYBUNDLE | CaseReplayBundle | bundle | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_CHANGEIMPACTASSESSMENT | ChangeImpactAssessment | record | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_CHANNELCONTEXT | ChannelContext | other | unknown | phase_7_embedded_channel_deferred | Programme architecture registry | phase-7-inside-the-nhs-app.md |
| OBJ_CHANNELCONTEXTEVIDENCE | ChannelContextEvidence | other | unknown | phase_7_embedded_channel_deferred | Programme architecture registry | phase-7-inside-the-nhs-app.md |
| OBJ_CHANNELDEGRADEDMODE | ChannelDegradedMode | other | unknown | phase_7_embedded_channel_deferred | Programme architecture registry | phase-7-inside-the-nhs-app.md |
| OBJ_CHANNELRELEASECOHORT | ChannelReleaseCohort | other | unknown | phase_7_embedded_channel_deferred | Programme architecture registry | phase-7-inside-the-nhs-app.md |
| OBJ_CHANNELRELEASEFREEZERECORD | ChannelReleaseFreezeRecord | record | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_CHANNELTELEMETRYPLAN | ChannelTelemetryPlan | other | unknown | phase_7_embedded_channel_deferred | Programme architecture registry | phase-7-inside-the-nhs-app.md |
| OBJ_CHAOSEXPERIMENT | ChaosExperiment | other | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_CHAOSRUN | ChaosRun | other | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_CLINICALCONCEPTSPAN | ClinicalConceptSpan | other | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_CLINICIANMESSAGETHREAD | ClinicianMessageThread | thread | callback_messaging | cross_cutting_callback_and_messaging | Callback and messaging domain | callback-and-clinician-messaging-loop.md |
| OBJ_CLOSE | CLOSE | other | unknown | audited_flow_baseline | Programme architecture registry | vecells-complete-end-to-end-flow.md |
| OBJ_COGNITIVELOADGOVERNOR | CognitiveLoadGovernor | other | foundation_runtime_experience | phase_0_foundation | Frontend continuity runtime | phase-0-the-foundation-protocol.md |
| OBJ_COHORTACTIONBRIDGE | CohortActionBridge | other | staff_support_operations | cross_cutting_operations_console | Staff, support, and operations control | operations-console-frontend-blueprint.md |
| OBJ_COHORTDRIVERPATH | CohortDriverPath | other | staff_support_operations | cross_cutting_operations_console | Staff, support, and operations control | operations-console-frontend-blueprint.md |
| OBJ_COHORTIMPACTCELLPROJECTION | CohortImpactCellProjection | projection | staff_support_operations | cross_cutting_operations_console | Staff, support, and operations control | operations-console-frontend-blueprint.md |
| OBJ_COHORTVISIBILITYGUARD | CohortVisibilityGuard | other | staff_support_operations | cross_cutting_operations_console | Staff, support, and operations control | operations-console-frontend-blueprint.md |
| OBJ_COMMANDACTIONRECORD | CommandActionRecord | record | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_COMMANDSETTLEMENTRECORD | CommandSettlementRecord | record | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_COMMUNICATIONENVELOPE | CommunicationEnvelope | record | foundation_runtime_experience | phase_0_foundation | Frontend continuity runtime | phase-0-the-foundation-protocol.md |
| OBJ_COMMUNICATIONSFREEZEDISPOSITION | CommunicationsFreezeDisposition | record | platform_configuration | cross_cutting_platform_admin | Platform administration and configuration | platform-admin-and-config-blueprint.md |
| OBJ_COMMUNICATIONSGOVERNANCEWORKSPACE | CommunicationsGovernanceWorkspace | other | platform_configuration | cross_cutting_platform_admin | Platform administration and configuration | platform-admin-and-config-blueprint.md |
| OBJ_COMMUNICATIONSSIMULATIONENVELOPE | CommunicationsSimulationEnvelope | record | platform_configuration | cross_cutting_platform_admin | Platform administration and configuration | platform-admin-and-config-blueprint.md |
| OBJ_COMPAREFALLBACKCONTRACT | CompareFallbackContract | contract | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_COMPILEDPOLICYBUNDLE | CompiledPolicyBundle | bundle | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_CONFIGBLASTRADIUSDIGEST | ConfigBlastRadiusDigest | digest | platform_configuration | cross_cutting_platform_admin | Platform administration and configuration | platform-admin-and-config-blueprint.md |
| OBJ_CONFIGCOMPILATIONRECORD | ConfigCompilationRecord | record | platform_configuration | cross_cutting_platform_admin | Platform administration and configuration | platform-admin-and-config-blueprint.md |
| OBJ_CONFIGDRIFTFENCE | ConfigDriftFence | gate | platform_configuration | cross_cutting_platform_admin | Platform administration and configuration | platform-admin-and-config-blueprint.md |
| OBJ_CONFIGSIMULATIONENVELOPE | ConfigSimulationEnvelope | record | platform_configuration | cross_cutting_platform_admin | Platform administration and configuration | platform-admin-and-config-blueprint.md |
| OBJ_CONFIGVERSION | ConfigVersion | other | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_CONFIGWORKSPACECONTEXT | ConfigWorkspaceContext | other | platform_configuration | cross_cutting_platform_admin | Platform administration and configuration | platform-admin-and-config-blueprint.md |
| OBJ_CONFORMALPREDICTIONSET | ConformalPredictionSet | other | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_CONSENT | Consent | other | unknown | audited_flow_baseline | Programme architecture registry | vecells-complete-end-to-end-flow.md |
| OBJ_CONSEQUENCEPREVIEW | ConsequencePreview | other | foundation_runtime_experience | phase_0_foundation | Frontend continuity runtime | phase-0-the-foundation-protocol.md |
| OBJ_CONTACTROUTEREPAIRJOURNEY | ContactRouteRepairJourney | other | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_CONTACTROUTESNAPSHOT | ContactRouteSnapshot | record | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_CONTACTROUTEVERIFICATIONCHECKPOINT | ContactRouteVerificationCheckpoint | checkpoint | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_CONTAINMENTACTION | ContainmentAction | other | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_CONTINUITYCARRYFORWARDPLAN | ContinuityCarryForwardPlan | other | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_CONTINUITYCONTRACTCOVERAGERECORD | ContinuityContractCoverageRecord | record | runtime_release | cross_cutting_runtime_release | Runtime publication control plane | platform-runtime-and-release-blueprint.md |
| OBJ_CONTINUITYCONTROLHEALTHPROJECTION | ContinuityControlHealthProjection | projection | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_CONTINUITYCONTROLIMPACTDIGEST | ContinuityControlImpactDigest | digest | platform_configuration | cross_cutting_platform_admin | Platform administration and configuration | platform-admin-and-config-blueprint.md |
| OBJ_CONTINUITYEVIDENCEDRILLPATH | ContinuityEvidenceDrillPath | other | staff_support_operations | cross_cutting_operations_console | Staff, support, and operations control | operations-console-frontend-blueprint.md |
| OBJ_CONTINUITYEVIDENCEPACKSECTION | ContinuityEvidencePackSection | other | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_CONTINUITYFRAME | ContinuityFrame | other | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_CONTINUITYORCHESTRATOR | ContinuityOrchestrator | other | foundation_runtime_experience | phase_0_foundation | Frontend continuity runtime | phase-0-the-foundation-protocol.md |
| OBJ_CONTINUITYRESTOREPLAN | ContinuityRestorePlan | other | frontend_runtime | cross_cutting_ux_redesign | Frontend continuity runtime | ux-quiet-clarity-redesign.md |
| OBJ_CONTINUITYTRANSITIONCHECKPOINT | ContinuityTransitionCheckpoint | checkpoint | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_CONTRADICTIONCHECKRESULT | ContradictionCheckResult | other | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_CONTROLEVIDENCELINK | ControlEvidenceLink | other | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_CONTROLOBJECTIVE | ControlObjective | other | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_CONTROLSTATUSSNAPSHOT | ControlStatusSnapshot | record | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_CONVERSATIONCOMMANDSETTLEMENT | ConversationCommandSettlement | settlement | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_CONVERSATIONSUBTHREADPROJECTION | ConversationSubthreadProjection | projection | foundation_runtime_experience | phase_0_foundation | Frontend continuity runtime | phase-0-the-foundation-protocol.md |
| OBJ_CONVERSATIONTHREADPROJECTION | ConversationThreadProjection | projection | foundation_runtime_experience | phase_0_foundation | Frontend continuity runtime | phase-0-the-foundation-protocol.md |
| OBJ_COORDINATIONOWNERSHIP | CoordinationOwnership | other | hub_coordination | phase_5_network_horizon | Hub coordination domain | phase-5-the-network-horizon.md |
| OBJ_CROSSORGANISATIONVISIBILITYENVELOPE | CrossOrganisationVisibilityEnvelope | record | hub_coordination | phase_5_network_horizon | Hub coordination domain | phase-5-the-network-horizon.md |
| OBJ_CROSSPHASECONFORMANCESCORECARD | CrossPhaseConformanceScorecard | other | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_CROSSSITEDECISIONPLAN | CrossSiteDecisionPlan | other | hub_coordination | phase_5_network_horizon | Hub coordination domain | phase-5-the-network-horizon.md |
| OBJ_DATASUBJECTTRACE | DataSubjectTrace | other | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_DECISIONCOMMITENVELOPE | DecisionCommitEnvelope | record | staff_support_operations | cross_cutting_staff_workspace | Staff, support, and operations control | staff-workspace-interface-architecture.md |
| OBJ_DECISIONDOCK | DecisionDock | other | foundation_runtime_experience | phase_0_foundation | Frontend continuity runtime | phase-0-the-foundation-protocol.md |
| OBJ_DECISIONDOCKFOCUSLEASE | DecisionDockFocusLease | lease | frontend_runtime | cross_cutting_ux_redesign | Frontend continuity runtime | ux-quiet-clarity-redesign.md |
| OBJ_DECISIONEPOCH | DecisionEpoch | checkpoint | triage_human_checkpoint | phase_3_human_checkpoint | Triage domain | phase-3-the-human-checkpoint.md |
| OBJ_DECISIONSUPERSESSIONRECORD | DecisionSupersessionRecord | record | triage_human_checkpoint | phase_3_human_checkpoint | Triage domain | phase-3-the-human-checkpoint.md |
| OBJ_DEEPLINKINTENTENVELOPE | DeepLinkIntentEnvelope | record | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_DEEPLINKRESOLUTIONCHECKPOINT | DeepLinkResolutionCheckpoint | checkpoint | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_DELETIONCERTIFICATE | DeletionCertificate | witness | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_DEPENDENCYDEGRADATIONPROFILE | DependencyDegradationProfile | descriptor | booking | phase_4_booking_engine | Booking domain | phase-4-the-booking-engine.md |
| OBJ_DEPENDENCYHEALTHRECORD | DependencyHealthRecord | record | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_DEPENDENCYLIFECYCLERECORD | DependencyLifecycleRecord | record | platform_configuration | cross_cutting_platform_admin | Platform administration and configuration | platform-admin-and-config-blueprint.md |
| OBJ_DEPENDENCYREGISTRYENTRY | DependencyRegistryEntry | other | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_DESIGNCONTRACTLINTVERDICT | DesignContractLintVerdict | witness | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_DESIGNCONTRACTPUBLICATIONBUNDLE | DesignContractPublicationBundle | bundle | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_DESIGNCONTRACTVOCABULARYTUPLE | DesignContractVocabularyTuple | tuple | frontend_runtime | cross_cutting_ui_contract | Frontend continuity runtime | canonical-ui-contract-kernel.md |
| OBJ_DESIGNTOKENEXPORTARTIFACT | DesignTokenExportArtifact | artifact | frontend_runtime | cross_cutting_design_tokens | Frontend continuity runtime | design-token-foundation.md |
| OBJ_DESIGNTOKENFOUNDATION | DesignTokenFoundation | other | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_DISPATCHADAPTERBINDING | DispatchAdapterBinding | descriptor | pharmacy | phase_6_pharmacy_loop | Pharmacy loop domain | phase-6-the-pharmacy-loop.md |
| OBJ_DISPATCHPROOFENVELOPE | DispatchProofEnvelope | record | pharmacy | phase_6_pharmacy_loop | Pharmacy loop domain | phase-6-the-pharmacy-loop.md |
| OBJ_DISPOSITIONBLOCKEXPLAINER | DispositionBlockExplainer | other | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_DISPOSITIONELIGIBILITYASSESSMENT | DispositionEligibilityAssessment | record | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_DISPOSITIONJOB | DispositionJob | other | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_DOCUMENTATIONCONTEXTSNAPSHOT | DocumentationContextSnapshot | record | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_DOMINANTACTIONHIERARCHY | DominantActionHierarchy | other | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_DRAFTCONTINUITYEVIDENCEPROJECTION | DraftContinuityEvidenceProjection | projection | unknown | phase_1_red_flag_gate | Programme architecture registry | phase-1-the-red-flag-gate.md |
| OBJ_DRAFTMERGEPLAN | DraftMergePlan | other | unknown | phase_1_red_flag_gate | Programme architecture registry | phase-1-the-red-flag-gate.md |
| OBJ_DRAFTMUTATIONRECORD | DraftMutationRecord | record | unknown | phase_1_red_flag_gate | Programme architecture registry | phase-1-the-red-flag-gate.md |
| OBJ_DRAFTNOTEARTIFACT | DraftNoteArtifact | artifact | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_DRAFTRECOVERYRECORD | DraftRecoveryRecord | record | unknown | phase_1_red_flag_gate | Programme architecture registry | phase-1-the-red-flag-gate.md |
| OBJ_DRAFTSAVESETTLEMENT | DraftSaveSettlement | settlement | unknown | phase_1_red_flag_gate | Programme architecture registry | phase-1-the-red-flag-gate.md |
| OBJ_DRAFTSECTION | DraftSection | other | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_DRAFTSESSIONLEASE | DraftSessionLease | lease | unknown | phase_1_red_flag_gate | Programme architecture registry | phase-1-the-red-flag-gate.md |
| OBJ_DRIFTSIGNAL | DriftSignal | event_contract | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_DUPLICATECLUSTER | DuplicateCluster | aggregate | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_DUPLICATEPAIREVIDENCE | DuplicatePairEvidence | other | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_DUPLICATERESOLUTIONDECISION | DuplicateResolutionDecision | record | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_DUPLICATEREVIEWSNAPSHOT | DuplicateReviewSnapshot | record | triage_human_checkpoint | phase_3_human_checkpoint | Triage domain | phase-3-the-human-checkpoint.md |
| OBJ_EFFECTIVECONFIGRESOLUTION | EffectiveConfigResolution | other | platform_configuration | cross_cutting_platform_admin | Platform administration and configuration | platform-admin-and-config-blueprint.md |
| OBJ_ELIGIBILITYEXPLANATIONBUNDLE | EligibilityExplanationBundle | bundle | pharmacy | phase_6_pharmacy_loop | Pharmacy loop domain | phase-6-the-pharmacy-loop.md |
| OBJ_EMBEDDEDENTRYTOKEN | EmbeddedEntryToken | token | unknown | phase_7_embedded_channel_deferred | Programme architecture registry | phase-7-inside-the-nhs-app.md |
| OBJ_EMBEDDEDERRORCONTRACT | EmbeddedErrorContract | contract | unknown | phase_7_embedded_channel_deferred | Programme architecture registry | phase-7-inside-the-nhs-app.md |
| OBJ_EMBEDDEDSHELL | EmbeddedShell | other | unknown | phase_7_embedded_channel_deferred | Programme architecture registry | phase-7-inside-the-nhs-app.md |
| OBJ_EMBEDDEDSHELLCONSISTENCYPROJECTION | EmbeddedShellConsistencyProjection | projection | unknown | phase_7_embedded_channel_deferred | Programme architecture registry | phase-7-inside-the-nhs-app.md |
| OBJ_EMBEDDEDSTRIPCONTRACT | EmbeddedStripContract | contract | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_EMBEDDEDSURFACECONTRACTCOVERAGERECORD | EmbeddedSurfaceContractCoverageRecord | record | runtime_release | cross_cutting_runtime_release | Runtime publication control plane | platform-runtime-and-release-blueprint.md |
| OBJ_EMERGENCYRELEASEEXCEPTION | EmergencyReleaseException | other | runtime_release | cross_cutting_runtime_release | Runtime publication control plane | platform-runtime-and-release-blueprint.md |
| OBJ_EMPTYSTATECONTRACT | EmptyStateContract | contract | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_ENDPOINTDECISION | EndpointDecision | record | triage_human_checkpoint | phase_3_human_checkpoint | Triage domain | phase-3-the-human-checkpoint.md |
| OBJ_ENDPOINTDECISIONACTIONRECORD | EndpointDecisionActionRecord | record | triage_human_checkpoint | phase_3_human_checkpoint | Triage domain | phase-3-the-human-checkpoint.md |
| OBJ_ENDPOINTDECISIONBINDING | EndpointDecisionBinding | descriptor | triage_human_checkpoint | phase_3_human_checkpoint | Triage domain | phase-3-the-human-checkpoint.md |
| OBJ_ENDPOINTDECISIONSETTLEMENT | EndpointDecisionSettlement | settlement | triage_human_checkpoint | phase_3_human_checkpoint | Triage domain | phase-3-the-human-checkpoint.md |
| OBJ_ENDPOINTHYPOTHESIS | EndpointHypothesis | other | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_ENDPOINTOUTCOMEPREVIEWARTIFACT | EndpointOutcomePreviewArtifact | artifact | triage_human_checkpoint | phase_3_human_checkpoint | Triage domain | phase-3-the-human-checkpoint.md |
| OBJ_ENHANCEDACCESSMINUTESLEDGER | EnhancedAccessMinutesLedger | other | hub_coordination | phase_5_network_horizon | Hub coordination domain | phase-5-the-network-horizon.md |
| OBJ_ENHANCEDACCESSPOLICY | EnhancedAccessPolicy | policy | hub_coordination | phase_5_network_horizon | Hub coordination domain | phase-5-the-network-horizon.md |
| OBJ_ENVIRONMENTBASELINEFINGERPRINT | EnvironmentBaselineFingerprint | other | runtime_release | cross_cutting_runtime_release | Runtime publication control plane | platform-runtime-and-release-blueprint.md |
| OBJ_EPISODE | Episode | aggregate | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_EQUITYSLICEMETRIC | EquitySliceMetric | other | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_ERRORTAXONOMYRECORD | ErrorTaxonomyRecord | record | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_ESSENTIALFUNCTIONHEALTHENVELOPE | EssentialFunctionHealthEnvelope | record | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_ESSENTIALFUNCTIONMAP | EssentialFunctionMap | other | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_ESSENTIALSHELLFRAME | EssentialShellFrame | other | frontend_runtime | cross_cutting_ux_redesign | Frontend continuity runtime | ux-quiet-clarity-redesign.md |
| OBJ_EVALUATIONEXPORTARTIFACT | EvaluationExportArtifact | artifact | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_EVIDENCEARTIFACT | EvidenceArtifact | artifact | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_EVIDENCEASSIMILATIONCOORDINATOR | EvidenceAssimilationCoordinator | other | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_EVIDENCEASSIMILATIONRECORD | EvidenceAssimilationRecord | record | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_EVIDENCECLASSIFICATIONDECISION | EvidenceClassificationDecision | record | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_EVIDENCEDELTAPACKET | EvidenceDeltaPacket | other | staff_support_operations | cross_cutting_staff_workspace | Staff, support, and operations control | staff-workspace-interface-architecture.md |
| OBJ_EVIDENCEGAPRECORD | EvidenceGapRecord | record | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_EVIDENCELINEAGERESOLVER | EvidenceLineageResolver | other | foundation_runtime_experience | phase_0_foundation | Frontend continuity runtime | phase-0-the-foundation-protocol.md |
| OBJ_EVIDENCEMAP | EvidenceMap | other | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_EVIDENCEMAPSET | EvidenceMapSet | other | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_EVIDENCEPRISM | EvidencePrism | other | foundation_runtime_experience | phase_0_foundation | Frontend continuity runtime | phase-0-the-foundation-protocol.md |
| OBJ_EVIDENCESNAPSHOT | EvidenceSnapshot | record | unknown | audited_flow_baseline | Programme architecture registry | vecells-complete-end-to-end-flow.md |
| OBJ_EXCEPTIONORCHESTRATOR | ExceptionOrchestrator | other | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_EXPERIENCECONTINUITYCONTROLEVIDENCE | ExperienceContinuityControlEvidence | record | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_EXTERNALCONFIRMATIONGATE | ExternalConfirmationGate | gate | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_FAILOVERRUN | FailoverRun | other | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_FAILOVERSCENARIO | FailoverScenario | other | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_FALLBACKREADINESSDIGEST | FallbackReadinessDigest | digest | staff_support_operations | cross_cutting_operations_console | Staff, support, and operations control | operations-console-frontend-blueprint.md |
| OBJ_FALLBACKREVIEWCASE | FallbackReviewCase | case | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_FEATURESNAPSHOT | FeatureSnapshot | record | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_FEEDBACKELIGIBILITYFLAG | FeedbackEligibilityFlag | other | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_FHIRREPRESENTATIONCONTRACT | FhirRepresentationContract | contract | runtime_release | cross_cutting_runtime_release | Runtime publication control plane | platform-runtime-and-release-blueprint.md |
| OBJ_FIELDACCESSIBILITYCONTRACT | FieldAccessibilityContract | contract | frontend_runtime | cross_cutting_accessibility_content | Frontend continuity runtime | accessibility-and-content-system-contract.md |
| OBJ_FINALHUMANARTIFACT | FinalHumanArtifact | artifact | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_FOCUSINTEGRITYGUARD | FocusIntegrityGuard | other | foundation_runtime_experience | phase_0_foundation | Frontend continuity runtime | phase-0-the-foundation-protocol.md |
| OBJ_FOCUSTRANSITIONCONTRACT | FocusTransitionContract | contract | frontend_runtime | cross_cutting_accessibility_content | Frontend continuity runtime | accessibility-and-content-system-contract.md |
| OBJ_FORMERRORSUMMARYCONTRACT | FormErrorSummaryContract | contract | frontend_runtime | cross_cutting_accessibility_content | Frontend continuity runtime | accessibility-and-content-system-contract.md |
| OBJ_FRAMEWORKPACKGENERATOR | FrameworkPackGenerator | other | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_FRESHNESSACCESSIBILITYCONTRACT | FreshnessAccessibilityContract | contract | frontend_runtime | cross_cutting_accessibility_content | Frontend continuity runtime | accessibility-and-content-system-contract.md |
| OBJ_FRESHNESSCHIP | FreshnessChip | other | foundation_runtime_experience | phase_0_foundation | Frontend continuity runtime | phase-0-the-foundation-protocol.md |
| OBJ_FRESHNESSSUPERVISOR | FreshnessSupervisor | other | foundation_runtime_experience | phase_0_foundation | Frontend continuity runtime | phase-0-the-foundation-protocol.md |
| OBJ_FRONTENDCONTRACTMANIFEST | FrontendContractManifest | manifest | runtime_release | cross_cutting_runtime_release | Runtime publication control plane | platform-runtime-and-release-blueprint.md |
| OBJ_GOVERNANCEEVIDENCEARTIFACT | GovernanceEvidenceArtifact | artifact | platform_configuration | cross_cutting_governance_console | Platform administration and configuration | governance-admin-console-frontend-blueprint.md |
| OBJ_GOVERNANCEEVIDENCEPACKARTIFACT | GovernanceEvidencePackArtifact | artifact | platform_configuration | cross_cutting_governance_console | Platform administration and configuration | governance-admin-console-frontend-blueprint.md |
| OBJ_GOVERNANCEEVIDENCEPACKTRANSFER | GovernanceEvidencePackTransfer | other | platform_configuration | cross_cutting_governance_console | Platform administration and configuration | governance-admin-console-frontend-blueprint.md |
| OBJ_GOVERNANCEREVIEWPACKAGE | GovernanceReviewPackage | bundle | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_GOVERNANCESCOPETOKEN | GovernanceScopeToken | token | unknown | audited_flow_baseline | Programme architecture registry | vecells-complete-end-to-end-flow.md |
| OBJ_GOVERNANCESURFACEPOSTURE | GovernanceSurfacePosture | other | platform_configuration | cross_cutting_governance_console | Platform administration and configuration | governance-admin-console-frontend-blueprint.md |
| OBJ_GOVERNEDCONTROLHANDOFFBINDING | GovernedControlHandoffBinding | descriptor | runtime_release | cross_cutting_runtime_release | Runtime publication control plane | platform-runtime-and-release-blueprint.md |
| OBJ_GROUNDTRUTHLABEL | GroundTruthLabel | other | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_HEALTHACTIONPOSTURE | HealthActionPosture | other | staff_support_operations | cross_cutting_operations_console | Staff, support, and operations control | operations-console-frontend-blueprint.md |
| OBJ_HEALTHDRILLPATH | HealthDrillPath | other | staff_support_operations | cross_cutting_operations_console | Staff, support, and operations control | operations-console-frontend-blueprint.md |
| OBJ_HOME | Home | other | unknown | audited_flow_baseline | Programme architecture registry | vecells-complete-end-to-end-flow.md |
| OBJ_HUBACTIONRECORD | HubActionRecord | record | hub_coordination | phase_5_network_horizon | Hub coordination domain | phase-5-the-network-horizon.md |
| OBJ_HUBAPPOINTMENTRECORD | HubAppointmentRecord | record | hub_coordination | phase_5_network_horizon | Hub coordination domain | phase-5-the-network-horizon.md |
| OBJ_HUBBOOKINGEVIDENCEBUNDLE | HubBookingEvidenceBundle | bundle | hub_coordination | phase_5_network_horizon | Hub coordination domain | phase-5-the-network-horizon.md |
| OBJ_HUBCAPACITYINGESTIONPOLICY | HubCapacityIngestionPolicy | policy | hub_coordination | phase_5_network_horizon | Hub coordination domain | phase-5-the-network-horizon.md |
| OBJ_HUBCASECONSOLEPROJECTION | HubCaseConsoleProjection | projection | hub_coordination | phase_5_network_horizon | Hub coordination domain | phase-5-the-network-horizon.md |
| OBJ_HUBCOMMITATTEMPT | HubCommitAttempt | record | hub_coordination | phase_5_network_horizon | Hub coordination domain | phase-5-the-network-horizon.md |
| OBJ_HUBCOMMITSETTLEMENT | HubCommitSettlement | settlement | hub_coordination | phase_5_network_horizon | Hub coordination domain | phase-5-the-network-horizon.md |
| OBJ_HUBCONSOLECONSISTENCYPROJECTION | HubConsoleConsistencyProjection | projection | hub_coordination | phase_5_network_horizon | Hub coordination domain | phase-5-the-network-horizon.md |
| OBJ_HUBCONTINUATIONLEASE | HubContinuationLease | lease | unknown | forensic_patch_guidance | Programme architecture registry | forensic-audit-findings.md |
| OBJ_HUBCONTINUITYEVIDENCEPROJECTION | HubContinuityEvidenceProjection | projection | hub_coordination | phase_5_network_horizon | Hub coordination domain | phase-5-the-network-horizon.md |
| OBJ_HUBCOORDINATIONCASE | HubCoordinationCase | case | hub_coordination | phase_5_network_horizon | Hub coordination domain | phase-5-the-network-horizon.md |
| OBJ_HUBCOORDINATIONEXCEPTION | HubCoordinationException | other | hub_coordination | phase_5_network_horizon | Hub coordination domain | phase-5-the-network-horizon.md |
| OBJ_HUBCOORDINATIONMILESTONE | HubCoordinationMilestone | event_contract | unknown | forensic_patch_guidance | Programme architecture registry | forensic-audit-findings.md |
| OBJ_HUBESCALATIONBANNERPROJECTION | HubEscalationBannerProjection | projection | hub_coordination | phase_5_network_horizon | Hub coordination domain | phase-5-the-network-horizon.md |
| OBJ_HUBFALLBACKRECORD | HubFallbackRecord | record | hub_coordination | phase_5_network_horizon | Hub coordination domain | phase-5-the-network-horizon.md |
| OBJ_HUBMANAGESETTLEMENT | HubManageSettlement | settlement | hub_coordination | phase_5_network_horizon | Hub coordination domain | phase-5-the-network-horizon.md |
| OBJ_HUBOFFERTOCONFIRMATIONTRUTHPROJECTION | HubOfferToConfirmationTruthProjection | projection | hub_coordination | phase_5_network_horizon | Hub coordination domain | phase-5-the-network-horizon.md |
| OBJ_HUBOPTIONCARDPROJECTION | HubOptionCardProjection | projection | hub_coordination | phase_5_network_horizon | Hub coordination domain | phase-5-the-network-horizon.md |
| OBJ_HUBOWNERSHIPTRANSITION | HubOwnershipTransition | other | hub_coordination | phase_5_network_horizon | Hub coordination domain | phase-5-the-network-horizon.md |
| OBJ_HUBPOSTUREPROJECTION | HubPostureProjection | projection | hub_coordination | phase_5_network_horizon | Hub coordination domain | phase-5-the-network-horizon.md |
| OBJ_HUBPRACTICEVISIBILITYPOLICY | HubPracticeVisibilityPolicy | policy | hub_coordination | phase_5_network_horizon | Hub coordination domain | phase-5-the-network-horizon.md |
| OBJ_HUBQUEUEWORKBENCHPROJECTION | HubQueueWorkbenchProjection | projection | hub_coordination | phase_5_network_horizon | Hub coordination domain | phase-5-the-network-horizon.md |
| OBJ_HUBRETURNSIGNAL | HubReturnSignal | event_contract | unknown | forensic_patch_guidance | Programme architecture registry | forensic-audit-findings.md |
| OBJ_HUBRETURNTOPRACTICERECORD | HubReturnToPracticeRecord | record | hub_coordination | phase_5_network_horizon | Hub coordination domain | phase-5-the-network-horizon.md |
| OBJ_HUBROUTINGPOLICYPACK | HubRoutingPolicyPack | policy | hub_coordination | phase_5_network_horizon | Hub coordination domain | phase-5-the-network-horizon.md |
| OBJ_HUBSERVICEOBLIGATIONPOLICY | HubServiceObligationPolicy | policy | hub_coordination | phase_5_network_horizon | Hub coordination domain | phase-5-the-network-horizon.md |
| OBJ_HUBSUPPLIERMIRRORSTATE | HubSupplierMirrorState | descriptor | hub_coordination | phase_5_network_horizon | Hub coordination domain | phase-5-the-network-horizon.md |
| OBJ_HUBVARIANCEWINDOWPOLICY | HubVarianceWindowPolicy | policy | hub_coordination | phase_5_network_horizon | Hub coordination domain | phase-5-the-network-horizon.md |
| OBJ_HUMANAPPROVALGATEASSESSMENT | HumanApprovalGateAssessment | record | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_IDENTITYASSERTIONBINDING | IdentityAssertionBinding | descriptor | unknown | phase_7_embedded_channel_deferred | Programme architecture registry | phase-7-inside-the-nhs-app.md |
| OBJ_IDENTITYBINDING | IdentityBinding | aggregate | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_IDENTITYBINDINGAUTHORITY | IdentityBindingAuthority | other | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_IDENTITYCONTEXT | IdentityContext | other | unknown | phase_2_identity_and_echoes | Programme architecture registry | phase-2-identity-and-echoes.md |
| OBJ_IDENTITYCORRECTIONREQUEST | IdentityCorrectionRequest | other | staff_support_operations | cross_cutting_staff_operations_support | Staff, support, and operations control | staff-operations-and-support-blueprint.md |
| OBJ_IDENTITYEVIDENCEENVELOPE | IdentityEvidenceEnvelope | record | unknown | phase_2_identity_and_echoes | Programme architecture registry | phase-2-identity-and-echoes.md |
| OBJ_IDENTITYREPAIRBRANCHDISPOSITION | IdentityRepairBranchDisposition | record | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_IDENTITYREPAIRCASE | IdentityRepairCase | case | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_IDENTITYREPAIREVIDENCEBUNDLE | IdentityRepairEvidenceBundle | bundle | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_IDENTITYREPAIRFREEZERECORD | IdentityRepairFreezeRecord | record | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_IDENTITYREPAIRORCHESTRATOR | IdentityRepairOrchestrator | other | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_IDENTITYREPAIRRELEASESETTLEMENT | IdentityRepairReleaseSettlement | settlement | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_IDENTITYREPAIRSIGNAL | IdentityRepairSignal | event_contract | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_INFORMATIONREQUESTWINDOW | InformationRequestWindow | other | triage_human_checkpoint | phase_3_human_checkpoint | Triage domain | phase-3-the-human-checkpoint.md |
| OBJ_INLINESIDESTAGE | InlineSideStage | other | foundation_runtime_experience | phase_0_foundation | Frontend continuity runtime | phase-0-the-foundation-protocol.md |
| OBJ_INTAKECONVERGENCECONTRACT | IntakeConvergenceContract | contract | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_INTAKEOUTCOMEPRESENTATIONARTIFACT | IntakeOutcomePresentationArtifact | artifact | unknown | phase_1_red_flag_gate | Programme architecture registry | phase-1-the-red-flag-gate.md |
| OBJ_INTAKESUBMITSETTLEMENT | IntakeSubmitSettlement | settlement | unknown | phase_1_red_flag_gate | Programme architecture registry | phase-1-the-red-flag-gate.md |
| OBJ_INTAKESURFACERUNTIMEBINDING | IntakeSurfaceRuntimeBinding | descriptor | unknown | phase_1_red_flag_gate | Programme architecture registry | phase-1-the-red-flag-gate.md |
| OBJ_INTEGRATIONDEMODATASET | IntegrationDemoDataset | other | unknown | phase_7_embedded_channel_deferred | Programme architecture registry | phase-7-inside-the-nhs-app.md |
| OBJ_INTEGRATIONEVIDENCEPACK | IntegrationEvidencePack | bundle | unknown | phase_7_embedded_channel_deferred | Programme architecture registry | phase-7-inside-the-nhs-app.md |
| OBJ_INTENDEDUSEPROFILE | IntendedUseProfile | descriptor | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_INTERACTIONCONTRACTREGISTRY | InteractionContractRegistry | other | foundation_runtime_experience | phase_0_foundation | Frontend continuity runtime | phase-0-the-foundation-protocol.md |
| OBJ_INTERRUPTIONDIGESTPROJECTION | InterruptionDigestProjection | projection | staff_support_operations | cross_cutting_staff_workspace | Staff, support, and operations control | staff-workspace-interface-architecture.md |
| OBJ_INTERVENTIONCANDIDATELEASE | InterventionCandidateLease | lease | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_INVALIDATEDOPTIONSTUB | InvalidatedOptionStub | other | frontend_runtime | cross_cutting_ux_redesign | Frontend continuity runtime | ux-quiet-clarity-redesign.md |
| OBJ_INVENTORYCOMPARISONCANDIDATEPROJECTION | InventoryComparisonCandidateProjection | projection | staff_support_operations | cross_cutting_pharmacy_console | Staff, support, and operations control | pharmacy-console-frontend-architecture.md |
| OBJ_INVENTORYCOMPARISONFENCE | InventoryComparisonFence | gate | staff_support_operations | cross_cutting_pharmacy_console | Staff, support, and operations control | pharmacy-console-frontend-architecture.md |
| OBJ_INVESTIGATIONDRAWERSESSION | InvestigationDrawerSession | other | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_INVESTIGATIONSCOPEENVELOPE | InvestigationScopeEnvelope | record | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_INVESTIGATIONTIMELINERECONSTRUCTION | InvestigationTimelineReconstruction | other | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_JOURNEYCHANGENOTICE | JourneyChangeNotice | other | unknown | phase_7_embedded_channel_deferred | Programme architecture registry | phase-7-inside-the-nhs-app.md |
| OBJ_JOURNEYPATHDEFINITION | JourneyPathDefinition | other | unknown | phase_7_embedded_channel_deferred | Programme architecture registry | phase-7-inside-the-nhs-app.md |
| OBJ_JUMPOFFMAPPING | JumpOffMapping | other | unknown | phase_7_embedded_channel_deferred | Programme architecture registry | phase-7-inside-the-nhs-app.md |
| OBJ_KEYBOARDINTERACTIONCONTRACT | KeyboardInteractionContract | contract | frontend_runtime | cross_cutting_accessibility_content | Frontend continuity runtime | accessibility-and-content-system-contract.md |
| OBJ_LEASETAKEOVERRECORD | LeaseTakeoverRecord | record | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_LEGACYREFERENCEFINDING | LegacyReferenceFinding | other | platform_configuration | cross_cutting_platform_admin | Platform administration and configuration | platform-admin-and-config-blueprint.md |
| OBJ_LEGALHOLDRECORD | LegalHoldRecord | record | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_LEGALHOLDSCOPEMANIFEST | LegalHoldScopeManifest | manifest | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_LIFECYCLECOORDINATOR | LifecycleCoordinator | other | foundation_identity_access | phase_0_foundation | LifecycleCoordinator | phase-0-the-foundation-protocol.md |
| OBJ_LINEAGECASELINK | LineageCaseLink | aggregate | foundation_control_plane | phase_0_foundation | Foundation control plane | phase-0-the-foundation-protocol.md |
| OBJ_LINEAGEFENCE | LineageFence | gate | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_LINEAGERECOVERYDISPOSITION | LineageRecoveryDisposition | record | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_LINEAGESCOPEDESCRIPTOR | LineageScopeDescriptor | descriptor | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_LINECHECKPOINTEVALUATION | LineCheckpointEvaluation | record | staff_support_operations | cross_cutting_pharmacy_console | Staff, support, and operations control | pharmacy-console-frontend-architecture.md |
| OBJ_LINKRESOLUTIONAUDIT | LinkResolutionAudit | other | unknown | phase_7_embedded_channel_deferred | Programme architecture registry | phase-7-inside-the-nhs-app.md |
| OBJ_LIVEANNOUNCEMENTGOVERNOR | LiveAnnouncementGovernor | other | foundation_runtime_experience | phase_0_foundation | Frontend continuity runtime | phase-0-the-foundation-protocol.md |
| OBJ_LIVEBOARDDELTAWINDOW | LiveBoardDeltaWindow | other | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_LIVEPROJECTIONBRIDGE | LiveProjectionBridge | other | foundation_runtime_experience | phase_0_foundation | Frontend continuity runtime | phase-0-the-foundation-protocol.md |
| OBJ_MACROSTATEMAPPER | MacroStateMapper | other | foundation_runtime_experience | phase_0_foundation | Frontend continuity runtime | phase-0-the-foundation-protocol.md |
| OBJ_MANIFESTPROMOTIONBUNDLE | ManifestPromotionBundle | bundle | unknown | phase_7_embedded_channel_deferred | Programme architecture registry | phase-7-inside-the-nhs-app.md |
| OBJ_MANUALDISPATCHASSISTANCERECORD | ManualDispatchAssistanceRecord | record | pharmacy | phase_6_pharmacy_loop | Pharmacy loop domain | phase-6-the-pharmacy-loop.md |
| OBJ_MATERIALDELTAASSESSMENT | MaterialDeltaAssessment | record | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_MATERIALITYEVALUATION | MaterialityEvaluation | record | staff_support_operations | cross_cutting_operations_console | Staff, support, and operations control | operations-console-frontend-blueprint.md |
| OBJ_MEDICALDEVICEASSESSMENTREF | MedicalDeviceAssessmentRef | other | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_MEDICATIONVALIDATIONCARDPROJECTION | MedicationValidationCardProjection | projection | staff_support_operations | cross_cutting_pharmacy_console | Staff, support, and operations control | pharmacy-console-frontend-architecture.md |
| OBJ_MESSAGEDELIVERYEVIDENCEBUNDLE | MessageDeliveryEvidenceBundle | bundle | callback_messaging | cross_cutting_callback_and_messaging | Callback and messaging domain | callback-and-clinician-messaging-loop.md |
| OBJ_MESSAGEDISPATCHENVELOPE | MessageDispatchEnvelope | record | callback_messaging | cross_cutting_callback_and_messaging | Callback and messaging domain | callback-and-clinician-messaging-loop.md |
| OBJ_MESSAGEDRAFTARTIFACT | MessageDraftArtifact | artifact | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_METRICANOMALYSNAPSHOT | MetricAnomalySnapshot | record | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_MIGRATIONACTIONOBSERVATIONWINDOW | MigrationActionObservationWindow | other | runtime_release | cross_cutting_runtime_release | Runtime publication control plane | platform-runtime-and-release-blueprint.md |
| OBJ_MIGRATIONACTIONRECORD | MigrationActionRecord | record | runtime_release | cross_cutting_runtime_release | Runtime publication control plane | platform-runtime-and-release-blueprint.md |
| OBJ_MIGRATIONACTIONSETTLEMENT | MigrationActionSettlement | settlement | runtime_release | cross_cutting_runtime_release | Runtime publication control plane | platform-runtime-and-release-blueprint.md |
| OBJ_MIGRATIONCUTOVERCHECKPOINT | MigrationCutoverCheckpoint | checkpoint | platform_configuration | cross_cutting_platform_admin | Platform administration and configuration | platform-admin-and-config-blueprint.md |
| OBJ_MIGRATIONEXECUTIONBINDING | MigrationExecutionBinding | descriptor | runtime_release | cross_cutting_runtime_release | Runtime publication control plane | platform-runtime-and-release-blueprint.md |
| OBJ_MIGRATIONEXECUTIONRECEIPT | MigrationExecutionReceipt | other | runtime_release | cross_cutting_runtime_release | Runtime publication control plane | platform-runtime-and-release-blueprint.md |
| OBJ_MIGRATIONIMPACTPREVIEW | MigrationImpactPreview | other | runtime_release | cross_cutting_runtime_release | Runtime publication control plane | platform-runtime-and-release-blueprint.md |
| OBJ_MIGRATIONPRESENTATIONARTIFACT | MigrationPresentationArtifact | artifact | runtime_release | cross_cutting_runtime_release | Runtime publication control plane | platform-runtime-and-release-blueprint.md |
| OBJ_MIGRATIONVERIFICATIONRECORD | MigrationVerificationRecord | record | runtime_release | cross_cutting_runtime_release | Runtime publication control plane | platform-runtime-and-release-blueprint.md |
| OBJ_MINIMUMNECESSARYCONTRACT | MinimumNecessaryContract | contract | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_MISSIONSTACKFOLDPLAN | MissionStackFoldPlan | other | frontend_runtime | cross_cutting_ux_redesign | Frontend continuity runtime | ux-quiet-clarity-redesign.md |
| OBJ_MODELCHANGEREQUEST | ModelChangeRequest | other | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_MODELPOLICY | ModelPolicy | policy | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_MODELREGISTRYENTRY | ModelRegistryEntry | other | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_MONTHLYASSURANCEPACK | MonthlyAssurancePack | bundle | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_MOREINFOCYCLE | MoreInfoCycle | case | triage_human_checkpoint | phase_3_human_checkpoint | Triage domain | phase-3-the-human-checkpoint.md |
| OBJ_MOREINFOREMINDERSCHEDULE | MoreInfoReminderSchedule | other | triage_human_checkpoint | phase_3_human_checkpoint | Triage domain | phase-3-the-human-checkpoint.md |
| OBJ_MOREINFOREPLYWINDOWCHECKPOINT | MoreInfoReplyWindowCheckpoint | checkpoint | triage_human_checkpoint | phase_3_human_checkpoint | Triage domain | phase-3-the-human-checkpoint.md |
| OBJ_MOREINFORESPONSEDISPOSITION | MoreInfoResponseDisposition | record | triage_human_checkpoint | phase_3_human_checkpoint | Triage domain | phase-3-the-human-checkpoint.md |
| OBJ_MOREINFOSTATUSDIGEST | MoreInfoStatusDigest | digest | staff_support_operations | cross_cutting_staff_workspace | Staff, support, and operations control | staff-workspace-interface-architecture.md |
| OBJ_MOTIONCUEENVELOPE | MotionCueEnvelope | record | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_MOTIONINTENTTOKEN | MotionIntentToken | token | foundation_runtime_experience | phase_0_foundation | Frontend continuity runtime | phase-0-the-foundation-protocol.md |
| OBJ_MOTIONREGIONARBITRATION | MotionRegionArbitration | other | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_MOTIONSEMANTICREGISTRY | MotionSemanticRegistry | other | foundation_runtime_experience | phase_0_foundation | Frontend continuity runtime | phase-0-the-foundation-protocol.md |
| OBJ_MOTIONVERIFICATIONTRACE | MotionVerificationTrace | other | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_NARROWSCREENCONTINUITYPLAN | NarrowScreenContinuityPlan | other | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_NAVIGATIONCONTRACT | NavigationContract | contract | unknown | phase_7_embedded_channel_deferred | Programme architecture registry | phase-7-inside-the-nhs-app.md |
| OBJ_NAVIGATIONSTATELEDGER | NavigationStateLedger | other | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_NEARMISSREPORT | NearMissReport | record | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_NEIGHBORSUBSTITUTIONPOLICY | NeighborSubstitutionPolicy | policy | frontend_runtime | cross_cutting_ux_redesign | Frontend continuity runtime | ux-quiet-clarity-redesign.md |
| OBJ_NETWORKBOOKINGREQUEST | NetworkBookingRequest | other | hub_coordination | phase_5_network_horizon | Hub coordination domain | phase-5-the-network-horizon.md |
| OBJ_NETWORKCANDIDATESNAPSHOT | NetworkCandidateSnapshot | record | hub_coordination | phase_5_network_horizon | Hub coordination domain | phase-5-the-network-horizon.md |
| OBJ_NETWORKCOORDINATIONPOLICYEVALUATION | NetworkCoordinationPolicyEvaluation | record | hub_coordination | phase_5_network_horizon | Hub coordination domain | phase-5-the-network-horizon.md |
| OBJ_NETWORKMANAGECAPABILITIES | NetworkManageCapabilities | other | hub_coordination | phase_5_network_horizon | Hub coordination domain | phase-5-the-network-horizon.md |
| OBJ_NETWORKREMINDERPLAN | NetworkReminderPlan | other | hub_coordination | phase_5_network_horizon | Hub coordination domain | phase-5-the-network-horizon.md |
| OBJ_NETWORKSLOTCANDIDATE | NetworkSlotCandidate | other | hub_coordination | phase_5_network_horizon | Hub coordination domain | phase-5-the-network-horizon.md |
| OBJ_NEXTTASKLAUNCHLEASE | NextTaskLaunchLease | lease | staff_support_operations | cross_cutting_staff_workspace | Staff, support, and operations control | staff-workspace-interface-architecture.md |
| OBJ_NEXTTASKPREFETCHWINDOW | NextTaskPrefetchWindow | other | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_NHSAPPBRIDGE | NHSAppBridge | other | unknown | phase_7_embedded_channel_deferred | Programme architecture registry | phase-7-inside-the-nhs-app.md |
| OBJ_NHSAPPCONTINUITYEVIDENCEBUNDLE | NHSAppContinuityEvidenceBundle | bundle | unknown | phase_7_embedded_channel_deferred | Programme architecture registry | phase-7-inside-the-nhs-app.md |
| OBJ_NHSAPPENVIRONMENTPROFILE | NHSAppEnvironmentProfile | descriptor | unknown | phase_7_embedded_channel_deferred | Programme architecture registry | phase-7-inside-the-nhs-app.md |
| OBJ_NHSAPPINTEGRATIONMANIFEST | NHSAppIntegrationManifest | manifest | unknown | phase_7_embedded_channel_deferred | Programme architecture registry | phase-7-inside-the-nhs-app.md |
| OBJ_NHSAPPPERFORMANCEPACK | NHSAppPerformancePack | bundle | unknown | phase_7_embedded_channel_deferred | Programme architecture registry | phase-7-inside-the-nhs-app.md |
| OBJ_NOAUTOWRITEPOLICY | NoAutoWritePolicy | policy | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_NORMALIZEDSLOT | NormalizedSlot | other | booking | phase_4_booking_engine | Booking domain | phase-4-the-booking-engine.md |
| OBJ_OFFERSESSION | OfferSession | other | booking | phase_4_booking_engine | Booking domain | phase-4-the-booking-engine.md |
| OBJ_ONCALLMATRIX | OnCallMatrix | other | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_OPERATIONALMETRICDEFINITION | OperationalMetricDefinition | other | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_OPERATIONALREADINESSSNAPSHOT | OperationalReadinessSnapshot | record | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_OPERATORHANDOFFFRAME | OperatorHandoffFrame | other | staff_support_operations | cross_cutting_staff_workspace | Staff, support, and operations control | staff-workspace-interface-architecture.md |
| OBJ_OPSACTIONELIGIBILITYFENCE | OpsActionEligibilityFence | gate | staff_support_operations | cross_cutting_operations_console | Staff, support, and operations control | operations-console-frontend-blueprint.md |
| OBJ_OPSBOARDPOSTURE | OpsBoardPosture | other | staff_support_operations | cross_cutting_operations_console | Staff, support, and operations control | operations-console-frontend-blueprint.md |
| OBJ_OPSBOARDSTATESNAPSHOT | OpsBoardStateSnapshot | record | audited_flow_gap | cross_cutting_operations_console | Cross-phase gap register | operations-console-frontend-blueprint.md |
| OBJ_OPSBOARDSURFACESTATE | OpsBoardSurfaceState | descriptor | staff_support_operations | cross_cutting_operations_console | Staff, support, and operations control | operations-console-frontend-blueprint.md |
| OBJ_OPSBRIEFINGARTIFACT | OpsBriefingArtifact | artifact | staff_support_operations | cross_cutting_operations_console | Staff, support, and operations control | operations-console-frontend-blueprint.md |
| OBJ_OPSCONTINUITYEVIDENCESLICE | OpsContinuityEvidenceSlice | projection | audited_flow_gap | cross_cutting_operations_console | Cross-phase gap register | operations-console-frontend-blueprint.md |
| OBJ_OPSDELTAGATE | OpsDeltaGate | gate | staff_support_operations | cross_cutting_operations_console | Staff, support, and operations control | operations-console-frontend-blueprint.md |
| OBJ_OPSDRILLCONTEXTANCHOR | OpsDrillContextAnchor | other | staff_support_operations | cross_cutting_operations_console | Staff, support, and operations control | operations-console-frontend-blueprint.md |
| OBJ_OPSESCALATIONCOOLDOWNWINDOW | OpsEscalationCooldownWindow | other | staff_support_operations | cross_cutting_operations_console | Staff, support, and operations control | operations-console-frontend-blueprint.md |
| OBJ_OPSFOCUSPROTECTIONFENCE | OpsFocusProtectionFence | gate | staff_support_operations | cross_cutting_operations_console | Staff, support, and operations control | operations-console-frontend-blueprint.md |
| OBJ_OPSGOVERNANCEHANDOFF | OpsGovernanceHandoff | other | staff_support_operations | cross_cutting_operations_console | Staff, support, and operations control | operations-console-frontend-blueprint.md |
| OBJ_OPSINTERVENTIONACTIONRECORD | OpsInterventionActionRecord | record | staff_support_operations | cross_cutting_operations_console | Staff, support, and operations control | operations-console-frontend-blueprint.md |
| OBJ_OPSINTERVENTIONREADINESS | OpsInterventionReadiness | other | staff_support_operations | cross_cutting_operations_console | Staff, support, and operations control | operations-console-frontend-blueprint.md |
| OBJ_OPSINTERVENTIONSETTLEMENT | OpsInterventionSettlement | settlement | staff_support_operations | cross_cutting_operations_console | Staff, support, and operations control | operations-console-frontend-blueprint.md |
| OBJ_OPSLIVECADENCEPOLICY | OpsLiveCadencePolicy | policy | staff_support_operations | cross_cutting_operations_console | Staff, support, and operations control | operations-console-frontend-blueprint.md |
| OBJ_OPSMOTIONENVELOPE | OpsMotionEnvelope | record | staff_support_operations | cross_cutting_operations_console | Staff, support, and operations control | operations-console-frontend-blueprint.md |
| OBJ_OPSOVERVIEWCONTEXTFRAME | OpsOverviewContextFrame | other | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_OPSOVERVIEWSLICEENVELOPE | OpsOverviewSliceEnvelope | record | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_OPSPROMINENCEDECISION | OpsProminenceDecision | record | staff_support_operations | cross_cutting_operations_console | Staff, support, and operations control | operations-console-frontend-blueprint.md |
| OBJ_OPSRECOVERYRUNTIMELINE | OpsRecoveryRunTimeline | other | staff_support_operations | cross_cutting_operations_console | Staff, support, and operations control | operations-console-frontend-blueprint.md |
| OBJ_OPSREDUCEDMOTIONPROFILE | OpsReducedMotionProfile | descriptor | staff_support_operations | cross_cutting_operations_console | Staff, support, and operations control | operations-console-frontend-blueprint.md |
| OBJ_OPSRESILIENCEREADINESSSLICE | OpsResilienceReadinessSlice | other | staff_support_operations | cross_cutting_operations_console | Staff, support, and operations control | operations-console-frontend-blueprint.md |
| OBJ_OPSRESTOREREPORT | OpsRestoreReport | other | staff_support_operations | cross_cutting_operations_console | Staff, support, and operations control | operations-console-frontend-blueprint.md |
| OBJ_OPSRETURNTOKEN | OpsReturnToken | token | staff_support_operations | cross_cutting_operations_console | Staff, support, and operations control | operations-console-frontend-blueprint.md |
| OBJ_OPSROUTEINTENT | OpsRouteIntent | other | staff_support_operations | cross_cutting_operations_console | Staff, support, and operations control | operations-console-frontend-blueprint.md |
| OBJ_OPSSELECTEDANOMALYSTATE | OpsSelectedAnomalyState | descriptor | staff_support_operations | cross_cutting_operations_console | Staff, support, and operations control | operations-console-frontend-blueprint.md |
| OBJ_OPSSELECTIONLEASE | OpsSelectionLease | lease | staff_support_operations | cross_cutting_operations_console | Staff, support, and operations control | operations-console-frontend-blueprint.md |
| OBJ_OPSSEMANTICTONEPOLICY | OpsSemanticTonePolicy | policy | staff_support_operations | cross_cutting_operations_console | Staff, support, and operations control | operations-console-frontend-blueprint.md |
| OBJ_OPSSLICEFRESHNESSSTATE | OpsSliceFreshnessState | descriptor | staff_support_operations | cross_cutting_operations_console | Staff, support, and operations control | operations-console-frontend-blueprint.md |
| OBJ_OPSSTABLESERVICEDIGEST | OpsStableServiceDigest | digest | staff_support_operations | cross_cutting_operations_console | Staff, support, and operations control | operations-console-frontend-blueprint.md |
| OBJ_OPSSURFACEFOOTPRINTPLAN | OpsSurfaceFootprintPlan | other | staff_support_operations | cross_cutting_operations_console | Staff, support, and operations control | operations-console-frontend-blueprint.md |
| OBJ_OUTBOUNDNAVIGATIONGRANT | OutboundNavigationGrant | grant | frontend_runtime | phase_0_foundation | Frontend continuity runtime | phase-0-the-foundation-protocol.md |
| OBJ_OUTCOMEEVIDENCEENVELOPE | OutcomeEvidenceEnvelope | record | pharmacy | phase_6_pharmacy_loop | Pharmacy loop domain | phase-6-the-pharmacy-loop.md |
| OBJ_OVERRIDERECORD | OverrideRecord | record | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_PATHWAYDEFINITION | PathwayDefinition | other | pharmacy | phase_6_pharmacy_loop | Pharmacy loop domain | phase-6-the-pharmacy-loop.md |
| OBJ_PATHWAYELIGIBILITYEVALUATION | PathwayEligibilityEvaluation | record | pharmacy | phase_6_pharmacy_loop | Pharmacy loop domain | phase-6-the-pharmacy-loop.md |
| OBJ_PATHWAYTIMINGGUARDRAIL | PathwayTimingGuardrail | other | pharmacy | phase_6_pharmacy_loop | Pharmacy loop domain | phase-6-the-pharmacy-loop.md |
| OBJ_PATIENTACTIONRECOVERYENVELOPE | PatientActionRecoveryEnvelope | record | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_PATIENTACTIONRECOVERYPROJECTION | PatientActionRecoveryProjection | projection | patient_experience | cross_cutting_patient_account | Patient experience projections | patient-account-and-communications-blueprint.md |
| OBJ_PATIENTACTIONROUTINGPROJECTION | PatientActionRoutingProjection | projection | patient_experience | cross_cutting_patient_account | Patient experience projections | patient-account-and-communications-blueprint.md |
| OBJ_PATIENTACTIONSETTLEMENTPROJECTION | PatientActionSettlementProjection | projection | patient_experience | cross_cutting_patient_account | Patient experience projections | patient-account-and-communications-blueprint.md |
| OBJ_PATIENTAPPOINTMENTARTIFACTPROJECTION | PatientAppointmentArtifactProjection | projection | booking | phase_4_booking_engine | Booking domain | phase-4-the-booking-engine.md |
| OBJ_PATIENTAPPOINTMENTLISTPROJECTION | PatientAppointmentListProjection | projection | booking | phase_4_booking_engine | Booking domain | phase-4-the-booking-engine.md |
| OBJ_PATIENTAPPOINTMENTMANAGEPROJECTION | PatientAppointmentManageProjection | projection | booking | phase_4_booking_engine | Booking domain | phase-4-the-booking-engine.md |
| OBJ_PATIENTAPPOINTMENTWORKSPACEPROJECTION | PatientAppointmentWorkspaceProjection | projection | booking | phase_4_booking_engine | Booking domain | phase-4-the-booking-engine.md |
| OBJ_PATIENTARTIFACTFRAME | PatientArtifactFrame | other | frontend_runtime | cross_cutting_patient_portal | Frontend continuity runtime | patient-portal-experience-architecture-blueprint.md |
| OBJ_PATIENTATTENTIONCUEPOLICY | PatientAttentionCuePolicy | policy | frontend_runtime | cross_cutting_patient_portal | Frontend continuity runtime | patient-portal-experience-architecture-blueprint.md |
| OBJ_PATIENTAUDIENCECOVERAGEPROJECTION | PatientAudienceCoverageProjection | projection | patient_experience | cross_cutting_patient_account | Patient experience projections | patient-account-and-communications-blueprint.md |
| OBJ_PATIENTCALLBACKSTATUSPROJECTION | PatientCallbackStatusProjection | projection | patient_experience | cross_cutting_patient_account | Patient experience projections | patient-account-and-communications-blueprint.md |
| OBJ_PATIENTCALMBUDGETPROFILE | PatientCalmBudgetProfile | descriptor | frontend_runtime | cross_cutting_ux_redesign | Frontend continuity runtime | ux-quiet-clarity-redesign.md |
| OBJ_PATIENTCOMMUNICATIONVISIBILITYPROJECTION | PatientCommunicationVisibilityProjection | projection | patient_experience | cross_cutting_patient_account | Patient experience projections | patient-account-and-communications-blueprint.md |
| OBJ_PATIENTCOMPOSERLEASE | PatientComposerLease | lease | callback_messaging | cross_cutting_callback_and_messaging | Callback and messaging domain | callback-and-clinician-messaging-loop.md |
| OBJ_PATIENTCONSENTCHECKPOINTPROJECTION | PatientConsentCheckpointProjection | projection | patient_experience | cross_cutting_patient_account | Patient experience projections | patient-account-and-communications-blueprint.md |
| OBJ_PATIENTCONTACTREPAIRPROJECTION | PatientContactRepairProjection | projection | patient_experience | cross_cutting_patient_account | Patient experience projections | patient-account-and-communications-blueprint.md |
| OBJ_PATIENTCONVERSATIONCLUSTER | PatientConversationCluster | other | callback_messaging | cross_cutting_callback_and_messaging | Callback and messaging domain | callback-and-clinician-messaging-loop.md |
| OBJ_PATIENTCONVERSATIONPREVIEWDIGEST | PatientConversationPreviewDigest | digest | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_PATIENTDEGRADEDMODEPROJECTION | PatientDegradedModeProjection | projection | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_PATIENTDOMINANTACTIONHIERARCHY | PatientDominantActionHierarchy | other | frontend_runtime | cross_cutting_patient_portal | Frontend continuity runtime | patient-portal-experience-architecture-blueprint.md |
| OBJ_PATIENTEMBEDDEDNAVELIGIBILITY | PatientEmbeddedNavEligibility | other | unknown | phase_7_embedded_channel_deferred | Programme architecture registry | phase-7-inside-the-nhs-app.md |
| OBJ_PATIENTEMBEDDEDSESSIONPROJECTION | PatientEmbeddedSessionProjection | projection | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_PATIENTEXPERIENCECONTINUITYEVIDENCEPROJECTION | PatientExperienceContinuityEvidenceProjection | projection | patient_experience | cross_cutting_patient_account | Patient experience projections | patient-account-and-communications-blueprint.md |
| OBJ_PATIENTIDENTITYHOLDPROJECTION | PatientIdentityHoldProjection | projection | patient_experience | cross_cutting_patient_account | Patient experience projections | patient-account-and-communications-blueprint.md |
| OBJ_PATIENTLINK | PatientLink | other | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_PATIENTMANAGECAPABILITIESPROJECTION | PatientManageCapabilitiesProjection | projection | patient_experience | cross_cutting_patient_account | Patient experience projections | patient-account-and-communications-blueprint.md |
| OBJ_PATIENTMOREINFOSTATUSPROJECTION | PatientMoreInfoStatusProjection | projection | patient_experience | cross_cutting_patient_account | Patient experience projections | patient-account-and-communications-blueprint.md |
| OBJ_PATIENTNAVRETURNCONTRACT | PatientNavReturnContract | contract | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_PATIENTNAVSECTIONELIGIBILITY | PatientNavSectionEligibility | other | frontend_runtime | cross_cutting_patient_portal | Frontend continuity runtime | patient-portal-experience-architecture-blueprint.md |
| OBJ_PATIENTNAVURGENCYDIGEST | PatientNavUrgencyDigest | digest | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_PATIENTNEXTACTIONPROJECTION | PatientNextActionProjection | projection | patient_experience | cross_cutting_patient_account | Patient experience projections | patient-account-and-communications-blueprint.md |
| OBJ_PATIENTPORTALCONTINUITYEVIDENCEBUNDLE | PatientPortalContinuityEvidenceBundle | bundle | frontend_runtime | cross_cutting_patient_portal | Frontend continuity runtime | patient-portal-experience-architecture-blueprint.md |
| OBJ_PATIENTPORTALENTRYPROJECTION | PatientPortalEntryProjection | projection | frontend_runtime | cross_cutting_patient_portal | Frontend continuity runtime | patient-portal-experience-architecture-blueprint.md |
| OBJ_PATIENTPORTALNAVIGATIONLEDGER | PatientPortalNavigationLedger | other | frontend_runtime | cross_cutting_patient_portal | Frontend continuity runtime | patient-portal-experience-architecture-blueprint.md |
| OBJ_PATIENTPRIMARYNAVMANIFEST | PatientPrimaryNavManifest | manifest | frontend_runtime | cross_cutting_patient_portal | Frontend continuity runtime | patient-portal-experience-architecture-blueprint.md |
| OBJ_PATIENTQUIETHOMEDECISION | PatientQuietHomeDecision | record | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_PATIENTREACHABILITYSUMMARYPROJECTION | PatientReachabilitySummaryProjection | projection | patient_experience | cross_cutting_patient_account | Patient experience projections | patient-account-and-communications-blueprint.md |
| OBJ_PATIENTRECEIPTCONSISTENCYENVELOPE | PatientReceiptConsistencyEnvelope | record | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_PATIENTRECEIPTENVELOPE | PatientReceiptEnvelope | record | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_PATIENTRECORDARTIFACTPROJECTION | PatientRecordArtifactProjection | projection | patient_experience | cross_cutting_patient_account | Patient experience projections | patient-account-and-communications-blueprint.md |
| OBJ_PATIENTRECORDCONTINUITYSTATE | PatientRecordContinuityState | descriptor | patient_experience | cross_cutting_patient_account | Patient experience projections | patient-account-and-communications-blueprint.md |
| OBJ_PATIENTRECORDFOLLOWUPELIGIBILITYPROJECTION | PatientRecordFollowUpEligibilityProjection | projection | patient_experience | cross_cutting_patient_account | Patient experience projections | patient-account-and-communications-blueprint.md |
| OBJ_PATIENTRECORDSURFACECONTEXT | PatientRecordSurfaceContext | other | patient_experience | cross_cutting_patient_account | Patient experience projections | patient-account-and-communications-blueprint.md |
| OBJ_PATIENTREQUESTDETAILPROJECTION | PatientRequestDetailProjection | projection | patient_experience | cross_cutting_patient_account | Patient experience projections | patient-account-and-communications-blueprint.md |
| OBJ_PATIENTREQUESTDOWNSTREAMPROJECTION | PatientRequestDownstreamProjection | projection | patient_experience | cross_cutting_patient_account | Patient experience projections | patient-account-and-communications-blueprint.md |
| OBJ_PATIENTREQUESTLINEAGEPROJECTION | PatientRequestLineageProjection | projection | frontend_runtime | cross_cutting_patient_portal | Frontend continuity runtime | patient-portal-experience-architecture-blueprint.md |
| OBJ_PATIENTREQUESTRETURNBUNDLE | PatientRequestReturnBundle | bundle | patient_experience | cross_cutting_patient_account | Patient experience projections | patient-account-and-communications-blueprint.md |
| OBJ_PATIENTREQUESTSINDEXPROJECTION | PatientRequestsIndexProjection | projection | frontend_runtime | cross_cutting_patient_portal | Frontend continuity runtime | patient-portal-experience-architecture-blueprint.md |
| OBJ_PATIENTREQUESTSUMMARYPROJECTION | PatientRequestSummaryProjection | projection | patient_experience | cross_cutting_patient_account | Patient experience projections | patient-account-and-communications-blueprint.md |
| OBJ_PATIENTRESULTINTERPRETATIONPROJECTION | PatientResultInterpretationProjection | projection | patient_experience | cross_cutting_patient_account | Patient experience projections | patient-account-and-communications-blueprint.md |
| OBJ_PATIENTROUTEADJACENCY | PatientRouteAdjacency | other | frontend_runtime | cross_cutting_patient_portal | Frontend continuity runtime | patient-portal-experience-architecture-blueprint.md |
| OBJ_PATIENTROUTEPOSTURE | PatientRoutePosture | other | frontend_runtime | cross_cutting_patient_portal | Frontend continuity runtime | patient-portal-experience-architecture-blueprint.md |
| OBJ_PATIENTSAFETYINTERRUPTIONPROJECTION | PatientSafetyInterruptionProjection | projection | patient_experience | cross_cutting_patient_account | Patient experience projections | patient-account-and-communications-blueprint.md |
| OBJ_PATIENTSECTIONHEADERFRAME | PatientSectionHeaderFrame | other | frontend_runtime | cross_cutting_patient_portal | Frontend continuity runtime | patient-portal-experience-architecture-blueprint.md |
| OBJ_PATIENTSECTIONSURFACESTATE | PatientSectionSurfaceState | descriptor | frontend_runtime | cross_cutting_patient_portal | Frontend continuity runtime | patient-portal-experience-architecture-blueprint.md |
| OBJ_PATIENTSECURELINKSESSIONPROJECTION | PatientSecureLinkSessionProjection | projection | patient_experience | cross_cutting_patient_account | Patient experience projections | patient-account-and-communications-blueprint.md |
| OBJ_PATIENTSELECTEDANCHORPOLICY | PatientSelectedAnchorPolicy | policy | frontend_runtime | cross_cutting_patient_portal | Frontend continuity runtime | patient-portal-experience-architecture-blueprint.md |
| OBJ_PATIENTSHELLCONSISTENCYPROJECTION | PatientShellConsistencyProjection | projection | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_PATIENTSPOTLIGHTDECISIONPROJECTION | PatientSpotlightDecisionProjection | projection | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_PATIENTSPOTLIGHTDECISIONUSEWINDOW | PatientSpotlightDecisionUseWindow | other | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_PATIENTSTATUSPRESENTATIONCONTRACT | PatientStatusPresentationContract | contract | frontend_runtime | cross_cutting_patient_portal | Frontend continuity runtime | patient-portal-experience-architecture-blueprint.md |
| OBJ_PATIENTTRUSTCUECONTRACT | PatientTrustCueContract | contract | frontend_runtime | cross_cutting_patient_portal | Frontend continuity runtime | patient-portal-experience-architecture-blueprint.md |
| OBJ_PATIENTURGENTDIVERSIONSTATE | PatientUrgentDiversionState | descriptor | callback_messaging | cross_cutting_callback_and_messaging | Callback and messaging domain | callback-and-clinician-messaging-loop.md |
| OBJ_PATIENTUTILITYNAVMANIFEST | PatientUtilityNavManifest | manifest | frontend_runtime | cross_cutting_patient_portal | Frontend continuity runtime | patient-portal-experience-architecture-blueprint.md |
| OBJ_PENDINGACTIONRETENTION | PendingActionRetention | other | frontend_runtime | cross_cutting_ux_redesign | Frontend continuity runtime | ux-quiet-clarity-redesign.md |
| OBJ_PERSISTENTSHELL | PersistentShell | descriptor | frontend_runtime | phase_0_foundation | Frontend continuity runtime | phase-0-the-foundation-protocol.md |
| OBJ_PHARMACYACTIONSETTLEMENT | PharmacyActionSettlement | settlement | staff_support_operations | cross_cutting_pharmacy_console | Staff, support, and operations control | pharmacy-console-frontend-architecture.md |
| OBJ_PHARMACYBOUNCEBACKRECORD | PharmacyBounceBackRecord | record | pharmacy | phase_6_pharmacy_loop | Pharmacy loop domain | phase-6-the-pharmacy-loop.md |
| OBJ_PHARMACYCASE | PharmacyCase | case | pharmacy | phase_6_pharmacy_loop | Pharmacy loop domain | phase-6-the-pharmacy-loop.md |
| OBJ_PHARMACYCASEARTIFACTFRAME | PharmacyCaseArtifactFrame | other | staff_support_operations | cross_cutting_pharmacy_console | Staff, support, and operations control | pharmacy-console-frontend-architecture.md |
| OBJ_PHARMACYCHOICEDISCLOSUREPOLICY | PharmacyChoiceDisclosurePolicy | policy | pharmacy | phase_6_pharmacy_loop | Pharmacy loop domain | phase-6-the-pharmacy-loop.md |
| OBJ_PHARMACYCHOICEEXPLANATION | PharmacyChoiceExplanation | other | pharmacy | phase_6_pharmacy_loop | Pharmacy loop domain | phase-6-the-pharmacy-loop.md |
| OBJ_PHARMACYCHOICEOVERRIDEACKNOWLEDGEMENT | PharmacyChoiceOverrideAcknowledgement | other | pharmacy | phase_6_pharmacy_loop | Pharmacy loop domain | phase-6-the-pharmacy-loop.md |
| OBJ_PHARMACYCHOICEPROOF | PharmacyChoiceProof | other | pharmacy | phase_6_pharmacy_loop | Pharmacy loop domain | phase-6-the-pharmacy-loop.md |
| OBJ_PHARMACYCHOICESESSION | PharmacyChoiceSession | other | pharmacy | phase_6_pharmacy_loop | Pharmacy loop domain | phase-6-the-pharmacy-loop.md |
| OBJ_PHARMACYCHOICETRUTHPROJECTION | PharmacyChoiceTruthProjection | projection | pharmacy | phase_6_pharmacy_loop | Pharmacy loop domain | phase-6-the-pharmacy-loop.md |
| OBJ_PHARMACYCOMMANDFENCESESSION | PharmacyCommandFenceSession | other | staff_support_operations | cross_cutting_pharmacy_console | Staff, support, and operations control | pharmacy-console-frontend-architecture.md |
| OBJ_PHARMACYCONSENTCHECKPOINT | PharmacyConsentCheckpoint | checkpoint | pharmacy | phase_6_pharmacy_loop | Pharmacy loop domain | phase-6-the-pharmacy-loop.md |
| OBJ_PHARMACYCONSENTRECORD | PharmacyConsentRecord | record | pharmacy | phase_6_pharmacy_loop | Pharmacy loop domain | phase-6-the-pharmacy-loop.md |
| OBJ_PHARMACYCONSENTREVOCATIONRECORD | PharmacyConsentRevocationRecord | record | pharmacy | phase_6_pharmacy_loop | Pharmacy loop domain | phase-6-the-pharmacy-loop.md |
| OBJ_PHARMACYCONSOLECONTINUITYEVIDENCEPROJECTION | PharmacyConsoleContinuityEvidenceProjection | projection | staff_support_operations | cross_cutting_pharmacy_console | Staff, support, and operations control | pharmacy-console-frontend-architecture.md |
| OBJ_PHARMACYCONSOLESHELL | PharmacyConsoleShell | other | staff_support_operations | cross_cutting_pharmacy_console | Staff, support, and operations control | pharmacy-console-frontend-architecture.md |
| OBJ_PHARMACYCONTINUATIONLEASE | PharmacyContinuationLease | lease | unknown | forensic_patch_guidance | Programme architecture registry | forensic-audit-findings.md |
| OBJ_PHARMACYCONTINUITYEVIDENCEPROJECTION | PharmacyContinuityEvidenceProjection | projection | pharmacy | phase_6_pharmacy_loop | Pharmacy loop domain | phase-6-the-pharmacy-loop.md |
| OBJ_PHARMACYCORRELATIONRECORD | PharmacyCorrelationRecord | record | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_PHARMACYDIRECTORYSNAPSHOT | PharmacyDirectorySnapshot | record | pharmacy | phase_6_pharmacy_loop | Pharmacy loop domain | phase-6-the-pharmacy-loop.md |
| OBJ_PHARMACYDIRECTORYSOURCESNAPSHOT | PharmacyDirectorySourceSnapshot | record | pharmacy | phase_6_pharmacy_loop | Pharmacy loop domain | phase-6-the-pharmacy-loop.md |
| OBJ_PHARMACYDISPATCHATTEMPT | PharmacyDispatchAttempt | record | pharmacy | phase_6_pharmacy_loop | Pharmacy loop domain | phase-6-the-pharmacy-loop.md |
| OBJ_PHARMACYDISPATCHPLAN | PharmacyDispatchPlan | other | pharmacy | phase_6_pharmacy_loop | Pharmacy loop domain | phase-6-the-pharmacy-loop.md |
| OBJ_PHARMACYDISPATCHSETTLEMENT | PharmacyDispatchSettlement | settlement | pharmacy | phase_6_pharmacy_loop | Pharmacy loop domain | phase-6-the-pharmacy-loop.md |
| OBJ_PHARMACYDISPATCHTRUTHPROJECTION | PharmacyDispatchTruthProjection | projection | pharmacy | phase_6_pharmacy_loop | Pharmacy loop domain | phase-6-the-pharmacy-loop.md |
| OBJ_PHARMACYFENCEIMPACTDIGEST | PharmacyFenceImpactDigest | digest | staff_support_operations | cross_cutting_pharmacy_console | Staff, support, and operations control | pharmacy-console-frontend-architecture.md |
| OBJ_PHARMACYFENCEINVALIDATIONSIGNAL | PharmacyFenceInvalidationSignal | event_contract | staff_support_operations | cross_cutting_pharmacy_console | Staff, support, and operations control | pharmacy-console-frontend-architecture.md |
| OBJ_PHARMACYFENCESETTLEMENTWINDOW | PharmacyFenceSettlementWindow | other | staff_support_operations | cross_cutting_pharmacy_console | Staff, support, and operations control | pharmacy-console-frontend-architecture.md |
| OBJ_PHARMACYHANDOFFWATCHWINDOW | PharmacyHandoffWatchWindow | other | staff_support_operations | cross_cutting_pharmacy_console | Staff, support, and operations control | pharmacy-console-frontend-architecture.md |
| OBJ_PHARMACYINTENT | PharmacyIntent | descriptor | triage_human_checkpoint | phase_3_human_checkpoint | Triage domain | phase-3-the-human-checkpoint.md |
| OBJ_PHARMACYMISSIONTOKEN | PharmacyMissionToken | token | staff_support_operations | cross_cutting_pharmacy_console | Staff, support, and operations control | pharmacy-console-frontend-architecture.md |
| OBJ_PHARMACYOUTCOMEINGESTATTEMPT | PharmacyOutcomeIngestAttempt | record | pharmacy | phase_6_pharmacy_loop | Pharmacy loop domain | phase-6-the-pharmacy-loop.md |
| OBJ_PHARMACYOUTCOMEMILESTONE | PharmacyOutcomeMilestone | event_contract | unknown | forensic_patch_guidance | Programme architecture registry | forensic-audit-findings.md |
| OBJ_PHARMACYOUTCOMERECONCILIATIONGATE | PharmacyOutcomeReconciliationGate | gate | pharmacy | phase_6_pharmacy_loop | Pharmacy loop domain | phase-6-the-pharmacy-loop.md |
| OBJ_PHARMACYOUTCOMERECORD | PharmacyOutcomeRecord | record | pharmacy | phase_6_pharmacy_loop | Pharmacy loop domain | phase-6-the-pharmacy-loop.md |
| OBJ_PHARMACYOUTCOMESETTLEMENT | PharmacyOutcomeSettlement | settlement | pharmacy | phase_6_pharmacy_loop | Pharmacy loop domain | phase-6-the-pharmacy-loop.md |
| OBJ_PHARMACYOUTCOMETRUTHPROJECTION | PharmacyOutcomeTruthProjection | projection | pharmacy | phase_6_pharmacy_loop | Pharmacy loop domain | phase-6-the-pharmacy-loop.md |
| OBJ_PHARMACYOVERRIDEAUTHORITYPROOF | PharmacyOverrideAuthorityProof | other | staff_support_operations | cross_cutting_pharmacy_console | Staff, support, and operations control | pharmacy-console-frontend-architecture.md |
| OBJ_PHARMACYPROVIDER | PharmacyProvider | other | pharmacy | phase_6_pharmacy_loop | Pharmacy loop domain | phase-6-the-pharmacy-loop.md |
| OBJ_PHARMACYPROVIDERCAPABILITYSNAPSHOT | PharmacyProviderCapabilitySnapshot | record | pharmacy | phase_6_pharmacy_loop | Pharmacy loop domain | phase-6-the-pharmacy-loop.md |
| OBJ_PHARMACYREACHABILITYPLAN | PharmacyReachabilityPlan | other | pharmacy | phase_6_pharmacy_loop | Pharmacy loop domain | phase-6-the-pharmacy-loop.md |
| OBJ_PHARMACYREFERRALPACKAGE | PharmacyReferralPackage | bundle | pharmacy | phase_6_pharmacy_loop | Pharmacy loop domain | phase-6-the-pharmacy-loop.md |
| OBJ_PHARMACYREOPENSIGNAL | PharmacyReopenSignal | event_contract | unknown | forensic_patch_guidance | Programme architecture registry | forensic-audit-findings.md |
| OBJ_PHARMACYRULEPACK | PharmacyRulePack | bundle | pharmacy | phase_6_pharmacy_loop | Pharmacy loop domain | phase-6-the-pharmacy-loop.md |
| OBJ_PHARMACYSETTLEMENTVISIBILITYDIGEST | PharmacySettlementVisibilityDigest | digest | staff_support_operations | cross_cutting_pharmacy_console | Staff, support, and operations control | pharmacy-console-frontend-architecture.md |
| OBJ_PHARMACYSURFACEPOSTURE | PharmacySurfacePosture | other | staff_support_operations | cross_cutting_pharmacy_console | Staff, support, and operations control | pharmacy-console-frontend-architecture.md |
| OBJ_PHASECONFORMANCEROW | PhaseConformanceRow | other | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_PIPELINEEMERGENCYEXCEPTION | PipelineEmergencyException | other | runtime_release | cross_cutting_runtime_release | Runtime publication control plane | platform-runtime-and-release-blueprint.md |
| OBJ_PIPELINEEXECUTIONRECORD | PipelineExecutionRecord | record | runtime_release | cross_cutting_runtime_release | Runtime publication control plane | platform-runtime-and-release-blueprint.md |
| OBJ_PIPELINESTAGESETTLEMENT | PipelineStageSettlement | settlement | runtime_release | cross_cutting_runtime_release | Runtime publication control plane | platform-runtime-and-release-blueprint.md |
| OBJ_POLICYCOMPATIBILITYALERT | PolicyCompatibilityAlert | other | platform_configuration | cross_cutting_platform_admin | Platform administration and configuration | platform-admin-and-config-blueprint.md |
| OBJ_POLICYPACKVERSION | PolicyPackVersion | other | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_POSTAUTHRETURNINTENT | PostAuthReturnIntent | other | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_POSTINCIDENTREVIEW | PostIncidentReview | record | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_PRACTICEACKNOWLEDGEMENTRECORD | PracticeAcknowledgementRecord | record | hub_coordination | phase_5_network_horizon | Hub coordination domain | phase-5-the-network-horizon.md |
| OBJ_PRACTICECONTINUITYMESSAGE | PracticeContinuityMessage | other | hub_coordination | phase_5_network_horizon | Hub coordination domain | phase-5-the-network-horizon.md |
| OBJ_PRACTICEVISIBILITYDELTARECORD | PracticeVisibilityDeltaRecord | record | hub_coordination | phase_5_network_horizon | Hub coordination domain | phase-5-the-network-horizon.md |
| OBJ_PRACTICEVISIBILITYPROJECTION | PracticeVisibilityProjection | projection | hub_coordination | phase_5_network_horizon | Hub coordination domain | phase-5-the-network-horizon.md |
| OBJ_PREVIEWVISIBILITYCONTRACT | PreviewVisibilityContract | contract | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_PRIMARYREGIONBINDING | PrimaryRegionBinding | descriptor | frontend_runtime | cross_cutting_ux_redesign | Frontend continuity runtime | ux-quiet-clarity-redesign.md |
| OBJ_PROFILESELECTIONRESOLUTION | ProfileSelectionResolution | other | runtime_release | cross_cutting_runtime_release | Runtime publication control plane | platform-runtime-and-release-blueprint.md |
| OBJ_PROJECTIONACTIONSET | ProjectionActionSet | other | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_PROJECTIONBACKFILLEXECUTIONLEDGER | ProjectionBackfillExecutionLedger | other | platform_configuration | cross_cutting_platform_admin | Platform administration and configuration | platform-admin-and-config-blueprint.md |
| OBJ_PROJECTIONCONTRACTFAMILY | ProjectionContractFamily | descriptor | runtime_release | cross_cutting_runtime_release | Runtime publication control plane | platform-runtime-and-release-blueprint.md |
| OBJ_PROJECTIONCONTRACTVERSION | ProjectionContractVersion | descriptor | runtime_release | cross_cutting_runtime_release | Runtime publication control plane | platform-runtime-and-release-blueprint.md |
| OBJ_PROJECTIONCONTRACTVERSIONSET | ProjectionContractVersionSet | bundle | runtime_release | cross_cutting_runtime_release | Runtime publication control plane | platform-runtime-and-release-blueprint.md |
| OBJ_PROJECTIONFRESHNESSENVELOPE | ProjectionFreshnessEnvelope | record | foundation_runtime_experience | phase_0_foundation | Frontend continuity runtime | phase-0-the-foundation-protocol.md |
| OBJ_PROJECTIONHEALTHSNAPSHOT | ProjectionHealthSnapshot | record | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_PROJECTIONREADINESSFENCE | ProjectionReadinessFence | gate | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_PROJECTIONSUBSCRIPTION | ProjectionSubscription | other | foundation_runtime_experience | phase_0_foundation | Frontend continuity runtime | phase-0-the-foundation-protocol.md |
| OBJ_PROMOTIONINTENTENVELOPE | PromotionIntentEnvelope | record | runtime_release | cross_cutting_runtime_release | Runtime publication control plane | platform-runtime-and-release-blueprint.md |
| OBJ_PROMPTTEMPLATEVERSION | PromptTemplateVersion | other | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_PROTECTEDCOMPOSITIONSTATE | ProtectedCompositionState | descriptor | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_PROVIDERCAPABILITYMATRIX | ProviderCapabilityMatrix | descriptor | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_PROVIDERSEARCHSLICE | ProviderSearchSlice | other | booking | phase_4_booking_engine | Booking domain | phase-4-the-booking-engine.md |
| OBJ_QUESTIONSETRECOMMENDATION | QuestionSetRecommendation | other | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_QUEUEANCHORLEASE | QueueAnchorLease | lease | staff_support_operations | cross_cutting_pharmacy_console | Staff, support, and operations control | pharmacy-console-frontend-architecture.md |
| OBJ_QUEUEASSIGNMENTSUGGESTIONSNAPSHOT | QueueAssignmentSuggestionSnapshot | record | foundation_runtime_experience | phase_0_foundation | Frontend continuity runtime | phase-0-the-foundation-protocol.md |
| OBJ_QUEUECHANGEBATCH | QueueChangeBatch | other | foundation_runtime_experience | phase_0_foundation | Frontend continuity runtime | phase-0-the-foundation-protocol.md |
| OBJ_QUEUEHEALTHSNAPSHOT | QueueHealthSnapshot | record | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_QUEUELENS | QueueLens | other | foundation_runtime_experience | phase_0_foundation | Frontend continuity runtime | phase-0-the-foundation-protocol.md |
| OBJ_QUEUEPREVIEWDIGEST | QueuePreviewDigest | digest | staff_support_operations | cross_cutting_staff_workspace | Staff, support, and operations control | staff-workspace-interface-architecture.md |
| OBJ_QUEUERANKENTRY | QueueRankEntry | other | foundation_runtime_experience | phase_0_foundation | Frontend continuity runtime | phase-0-the-foundation-protocol.md |
| OBJ_QUEUERANKINGCOORDINATOR | QueueRankingCoordinator | other | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_QUEUERANKPLAN | QueueRankPlan | other | foundation_runtime_experience | phase_0_foundation | Frontend continuity runtime | phase-0-the-foundation-protocol.md |
| OBJ_QUEUERANKSNAPSHOT | QueueRankSnapshot | record | foundation_runtime_experience | phase_0_foundation | Frontend continuity runtime | phase-0-the-foundation-protocol.md |
| OBJ_QUEUEROWPRESENTATIONCONTRACT | QueueRowPresentationContract | contract | staff_support_operations | cross_cutting_staff_workspace | Staff, support, and operations control | staff-workspace-interface-architecture.md |
| OBJ_QUEUESCANSESSION | QueueScanSession | other | staff_support_operations | cross_cutting_staff_workspace | Staff, support, and operations control | staff-workspace-interface-architecture.md |
| OBJ_QUEUEWORKBENCHPROJECTION | QueueWorkbenchProjection | projection | staff_support_operations | cross_cutting_staff_workspace | Staff, support, and operations control | staff-workspace-interface-architecture.md |
| OBJ_QUIETCLARITYBINDING | QuietClarityBinding | descriptor | frontend_runtime | cross_cutting_ux_redesign | Frontend continuity runtime | ux-quiet-clarity-redesign.md |
| OBJ_QUIETCLARITYELIGIBILITYGATE | QuietClarityEligibilityGate | gate | frontend_runtime | cross_cutting_ux_redesign | Frontend continuity runtime | ux-quiet-clarity-redesign.md |
| OBJ_QUIETSETTLEMENTENVELOPE | QuietSettlementEnvelope | record | frontend_runtime | cross_cutting_ux_redesign | Frontend continuity runtime | ux-quiet-clarity-redesign.md |
| OBJ_QUIETWORKPROTECTIONLEASE | QuietWorkProtectionLease | lease | frontend_runtime | cross_cutting_ux_redesign | Frontend continuity runtime | ux-quiet-clarity-redesign.md |
| OBJ_RAPIDENTRYDRAFT | RapidEntryDraft | other | staff_support_operations | cross_cutting_staff_workspace | Staff, support, and operations control | staff-workspace-interface-architecture.md |
| OBJ_REACHABILITYASSESSMENTRECORD | ReachabilityAssessmentRecord | record | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_REACHABILITYDEPENDENCY | ReachabilityDependency | blocker | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_REACHABILITYGOVERNOR | ReachabilityGovernor | other | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_REACHABILITYOBSERVATION | ReachabilityObservation | other | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_READINESSARTIFACT | ReadinessArtifact | artifact | runtime_release | cross_cutting_runtime_release | Runtime publication control plane | platform-runtime-and-release-blueprint.md |
| OBJ_READPATHCOMPATIBILITYDIGEST | ReadPathCompatibilityDigest | digest | platform_configuration | cross_cutting_platform_admin | Platform administration and configuration | platform-admin-and-config-blueprint.md |
| OBJ_RECORDACTIONCONTEXTTOKEN | RecordActionContextToken | token | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_RECORDARTIFACTPARITYWITNESS | RecordArtifactParityWitness | witness | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_RECORDORIGINCONTINUATIONENVELOPE | RecordOriginContinuationEnvelope | record | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_RECORDPLACEHOLDERPROJECTION | RecordPlaceholderProjection | projection | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_RECORDRELEASEGATE | RecordReleaseGate | gate | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_RECORDSTEPUPCHECKPOINT | RecordStepUpCheckpoint | checkpoint | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_RECORDVISIBILITYENVELOPE | RecordVisibilityEnvelope | record | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_RECOVERYCONTINUATIONTOKEN | RecoveryContinuationToken | token | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_RECOVERYCONTROLPOSTURE | RecoveryControlPosture | other | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_RECOVERYEVIDENCEARTIFACT | RecoveryEvidenceArtifact | artifact | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_RECOVERYEVIDENCEPACK | RecoveryEvidencePack | bundle | audited_flow_gap | phase_9_assurance_ledger | Cross-phase gap register | phase-9-the-assurance-ledger.md |
| OBJ_RECOVERYREDACTIONFENCE | RecoveryRedactionFence | gate | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_RECOVERYTIER | RecoveryTier | other | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_REDUCEDMOTIONPROFILE | ReducedMotionProfile | descriptor | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_REFERRALARTIFACTMANIFEST | ReferralArtifactManifest | manifest | pharmacy | phase_6_pharmacy_loop | Pharmacy loop domain | phase-6-the-pharmacy-loop.md |
| OBJ_REGIONPLACEHOLDERCONTRACT | RegionPlaceholderContract | contract | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_RELEASEAPPROVALFREEZE | ReleaseApprovalFreeze | gate | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_RELEASEAPPROVALGRAPH | ReleaseApprovalGraph | other | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_RELEASECONTRACTVERIFICATIONMATRIX | ReleaseContractVerificationMatrix | other | runtime_release | cross_cutting_runtime_release | Runtime publication control plane | platform-runtime-and-release-blueprint.md |
| OBJ_RELEASEGUARDRAILDIGEST | ReleaseGuardrailDigest | digest | staff_support_operations | cross_cutting_operations_console | Staff, support, and operations control | operations-console-frontend-blueprint.md |
| OBJ_RELEASEGUARDRAILPOLICY | ReleaseGuardrailPolicy | policy | unknown | phase_7_embedded_channel_deferred | Programme architecture registry | phase-7-inside-the-nhs-app.md |
| OBJ_RELEASEGUARDTHRESHOLD | ReleaseGuardThreshold | other | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_RELEASEPUBLICATIONPARITYRECORD | ReleasePublicationParityRecord | record | runtime_release | cross_cutting_runtime_release | Runtime publication control plane | platform-runtime-and-release-blueprint.md |
| OBJ_RELEASERECOVERYDISPOSITION | ReleaseRecoveryDisposition | record | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_RELEASETOBAURECORD | ReleaseToBAURecord | record | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_RELEASETRUSTFREEZEVERDICT | ReleaseTrustFreezeVerdict | witness | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_RELEASEWATCHEVIDENCECOCKPIT | ReleaseWatchEvidenceCockpit | other | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_REPLAYCOLLISIONREVIEW | ReplayCollisionReview | other | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_REPLAYEVIDENCEPOLICY | ReplayEvidencePolicy | policy | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_REPORTABILITYASSESSMENT | ReportabilityAssessment | record | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_REQUEST | Request | aggregate | foundation_control_plane | phase_0_foundation | Foundation control plane | phase-0-the-foundation-protocol.md |
| OBJ_REQUESTCLOSURERECORD | RequestClosureRecord | record | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_REQUESTLIFECYCLELEASE | RequestLifecycleLease | lease | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_REQUESTLINEAGE | RequestLineage | aggregate | foundation_control_plane | phase_0_foundation | Foundation control plane | phase-0-the-foundation-protocol.md |
| OBJ_RESERVATIONAUTHORITY | ReservationAuthority | other | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_RESERVATIONTRUTHPROJECTION | ReservationTruthProjection | projection | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_RESILIENCEACTIONRECORD | ResilienceActionRecord | record | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_RESILIENCEACTIONSETTLEMENT | ResilienceActionSettlement | settlement | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_RESILIENCEORCHESTRATOR | ResilienceOrchestrator | other | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_RESILIENCESURFACERUNTIMEBINDING | ResilienceSurfaceRuntimeBinding | descriptor | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_RESPONSEASSIMILATIONRECORD | ResponseAssimilationRecord | record | triage_human_checkpoint | phase_3_human_checkpoint | Triage domain | phase-3-the-human-checkpoint.md |
| OBJ_RESPONSIVEDIMENSIONTOKENSET | ResponsiveDimensionTokenSet | other | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_RESPONSIVENESSLEDGER | ResponsivenessLedger | other | foundation_runtime_experience | phase_0_foundation | Frontend continuity runtime | phase-0-the-foundation-protocol.md |
| OBJ_RESPONSIVEVIEWPORTPROFILE | ResponsiveViewportProfile | descriptor | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_RESTORERUN | RestoreRun | other | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_RETENTIONCLASS | RetentionClass | other | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_RETENTIONDECISION | RetentionDecision | record | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_RETENTIONENVELOPE | RetentionEnvelope | record | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_RETENTIONLIFECYCLEBINDING | RetentionLifecycleBinding | descriptor | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_RETURNINTENT | ReturnIntent | other | unknown | phase_7_embedded_channel_deferred | Programme architecture registry | phase-7-inside-the-nhs-app.md |
| OBJ_REVIEWACTIONLEASE | ReviewActionLease | lease | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_REVIEWBASELINESNAPSHOT | ReviewBaselineSnapshot | record | triage_human_checkpoint | phase_3_human_checkpoint | Triage domain | phase-3-the-human-checkpoint.md |
| OBJ_REVIEWBUNDLE | ReviewBundle | bundle | triage_human_checkpoint | phase_3_human_checkpoint | Triage domain | phase-3-the-human-checkpoint.md |
| OBJ_REVIEWSESSION | ReviewSession | other | triage_human_checkpoint | phase_3_human_checkpoint | Triage domain | phase-3-the-human-checkpoint.md |
| OBJ_REVIEWSESSIONLEASE | ReviewSessionLease | lease | triage_human_checkpoint | phase_3_human_checkpoint | Triage domain | phase-3-the-human-checkpoint.md |
| OBJ_RFCBUNDLE | RFCBundle | bundle | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_RISKSIGNAL | RiskSignal | event_contract | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_ROLLBACKREADINESSBUNDLE | RollbackReadinessBundle | bundle | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_ROUTEADJACENCYCONTRACT | RouteAdjacencyContract | contract | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_ROUTECONTINUITYEVIDENCECONTRACT | RouteContinuityEvidenceContract | contract | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_ROUTEFAMILYOWNERSHIPCLAIM | RouteFamilyOwnershipClaim | other | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_ROUTEFREEZEDISPOSITION | RouteFreezeDisposition | record | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_ROUTEINTENTBINDING | RouteIntentBinding | descriptor | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_ROUTEMORPHOLOGYDESCRIPTOR | RouteMorphologyDescriptor | descriptor | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_RULEGUARDRESULT | RuleGuardResult | other | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_RUNBOOKBINDINGRECORD | RunbookBindingRecord | record | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_RUNBOOKBUNDLE | RunbookBundle | bundle | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_RUNTIMECONTRACTPUBLISHER | RuntimeContractPublisher | other | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_RUNTIMEPUBLICATIONBUNDLE | RuntimePublicationBundle | bundle | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_RUNTIMETOPOLOGYMANIFEST | RuntimeTopologyManifest | manifest | runtime_release | cross_cutting_runtime_release | Runtime publication control plane | platform-runtime-and-release-blueprint.md |
| OBJ_SAFETYCASEDELTA | SafetyCaseDelta | other | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_SAFETYDECISIONRECORD | SafetyDecisionRecord | record | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_SAFETYORCHESTRATOR | SafetyOrchestrator | other | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_SAFETYPREEMPTIONRECORD | SafetyPreemptionRecord | record | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_SCALBUNDLE | SCALBundle | bundle | unknown | phase_7_embedded_channel_deferred | Programme architecture registry | phase-7-inside-the-nhs-app.md |
| OBJ_SCOPEDMUTATIONGATE | ScopedMutationGate | gate | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_SEARCHPOLICY | SearchPolicy | policy | booking | phase_4_booking_engine | Booking domain | phase-4-the-booking-engine.md |
| OBJ_SECTIONVISIBILITYCONTRACT | SectionVisibilityContract | contract | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_SECURELINKREISSUERECORD | SecureLinkReissueRecord | record | staff_support_operations | cross_cutting_staff_operations_support | Staff, support, and operations control | staff-operations-and-support-blueprint.md |
| OBJ_SECURITYINCIDENT | SecurityIncident | case | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_SELECTEDANCHOR | SelectedAnchor | other | foundation_runtime_experience | phase_0_foundation | Frontend continuity runtime | phase-0-the-foundation-protocol.md |
| OBJ_SELECTEDANCHORPOLICY | SelectedAnchorPolicy | policy | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_SELECTEDANCHORPRESERVER | SelectedAnchorPreserver | other | foundation_runtime_experience | phase_0_foundation | Frontend continuity runtime | phase-0-the-foundation-protocol.md |
| OBJ_SELECTEDOBJECTANCHOR | SelectedObjectAnchor | other | frontend_runtime | cross_cutting_ux_redesign | Frontend continuity runtime | ux-quiet-clarity-redesign.md |
| OBJ_SELFCAREBOUNDARYDECISION | SelfCareBoundaryDecision | record | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_SELFCAREBOUNDARYDIGEST | SelfCareBoundaryDigest | digest | staff_support_operations | cross_cutting_staff_workspace | Staff, support, and operations control | staff-workspace-interface-architecture.md |
| OBJ_SELFCAREEXPERIENCEPROJECTION | SelfCareExperienceProjection | projection | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_SERVICEHEALTHCELLPROJECTION | ServiceHealthCellProjection | projection | staff_support_operations | cross_cutting_operations_console | Staff, support, and operations control | operations-console-frontend-blueprint.md |
| OBJ_SERVICEREQUEST | ServiceRequest | other | unknown | audited_flow_baseline | Programme architecture registry | vecells-complete-end-to-end-flow.md |
| OBJ_SERVICETYPEDECISION | ServiceTypeDecision | record | pharmacy | phase_6_pharmacy_loop | Pharmacy loop domain | phase-6-the-pharmacy-loop.md |
| OBJ_SESSION | Session | other | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_SESSIONESTABLISHMENTDECISION | SessionEstablishmentDecision | record | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_SESSIONGOVERNOR | SessionGovernor | other | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_SESSIONMERGEDECISION | SessionMergeDecision | record | unknown | phase_7_embedded_channel_deferred | Programme architecture registry | phase-7-inside-the-nhs-app.md |
| OBJ_SESSIONMERGEPOLICY | SessionMergePolicy | policy | unknown | phase_7_embedded_channel_deferred | Programme architecture registry | phase-7-inside-the-nhs-app.md |
| OBJ_SESSIONTERMINATIONSETTLEMENT | SessionTerminationSettlement | settlement | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_SHADOWCOMPARISONRUN | ShadowComparisonRun | other | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_SHELLBOUNDARYDECISION | ShellBoundaryDecision | record | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_SHELLCONTINUITYFRAME | ShellContinuityFrame | descriptor | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_SHELLFAMILYOWNERSHIPCONTRACT | ShellFamilyOwnershipContract | contract | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_SHELLNAVIGATIONMANIFEST | ShellNavigationManifest | manifest | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_SHELLPOLICY | ShellPolicy | policy | unknown | phase_7_embedded_channel_deferred | Programme architecture registry | phase-7-inside-the-nhs-app.md |
| OBJ_SHELLRESPONSIVEPROFILE | ShellResponsiveProfile | descriptor | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_SHELLSCOPEDESCRIPTOR | ShellScopeDescriptor | descriptor | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_SHELLVISUALPROFILE | ShellVisualProfile | descriptor | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_SITELINKMANIFEST | SiteLinkManifest | manifest | unknown | phase_7_embedded_channel_deferred | Programme architecture registry | phase-7-inside-the-nhs-app.md |
| OBJ_SLOPROFILE | SLOProfile | descriptor | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_SLOTSEARCHSESSION | SlotSearchSession | other | booking | phase_4_booking_engine | Booking domain | phase-4-the-booking-engine.md |
| OBJ_SLOTSETSNAPSHOT | SlotSetSnapshot | record | booking | phase_4_booking_engine | Booking domain | phase-4-the-booking-engine.md |
| OBJ_SLOTSNAPSHOTRECOVERYSTATE | SlotSnapshotRecoveryState | descriptor | booking | phase_4_booking_engine | Booking domain | phase-4-the-booking-engine.md |
| OBJ_SNAPSHOTCANDIDATEINDEX | SnapshotCandidateIndex | other | booking | phase_4_booking_engine | Booking domain | phase-4-the-booking-engine.md |
| OBJ_SPEAKERSEGMENT | SpeakerSegment | other | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_SSOENTRYGRANT | SSOEntryGrant | grant | unknown | phase_7_embedded_channel_deferred | Programme architecture registry | phase-7-inside-the-nhs-app.md |
| OBJ_SSORETURNDISPOSITION | SSOReturnDisposition | record | unknown | phase_7_embedded_channel_deferred | Programme architecture registry | phase-7-inside-the-nhs-app.md |
| OBJ_STAFFAUDIENCECOVERAGEPROJECTION | StaffAudienceCoverageProjection | projection | staff_support_operations | cross_cutting_staff_operations_support | Staff, support, and operations control | staff-operations-and-support-blueprint.md |
| OBJ_STAFFIDENTITYCONTEXT | StaffIdentityContext | other | hub_coordination | phase_5_network_horizon | Hub coordination domain | phase-5-the-network-horizon.md |
| OBJ_STAFFWORKSPACECONSISTENCYPROJECTION | StaffWorkspaceConsistencyProjection | projection | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_STALEOWNERSHIPRECOVERYRECORD | StaleOwnershipRecoveryRecord | record | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_STANDALONESHELL | StandaloneShell | other | unknown | phase_7_embedded_channel_deferred | Programme architecture registry | phase-7-inside-the-nhs-app.md |
| OBJ_STANDARDSBASELINEMAP | StandardsBaselineMap | other | platform_configuration | cross_cutting_platform_admin | Platform administration and configuration | platform-admin-and-config-blueprint.md |
| OBJ_STANDARDSCHANGENOTICE | StandardsChangeNotice | other | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_STANDARDSDEPENDENCYWATCHLIST | StandardsDependencyWatchlist | other | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_STANDARDSEXCEPTIONRECORD | StandardsExceptionRecord | record | platform_configuration | cross_cutting_platform_admin | Platform administration and configuration | platform-admin-and-config-blueprint.md |
| OBJ_STANDARDSVERSIONMAP | StandardsVersionMap | other | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_STATEBRAID | StateBraid | other | foundation_runtime_experience | phase_0_foundation | Frontend continuity runtime | phase-0-the-foundation-protocol.md |
| OBJ_STATUSACKNOWLEDGEMENTSCOPE | StatusAcknowledgementScope | other | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_STATUSARBITRATIONDECISION | StatusArbitrationDecision | record | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_STATUSCUERECORD | StatusCueRecord | record | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_STATUSCUESETTLEMENT | StatusCueSettlement | settlement | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_STATUSPRESENTATIONCONTRACT | StatusPresentationContract | contract | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_STATUSSTRIPAUTHORITY | StatusStripAuthority | other | frontend_runtime | cross_cutting_ux_redesign | Frontend continuity runtime | ux-quiet-clarity-redesign.md |
| OBJ_STATUSSUPPRESSIONLEDGER | StatusSuppressionLedger | other | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_STICKYACTIONDOCKCONTRACT | StickyActionDockContract | contract | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_SUBMISSIONENVELOPE | SubmissionEnvelope | aggregate | foundation_control_plane | phase_0_foundation | Foundation control plane | phase-0-the-foundation-protocol.md |
| OBJ_SUBMISSIONPROMOTIONRECORD | SubmissionPromotionRecord | record | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_SUBPROCESSORASSURANCEREF | SubprocessorAssuranceRef | other | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_SUGGESTIONACTIONRECORD | SuggestionActionRecord | record | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_SUGGESTIONACTIONSETTLEMENT | SuggestionActionSettlement | settlement | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_SUGGESTIONDRAFTINSERTIONLEASE | SuggestionDraftInsertionLease | lease | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_SUGGESTIONENVELOPE | SuggestionEnvelope | record | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_SUGGESTIONPRESENTATIONARTIFACT | SuggestionPresentationArtifact | artifact | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_SUGGESTIONSURFACEBINDING | SuggestionSurfaceBinding | descriptor | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_SUPPLYCOMPUTATION | SupplyComputation | other | staff_support_operations | cross_cutting_pharmacy_console | Staff, support, and operations control | pharmacy-console-frontend-architecture.md |
| OBJ_SUPPORTACTIONLEASE | SupportActionLease | lease | staff_support_operations | cross_cutting_staff_operations_support | Staff, support, and operations control | staff-operations-and-support-blueprint.md |
| OBJ_SUPPORTACTIONRECORD | SupportActionRecord | record | staff_support_operations | cross_cutting_staff_operations_support | Staff, support, and operations control | staff-operations-and-support-blueprint.md |
| OBJ_SUPPORTACTIONSETTLEMENT | SupportActionSettlement | settlement | staff_support_operations | cross_cutting_staff_operations_support | Staff, support, and operations control | staff-operations-and-support-blueprint.md |
| OBJ_SUPPORTACTIONWORKBENCHPROJECTION | SupportActionWorkbenchProjection | projection | staff_support_operations | cross_cutting_staff_operations_support | Staff, support, and operations control | staff-operations-and-support-blueprint.md |
| OBJ_SUPPORTCONTEXTDISCLOSURERECORD | SupportContextDisclosureRecord | record | staff_support_operations | cross_cutting_staff_operations_support | Staff, support, and operations control | staff-operations-and-support-blueprint.md |
| OBJ_SUPPORTCONTINUITYEVIDENCEPROJECTION | SupportContinuityEvidenceProjection | projection | staff_support_operations | cross_cutting_staff_operations_support | Staff, support, and operations control | staff-operations-and-support-blueprint.md |
| OBJ_SUPPORTKNOWLEDGEASSISTLEASE | SupportKnowledgeAssistLease | lease | staff_support_operations | cross_cutting_staff_operations_support | Staff, support, and operations control | staff-operations-and-support-blueprint.md |
| OBJ_SUPPORTKNOWLEDGEBINDING | SupportKnowledgeBinding | descriptor | staff_support_operations | cross_cutting_staff_operations_support | Staff, support, and operations control | staff-operations-and-support-blueprint.md |
| OBJ_SUPPORTKNOWLEDGEGAPRECORD | SupportKnowledgeGapRecord | record | staff_support_operations | cross_cutting_staff_operations_support | Staff, support, and operations control | staff-operations-and-support-blueprint.md |
| OBJ_SUPPORTKNOWLEDGESTACKPROJECTION | SupportKnowledgeStackProjection | projection | staff_support_operations | cross_cutting_staff_operations_support | Staff, support, and operations control | staff-operations-and-support-blueprint.md |
| OBJ_SUPPORTLINEAGEARTIFACTBINDING | SupportLineageArtifactBinding | descriptor | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_SUPPORTLINEAGEBINDING | SupportLineageBinding | descriptor | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_SUPPORTLINEAGESCOPEMEMBER | SupportLineageScopeMember | other | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_SUPPORTMUTATIONATTEMPT | SupportMutationAttempt | record | staff_support_operations | cross_cutting_staff_operations_support | Staff, support, and operations control | staff-operations-and-support-blueprint.md |
| OBJ_SUPPORTOBSERVESESSION | SupportObserveSession | other | staff_support_operations | cross_cutting_staff_operations_support | Staff, support, and operations control | staff-operations-and-support-blueprint.md |
| OBJ_SUPPORTOMNICHANNELTIMELINEPROJECTION | SupportOmnichannelTimelineProjection | projection | staff_support_operations | cross_cutting_staff_operations_support | Staff, support, and operations control | staff-operations-and-support-blueprint.md |
| OBJ_SUPPORTOWNERSHIPTRANSFERRECORD | SupportOwnershipTransferRecord | record | staff_support_operations | cross_cutting_staff_operations_support | Staff, support, and operations control | staff-operations-and-support-blueprint.md |
| OBJ_SUPPORTPRESENTATIONARTIFACT | SupportPresentationArtifact | artifact | staff_support_operations | cross_cutting_staff_operations_support | Staff, support, and operations control | staff-operations-and-support-blueprint.md |
| OBJ_SUPPORTREACHABILITYPOSTUREPROJECTION | SupportReachabilityPostureProjection | projection | staff_support_operations | cross_cutting_staff_operations_support | Staff, support, and operations control | staff-operations-and-support-blueprint.md |
| OBJ_SUPPORTREADONLYFALLBACKPROJECTION | SupportReadOnlyFallbackProjection | projection | staff_support_operations | cross_cutting_staff_operations_support | Staff, support, and operations control | staff-operations-and-support-blueprint.md |
| OBJ_SUPPORTREPLAYCHECKPOINT | SupportReplayCheckpoint | checkpoint | staff_support_operations | cross_cutting_staff_operations_support | Staff, support, and operations control | staff-operations-and-support-blueprint.md |
| OBJ_SUPPORTREPLAYDELTAREVIEW | SupportReplayDeltaReview | other | staff_support_operations | cross_cutting_staff_operations_support | Staff, support, and operations control | staff-operations-and-support-blueprint.md |
| OBJ_SUPPORTREPLAYDRAFTHOLD | SupportReplayDraftHold | other | staff_support_operations | cross_cutting_staff_operations_support | Staff, support, and operations control | staff-operations-and-support-blueprint.md |
| OBJ_SUPPORTREPLAYESCALATIONINTENT | SupportReplayEscalationIntent | other | staff_support_operations | cross_cutting_staff_operations_support | Staff, support, and operations control | staff-operations-and-support-blueprint.md |
| OBJ_SUPPORTREPLAYEVIDENCEBOUNDARY | SupportReplayEvidenceBoundary | other | staff_support_operations | cross_cutting_staff_operations_support | Staff, support, and operations control | staff-operations-and-support-blueprint.md |
| OBJ_SUPPORTREPLAYRELEASEDECISION | SupportReplayReleaseDecision | record | staff_support_operations | cross_cutting_staff_operations_support | Staff, support, and operations control | staff-operations-and-support-blueprint.md |
| OBJ_SUPPORTREPLAYRESTORESETTLEMENT | SupportReplayRestoreSettlement | settlement | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_SUPPORTREPLAYSESSION | SupportReplaySession | other | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_SUPPORTRESOLUTIONSNAPSHOT | SupportResolutionSnapshot | record | staff_support_operations | cross_cutting_staff_operations_support | Staff, support, and operations control | staff-operations-and-support-blueprint.md |
| OBJ_SUPPORTROUTEINTENTTOKEN | SupportRouteIntentToken | token | staff_support_operations | cross_cutting_staff_operations_support | Staff, support, and operations control | staff-operations-and-support-blueprint.md |
| OBJ_SUPPORTSUBJECT360PROJECTION | SupportSubject360Projection | projection | staff_support_operations | cross_cutting_staff_operations_support | Staff, support, and operations control | staff-operations-and-support-blueprint.md |
| OBJ_SUPPORTSUBJECTCONTEXTBINDING | SupportSubjectContextBinding | descriptor | staff_support_operations | cross_cutting_staff_operations_support | Staff, support, and operations control | staff-operations-and-support-blueprint.md |
| OBJ_SUPPORTSURFACEPOSTURE | SupportSurfacePosture | other | staff_support_operations | cross_cutting_staff_operations_support | Staff, support, and operations control | staff-operations-and-support-blueprint.md |
| OBJ_SUPPORTSURFACERUNTIMEBINDING | SupportSurfaceRuntimeBinding | descriptor | staff_support_operations | cross_cutting_staff_operations_support | Staff, support, and operations control | staff-operations-and-support-blueprint.md |
| OBJ_SUPPORTTICKET | SupportTicket | other | staff_support_operations | cross_cutting_staff_operations_support | Staff, support, and operations control | staff-operations-and-support-blueprint.md |
| OBJ_SUPPORTTICKETWORKSPACEPROJECTION | SupportTicketWorkspaceProjection | projection | staff_support_operations | cross_cutting_staff_operations_support | Staff, support, and operations control | staff-operations-and-support-blueprint.md |
| OBJ_SUPPORTTRANSFERACCEPTANCESETTLEMENT | SupportTransferAcceptanceSettlement | settlement | staff_support_operations | cross_cutting_staff_operations_support | Staff, support, and operations control | staff-operations-and-support-blueprint.md |
| OBJ_SURFACEHYDRATIONCONTRACT | SurfaceHydrationContract | contract | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_SURFACEPOSTUREFRAME | SurfacePostureFrame | other | foundation_runtime_experience | phase_0_foundation | Frontend continuity runtime | phase-0-the-foundation-protocol.md |
| OBJ_SURFACEPOSTUREGOVERNOR | SurfacePostureGovernor | other | foundation_runtime_experience | phase_0_foundation | Frontend continuity runtime | phase-0-the-foundation-protocol.md |
| OBJ_SURFACESTATECONTRACT | SurfaceStateContract | contract | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_SURFACESTATEKERNELBINDING | SurfaceStateKernelBinding | descriptor | runtime_release | cross_cutting_runtime_release | Runtime publication control plane | platform-runtime-and-release-blueprint.md |
| OBJ_SURFACESTATESEMANTICSPROFILE | SurfaceStateSemanticsProfile | descriptor | frontend_runtime | cross_cutting_ui_contract | Frontend continuity runtime | canonical-ui-contract-kernel.md |
| OBJ_SYNTHETICRECOVERYCOVERAGERECORD | SyntheticRecoveryCoverageRecord | record | runtime_release | cross_cutting_runtime_release | Runtime publication control plane | platform-runtime-and-release-blueprint.md |
| OBJ_TASK | Task | other | unknown | audited_flow_baseline | Programme architecture registry | vecells-complete-end-to-end-flow.md |
| OBJ_TASKCANVASFRAME | TaskCanvasFrame | other | staff_support_operations | cross_cutting_staff_workspace | Staff, support, and operations control | staff-workspace-interface-architecture.md |
| OBJ_TASKCOMMANDSETTLEMENT | TaskCommandSettlement | settlement | triage_human_checkpoint | phase_3_human_checkpoint | Triage domain | phase-3-the-human-checkpoint.md |
| OBJ_TASKCOMPLETIONSETTLEMENTENVELOPE | TaskCompletionSettlementEnvelope | record | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_TASKLAUNCHCONTEXT | TaskLaunchContext | other | triage_human_checkpoint | phase_3_human_checkpoint | Triage domain | phase-3-the-human-checkpoint.md |
| OBJ_TASKWORKSPACEPROJECTION | TaskWorkspaceProjection | projection | staff_support_operations | cross_cutting_staff_workspace | Staff, support, and operations control | staff-workspace-interface-architecture.md |
| OBJ_TELEMETRYBINDINGPROFILE | TelemetryBindingProfile | descriptor | frontend_runtime | cross_cutting_ui_contract | Frontend continuity runtime | canonical-ui-contract-kernel.md |
| OBJ_TELEMETRYEVENTCONTRACT | TelemetryEventContract | contract | unknown | phase_7_embedded_channel_deferred | Programme architecture registry | phase-7-inside-the-nhs-app.md |
| OBJ_TELEPHONYCONTINUATIONCONTEXT | TelephonyContinuationContext | other | unknown | phase_2_identity_and_echoes | Programme architecture registry | phase-2-identity-and-echoes.md |
| OBJ_TELEPHONYCONTINUATIONELIGIBILITY | TelephonyContinuationEligibility | other | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_TELEPHONYEVIDENCEREADINESSASSESSMENT | TelephonyEvidenceReadinessAssessment | record | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_TELEPHONYMANUALREVIEWDISPOSITION | TelephonyManualReviewDisposition | record | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_TELEPHONYTRANSCRIPTREADINESSRECORD | TelephonyTranscriptReadinessRecord | record | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_TELEPHONYURGENTLIVEASSESSMENT | TelephonyUrgentLiveAssessment | record | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_TEMPLATEPOLICYIMPACTDIGEST | TemplatePolicyImpactDigest | digest | platform_configuration | cross_cutting_platform_admin | Platform administration and configuration | platform-admin-and-config-blueprint.md |
| OBJ_TEMPORALNORMALIZATIONENVELOPE | TemporalNormalizationEnvelope | record | booking | phase_4_booking_engine | Booking domain | phase-4-the-booking-engine.md |
| OBJ_TENANTBASELINEPROFILE | TenantBaselineProfile | descriptor | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_THREADEXPECTATIONENVELOPE | ThreadExpectationEnvelope | record | callback_messaging | cross_cutting_callback_and_messaging | Callback and messaging domain | callback-and-clinician-messaging-loop.md |
| OBJ_THREADRESOLUTIONGATE | ThreadResolutionGate | gate | callback_messaging | cross_cutting_callback_and_messaging | Callback and messaging domain | callback-and-clinician-messaging-loop.md |
| OBJ_TIMEOUTRECOVERYCONTRACT | TimeoutRecoveryContract | contract | frontend_runtime | cross_cutting_accessibility_content | Frontend continuity runtime | accessibility-and-content-system-contract.md |
| OBJ_TOKENKERNELLAYERINGPOLICY | TokenKernelLayeringPolicy | policy | frontend_runtime | cross_cutting_design_tokens | Frontend continuity runtime | design-token-foundation.md |
| OBJ_TRAININGDRILLRECORD | TrainingDrillRecord | record | assurance_and_governance | phase_9_assurance_ledger | Assurance and governance spine | phase-9-the-assurance-ledger.md |
| OBJ_TRANSCRIPTARTIFACT | TranscriptArtifact | artifact | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_TRANSCRIPTJOB | TranscriptJob | other | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_TRANSCRIPTPRESENTATIONARTIFACT | TranscriptPresentationArtifact | artifact | assistive | phase_8_assistive_layer | Assistive control plane | phase-8-the-assistive-layer.md |
| OBJ_TRANSITIONCOORDINATOR | TransitionCoordinator | other | foundation_runtime_experience | phase_0_foundation | Frontend continuity runtime | phase-0-the-foundation-protocol.md |
| OBJ_TRANSITIONENVELOPE | TransitionEnvelope | record | foundation_runtime_experience | phase_0_foundation | Frontend continuity runtime | phase-0-the-foundation-protocol.md |
| OBJ_TRANSPORTASSURANCEPROFILE | TransportAssuranceProfile | descriptor | pharmacy | phase_6_pharmacy_loop | Pharmacy loop domain | phase-6-the-pharmacy-loop.md |
| OBJ_TRIAGEOUTCOMEPRESENTATIONARTIFACT | TriageOutcomePresentationArtifact | artifact | triage_human_checkpoint | phase_3_human_checkpoint | Triage domain | phase-3-the-human-checkpoint.md |
| OBJ_TRIAGEREOPENRECORD | TriageReopenRecord | record | triage_human_checkpoint | phase_3_human_checkpoint | Triage domain | phase-3-the-human-checkpoint.md |
| OBJ_TRIAGETASK | TriageTask | other | triage_human_checkpoint | phase_3_human_checkpoint | Triage domain | phase-3-the-human-checkpoint.md |
| OBJ_UIEVENTCOVERAGEASSERTION | UIEventCoverageAssertion | other | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_UIEVENTEMISSIONCHECKPOINT | UIEventEmissionCheckpoint | checkpoint | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_UIEVENTENVELOPE | UIEventEnvelope | event_contract | frontend_runtime | cross_cutting_frontend_runtime | Frontend telemetry contract | platform-frontend-blueprint.md |
| OBJ_UIEVENTVISIBILITYPROFILE | UIEventVisibilityProfile | descriptor | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_UIPROJECTIONVISIBILITYRECEIPT | UIProjectionVisibilityReceipt | other | runtime_release | cross_cutting_runtime_release | Runtime publication control plane | platform-runtime-and-release-blueprint.md |
| OBJ_UISTATECONTRACT | UIStateContract | contract | unknown | phase_7_embedded_channel_deferred | Programme architecture registry | phase-7-inside-the-nhs-app.md |
| OBJ_UITELEMETRYDISCLOSUREFENCE | UITelemetryDisclosureFence | gate | frontend_runtime | cross_cutting_runtime_release | Frontend continuity runtime | platform-runtime-and-release-blueprint.md |
| OBJ_UITRANSITIONSETTLEMENTRECORD | UITransitionSettlementRecord | settlement | frontend_runtime | cross_cutting_runtime_release | Frontend continuity runtime | platform-runtime-and-release-blueprint.md |
| OBJ_URGENTDIVERSIONSETTLEMENT | UrgentDiversionSettlement | settlement | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_VARIANCECOMPARISONBASIS | VarianceComparisonBasis | other | staff_support_operations | cross_cutting_operations_console | Staff, support, and operations control | operations-console-frontend-blueprint.md |
| OBJ_VERIFICATIONSCENARIO | VerificationScenario | other | runtime_release | cross_cutting_runtime_release | Runtime publication control plane | platform-runtime-and-release-blueprint.md |
| OBJ_VISIBILITYCOVERAGEIMPACTDIGEST | VisibilityCoverageImpactDigest | digest | platform_configuration | cross_cutting_platform_admin | Platform administration and configuration | platform-admin-and-config-blueprint.md |
| OBJ_VISIBILITYPOLICYCOMPILER | VisibilityPolicyCompiler | other | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_VISIBILITYPROJECTIONPOLICY | VisibilityProjectionPolicy | policy | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_VISUALIZATIONFALLBACKCONTRACT | VisualizationFallbackContract | contract | audited_flow_gap | cross_cutting_accessibility_content | Cross-phase gap register | accessibility-and-content-system-contract.md |
| OBJ_VISUALIZATIONPARITYPROJECTION | VisualizationParityProjection | projection | audited_flow_gap | cross_cutting_accessibility_content | Cross-phase gap register | accessibility-and-content-system-contract.md |
| OBJ_VISUALIZATIONTABLECONTRACT | VisualizationTableContract | contract | audited_flow_gap | cross_cutting_accessibility_content | Cross-phase gap register | accessibility-and-content-system-contract.md |
| OBJ_VISUALTOKENPROFILE | VisualTokenProfile | descriptor | frontend_runtime | cross_cutting_ui_contract | Frontend continuity runtime | canonical-ui-contract-kernel.md |
| OBJ_WAITLISTCONTINUATIONTRUTHPROJECTION | WaitlistContinuationTruthProjection | projection | booking | phase_4_booking_engine | Booking domain | phase-4-the-booking-engine.md |
| OBJ_WAITLISTDEADLINEEVALUATION | WaitlistDeadlineEvaluation | record | booking | phase_4_booking_engine | Booking domain | phase-4-the-booking-engine.md |
| OBJ_WAITLISTENTRY | WaitlistEntry | other | booking | phase_4_booking_engine | Booking domain | phase-4-the-booking-engine.md |
| OBJ_WAITLISTFALLBACKOBLIGATION | WaitlistFallbackObligation | other | booking | phase_4_booking_engine | Booking domain | phase-4-the-booking-engine.md |
| OBJ_WAITLISTOFFER | WaitlistOffer | other | booking | phase_4_booking_engine | Booking domain | phase-4-the-booking-engine.md |
| OBJ_WAVEACTIONEXECUTIONRECEIPT | WaveActionExecutionReceipt | other | runtime_release | cross_cutting_runtime_release | Runtime publication control plane | platform-runtime-and-release-blueprint.md |
| OBJ_WAVEACTIONIMPACTPREVIEW | WaveActionImpactPreview | other | runtime_release | cross_cutting_runtime_release | Runtime publication control plane | platform-runtime-and-release-blueprint.md |
| OBJ_WAVEACTIONLINEAGE | WaveActionLineage | other | runtime_release | cross_cutting_runtime_release | Runtime publication control plane | platform-runtime-and-release-blueprint.md |
| OBJ_WAVEACTIONOBSERVATIONWINDOW | WaveActionObservationWindow | other | runtime_release | cross_cutting_runtime_release | Runtime publication control plane | platform-runtime-and-release-blueprint.md |
| OBJ_WAVECONTROLFENCE | WaveControlFence | gate | runtime_release | cross_cutting_runtime_release | Runtime publication control plane | platform-runtime-and-release-blueprint.md |
| OBJ_WAVEELIGIBILITYSNAPSHOT | WaveEligibilitySnapshot | record | runtime_release | cross_cutting_runtime_release | Runtime publication control plane | platform-runtime-and-release-blueprint.md |
| OBJ_WAVEVERIFICATIONRECORD | WaveVerificationRecord | record | runtime_release | cross_cutting_runtime_release | Runtime publication control plane | platform-runtime-and-release-blueprint.md |
| OBJ_WORKSPACEARTIFACTFRAME | WorkspaceArtifactFrame | other | staff_support_operations | cross_cutting_staff_workspace | Staff, support, and operations control | staff-workspace-interface-architecture.md |
| OBJ_WORKSPACECONTINUITYEVIDENCEPROJECTION | WorkspaceContinuityEvidenceProjection | projection | staff_support_operations | cross_cutting_staff_workspace | Staff, support, and operations control | staff-workspace-interface-architecture.md |
| OBJ_WORKSPACEDOMINANTACTIONHIERARCHY | WorkspaceDominantActionHierarchy | other | staff_support_operations | cross_cutting_staff_workspace | Staff, support, and operations control | staff-workspace-interface-architecture.md |
| OBJ_WORKSPACEFOCUSPROTECTIONLEASE | WorkspaceFocusProtectionLease | lease | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_WORKSPACEHOMEPROJECTION | WorkspaceHomeProjection | projection | staff_support_operations | cross_cutting_staff_workspace | Staff, support, and operations control | staff-workspace-interface-architecture.md |
| OBJ_WORKSPACENAVIGATIONLEDGER | WorkspaceNavigationLedger | other | staff_support_operations | cross_cutting_staff_workspace | Staff, support, and operations control | staff-workspace-interface-architecture.md |
| OBJ_WORKSPACEPROMINENCEDECISION | WorkspaceProminenceDecision | record | staff_support_operations | cross_cutting_staff_workspace | Staff, support, and operations control | staff-workspace-interface-architecture.md |
| OBJ_WORKSPACEROUTEADJACENCY | WorkspaceRouteAdjacency | other | staff_support_operations | cross_cutting_staff_workspace | Staff, support, and operations control | staff-workspace-interface-architecture.md |
| OBJ_WORKSPACESAFETYINTERRUPTPROJECTION | WorkspaceSafetyInterruptProjection | projection | triage_human_checkpoint | phase_3_human_checkpoint | Triage domain | phase-3-the-human-checkpoint.md |
| OBJ_WORKSPACESELECTEDANCHORPOLICY | WorkspaceSelectedAnchorPolicy | policy | staff_support_operations | cross_cutting_staff_workspace | Staff, support, and operations control | staff-workspace-interface-architecture.md |
| OBJ_WORKSPACESLICETRUSTPROJECTION | WorkspaceSliceTrustProjection | projection | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_WORKSPACESTATUSPRESENTATIONCONTRACT | WorkspaceStatusPresentationContract | contract | staff_support_operations | cross_cutting_staff_workspace | Staff, support, and operations control | staff-workspace-interface-architecture.md |
| OBJ_WORKSPACESURFACEPOSTURE | WorkspaceSurfacePosture | other | staff_support_operations | cross_cutting_staff_workspace | Staff, support, and operations control | staff-workspace-interface-architecture.md |
| OBJ_WORKSPACESURFACESTATE | WorkspaceSurfaceState | descriptor | staff_support_operations | cross_cutting_staff_workspace | Staff, support, and operations control | staff-workspace-interface-architecture.md |
| OBJ_WORKSPACETRUSTENVELOPE | WorkspaceTrustEnvelope | record | foundation_identity_access | phase_0_foundation | Identity and access control | phase-0-the-foundation-protocol.md |
| OBJ_WRITABLEELIGIBILITYFENCE | WritableEligibilityFence | gate | frontend_runtime | cross_cutting_frontend_runtime | Frontend continuity runtime | platform-frontend-blueprint.md |
| OBJ_WRITABLEROUTECONTRACTCOVERAGERECORD | WritableRouteContractCoverageRecord | record | runtime_release | cross_cutting_runtime_release | Runtime publication control plane | platform-runtime-and-release-blueprint.md |
