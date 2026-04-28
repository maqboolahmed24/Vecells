
# Crosscutting Shared Interface Registry

Task: `seq_209`

Registry rule: one shared interface has one authoritative owner. Consumers may bind to a temporary gap artifact while the owner is still landing, but they may not create a second shape or local semantic alias.

| Interface | Family | Owner | Consumers | Gap allowed |
| --- | --- | --- | --- | --- |
| PatientSpotlightDecisionProjection | patient_home_spotlight_family | par_210 | par_215<br>par_211<br>par_216<br>par_217 | True |
| PatientSpotlightDecisionUseWindow | patient_home_spotlight_family | par_210 | par_215<br>par_211 | True |
| PatientQuietHomeDecision | patient_home_spotlight_family | par_210 | par_215<br>par_216<br>par_217 | True |
| PatientPortalNavigationProjection | patient_home_spotlight_family | par_210 | par_215<br>par_216<br>par_217 | True |
| PatientNavUrgencyDigest | patient_home_spotlight_family | par_210 | par_215<br>par_216<br>par_217 | True |
| PatientNavReturnContract | patient_home_spotlight_family | par_210 | par_211<br>par_215<br>par_216<br>par_217 | True |
| PatientRequestsIndexProjection | patient_request_action_family | par_211 | par_210<br>par_215<br>par_216<br>par_217<br>par_218 | True |
| PatientRequestLineageProjection | patient_request_action_family | par_211 | par_212<br>par_213<br>par_214<br>par_215<br>par_216<br>par_217<br>par_218<br>par_219 | True |
| PatientRequestDetailProjection | patient_request_action_family | par_211 | par_212<br>par_213<br>par_214<br>par_215<br>par_216<br>par_217<br>par_218 | True |
| PatientRequestDownstreamProjection | patient_request_action_family | par_211 | par_212<br>par_213<br>par_214<br>par_215<br>par_216<br>par_217 | True |
| PatientRequestReturnBundle | patient_request_action_family | par_211 | par_212<br>par_213<br>par_214<br>par_215<br>par_216<br>par_217 | True |
| PatientNextActionProjection | patient_request_action_family | par_211 | par_210<br>par_215<br>par_216<br>par_217 | True |
| PatientActionRoutingProjection | patient_request_action_family | par_211 | par_212<br>par_213<br>par_215<br>par_216<br>par_217 | True |
| PatientActionSettlementProjection | patient_request_action_family | par_211 | par_212<br>par_215<br>par_216<br>par_217 | True |
| PatientSafetyInterruptionProjection | patient_request_action_family | par_211 | par_210<br>par_212<br>par_215<br>par_216<br>par_217 | True |
| PatientMoreInfoStatusProjection | callback_and_clinician_message_projection_family | par_212 | par_211<br>par_215<br>par_216<br>par_214 | True |
| PatientMoreInfoResponseThreadProjection | callback_and_clinician_message_projection_family | par_212 | par_211<br>par_216<br>par_214 | True |
| PatientCallbackStatusProjection | callback_and_clinician_message_projection_family | par_212 | par_210<br>par_211<br>par_214<br>par_215<br>par_216<br>par_217<br>par_219 | True |
| PatientReachabilitySummaryProjection | callback_and_clinician_message_projection_family | par_212 | par_210<br>par_211<br>par_215<br>par_216<br>par_218<br>par_219 | True |
| PatientContactRepairProjection | callback_and_clinician_message_projection_family | par_212 | par_210<br>par_211<br>par_215<br>par_216<br>par_218<br>par_219 | True |
| PatientConsentCheckpointProjection | callback_and_clinician_message_projection_family | par_212 | par_211<br>par_216 | True |
| CallbackExpectationEnvelope | callback_and_clinician_message_projection_family | par_212 | par_214<br>par_219 | True |
| CallbackOutcomeEvidenceBundle | callback_and_clinician_message_projection_family | par_212 | par_214<br>par_219 | True |
| CallbackResolutionGate | callback_and_clinician_message_projection_family | par_212 | par_214<br>par_219 | True |
| PatientRecordSurfaceContext | health_record_artifact_family | par_213 | par_215<br>par_217<br>par_218 | True |
| PatientResultInterpretationProjection | health_record_artifact_family | par_213 | par_217 | True |
| PatientRecordArtifactProjection | health_record_artifact_family | par_213 | par_217<br>par_218<br>par_222 | True |
| RecordArtifactParityWitness | health_record_artifact_family | par_213 | par_217<br>par_222 | True |
| PatientRecordFollowUpEligibilityProjection | health_record_artifact_family | par_213 | par_211<br>par_217 | True |
| PatientRecordContinuityState | health_record_artifact_family | par_213 | par_217 | True |
| PatientCommunicationVisibilityProjection | communications_timeline_and_visibility_family | par_214 | par_212<br>par_215<br>par_216<br>par_217<br>par_218<br>par_219 | True |
| ConversationThreadProjection | communications_timeline_and_visibility_family | par_214 | par_212<br>par_216<br>par_217<br>par_218<br>par_219 | True |
| ConversationSubthreadProjection | communications_timeline_and_visibility_family | par_214 | par_216<br>par_217<br>par_219 | True |
| PatientConversationPreviewDigest | communications_timeline_and_visibility_family | par_214 | par_217 | True |
| PatientReceiptEnvelope | communications_timeline_and_visibility_family | par_214 | par_216<br>par_217<br>par_219 | True |
| ConversationCommandSettlement | communications_timeline_and_visibility_family | par_214 | par_216<br>par_217<br>par_219 | True |
| MessageDispatchEnvelope | communications_timeline_and_visibility_family | par_214 | par_219<br>par_221 | True |
| MessageDeliveryEvidenceBundle | communications_timeline_and_visibility_family | par_214 | par_218<br>par_219<br>par_221 | True |
| SupportTicket | support_ticket_and_omnichannel_timeline_family | par_218 | par_220<br>par_221<br>par_222 | True |
| SupportLineageBinding | support_ticket_and_omnichannel_timeline_family | par_218 | par_219<br>par_220<br>par_221<br>par_222 | True |
| SupportLineageScopeMember | support_ticket_and_omnichannel_timeline_family | par_218 | par_219<br>par_221<br>par_222 | True |
| SupportLineageArtifactBinding | support_ticket_and_omnichannel_timeline_family | par_218 | par_219<br>par_221<br>par_222 | True |
| SupportTicketWorkspaceProjection | support_ticket_and_omnichannel_timeline_family | par_218 | par_219<br>par_220<br>par_221<br>par_222 | True |
| SupportSubject360Projection | support_masking_and_replay_diff_family | par_218 | par_220<br>par_221<br>par_222 | True |
| SupportSubjectContextBinding | support_masking_and_replay_diff_family | par_218 | par_221<br>par_222 | True |
| SupportContextDisclosureRecord | support_masking_and_replay_diff_family | par_218 | par_221<br>par_222 | True |
| SupportReadOnlyFallbackProjection | support_masking_and_replay_diff_family | par_218 | par_219<br>par_220<br>par_221<br>par_222 | True |
| SupportOmnichannelTimelineProjection | support_ticket_and_omnichannel_timeline_family | par_219 | par_220<br>par_221<br>par_222 | True |
| SupportMutationAttempt | support_ticket_and_omnichannel_timeline_family | par_219 | par_221<br>par_222 | True |
| SupportActionRecord | support_ticket_and_omnichannel_timeline_family | par_219 | par_221<br>par_222 | True |
| SupportActionSettlement | support_ticket_and_omnichannel_timeline_family | par_219 | par_221<br>par_222 | True |
| CommunicationReplayRecord | support_masking_and_replay_diff_family | par_219 | par_221<br>par_222 | True |
| SupportReplayCheckpoint | support_masking_and_replay_diff_family | par_219 | par_222 | True |
| SupportReplayEvidenceBoundary | support_masking_and_replay_diff_family | par_219 | par_222 | True |
| SupportReplayDeltaReview | support_masking_and_replay_diff_family | par_219 | par_222 | True |
| SupportReplayReleaseDecision | support_masking_and_replay_diff_family | par_219 | par_222 | True |
| SupportReplayRestoreSettlement | support_masking_and_replay_diff_family | par_219 | par_222 | True |
| SupportRouteIntentToken | shared_continuity_evidence_and_reachability_truth_family | par_219 | par_221<br>par_222 | True |
| SupportContinuityEvidenceProjection | shared_continuity_evidence_and_reachability_truth_family | par_219 | par_220<br>par_221<br>par_222 | True |
| SupportActionWorkbenchProjection | support_ticket_and_omnichannel_timeline_family | par_219 | par_221<br>par_222 | True |
| SupportReachabilityPostureProjection | shared_continuity_evidence_and_reachability_truth_family | par_219 | par_220<br>par_221<br>par_222 | True |
| WorkspaceHomeProjection | support_frontend_entry_family | par_220 | par_221<br>par_222 | True |
| SupportDeskHomeProjection | support_frontend_entry_family | par_220 | par_221<br>par_222 | True |
| SupportInboxProjection | support_frontend_entry_family | par_220 | par_221<br>par_222 | True |
| SupportWorkspaceShellRouteContract | support_frontend_entry_family | par_221 | par_222<br>par_223 | True |
| SupportKnowledgeStackProjection | support_masking_and_replay_diff_family | par_222 | par_221<br>par_223 | True |
| SupportKnowledgeBinding | support_masking_and_replay_diff_family | par_222 | par_221<br>par_223 | True |
| SupportKnowledgeAssistLease | support_masking_and_replay_diff_family | par_222 | par_221<br>par_223 | True |
| SupportObserveSession | support_masking_and_replay_diff_family | par_222 | par_221<br>par_223 | True |
| SupportReplaySession | support_masking_and_replay_diff_family | par_222 | par_221<br>par_223 | True |
| SupportPresentationArtifact | support_masking_and_replay_diff_family | par_222 | par_221<br>par_223 | True |

## Versioning Rule

All rows use the same frozen rule: `v1` is locked by `seq_209`; additive presentation fields require a minor registry note; ownership, route intent, actionability, visibility, masking, or settlement semantics require a major version and merge-gate approval.
