# 13 Async Workflow Timer And Effect Processing

        Timers, long-running waits, and external-effect proof upgrades are first-class backend law. No user-visible deadline or external settlement may hide inside a request handler, browser tab, or queue-local retry loop.

        ## Timer Families

        | Timer Family | Checkpoint | Proof Class | Settlement | Fallback |
| --- | --- | --- | --- | --- |
| More-info reply window | MoreInfoReplyWindowCheckpoint | recovery_disposition | MoreInfoResponseDisposition | same-shell expiry or late-review posture; no client clock truth |
| More-info reminder schedule | MoreInfoReminderSchedule | external_confirmation | MessageDeliveryEvidenceBundle | suppression or callback fallback when contact repair is active |
| Callback expectation window | CallbackExpectationEnvelope | external_confirmation | CallbackResolutionGate | same-shell promise repair, never silent widening |
| Callback missed-window repair | CallbackResolutionGate | recovery_disposition | CallbackResolutionGate | route to retry, escalation, or repair guidance in the same shell |
| Booking confirmation and reconciliation gate | ExternalConfirmationGate | external_confirmation | BookingConfirmationTruthProjection | hold in confirmation_pending or reconciliation_required; never booked optimism |
| Local waitlist deadline evaluation | WaitlistDeadlineEvaluation | recovery_disposition | WaitlistContinuationTruthProjection | route through current WaitlistFallbackObligation rather than indefinite waiting |
| Waitlist offer expiry | WaitlistOffer | recovery_disposition | WaitlistContinuationTruthProjection | preserve offer provenance and continue or fallback through the same case |
| Hub candidate refresh | AlternativeOfferRegenerationSettlement | review_disposition | AlternativeOfferRegenerationSettlement | regenerate in-shell, preserve provenance, or shift to callback-only recovery |
| Hub patient-choice expiry | AlternativeOfferSession | recovery_disposition | HubOfferToConfirmationTruthProjection | fallback card or read-only provenance; no silent stale choice |
| Practice acknowledgement due timer | PracticeAcknowledgementRecord | external_confirmation | HubOfferToConfirmationTruthProjection | remain booked_pending_practice_ack or recovery_required until current generation settles |
| Hub coordination SLA target | HubCoordinationCase | recovery_disposition | HubCoordinationCase escalation settlement | elevate queue posture and callback fallback; never silent stale wait |
| Pharmacy dispatch proof deadline | PharmacyDispatchAttempt | external_confirmation | PharmacyDispatchAttempt authoritative proof state | hold in proof_pending or reconciliation_required, never optimistic referred calmness |
| Pharmacy outcome reconciliation window | PharmacyOutcomeReconciliationGate | review_disposition | PharmacyOutcomeSettlement | bounded review placeholder; no calm resolution while gate is open |
| Pharmacy bounce-back and urgent return repair | PharmacyBounceBackRecord | recovery_disposition | PharmacyBounceBackSettlement | reopen for safety or supervisor review; never generic silent bounce handling |
| Session expiry | Session | recovery_disposition | Session expiry settlement | same-shell rebind, rotate, or deny; no stale writable carry-over |
| Access grant expiry | AccessGrant | recovery_disposition | AccessGrant expiry settlement | rotate to recovery-only or claim-step-up, never stale grant reuse |
| Secure-link and recovery entry expiry | RouteIntentBinding | recovery_disposition | RouteIntentBinding recovery settlement | same-shell recover_only posture; link expiry may not define workflow truth |

        ## External Effect Matrix

        | Dependency | Applicability | Outbox | Inbox | Receipt | Proof Upgrade |
| --- | --- | --- | --- | --- | --- |
| NHS login authentication rail | callback_only_non_outbox | n/a | queue_adapter_receipt_inbox | AdapterReceiptCheckpoint(nhs_login_callback) | OIDC callback correlation -> SessionEstablishmentDecision -> CapabilityDecision -> RouteIntentBinding |
| Optional PDS enrichment seam | non_applicable_deferred | n/a | n/a | n/a | Deferred optional enrichment only; current baseline keeps PDS outside required truth paths. |
| Telephony, IVR, and call-recording provider | full_duplex | queue_command_outbox | queue_adapter_receipt_inbox | AdapterReceiptCheckpoint(telephony) | transport accepted -> provider callback -> CallbackOutcomeEvidenceBundle -> CallbackResolutionGate |
| Transcript and derived-facts processing provider | outbound_then_inbound_derivation | queue_command_outbox | queue_adapter_receipt_inbox | AdapterReceiptCheckpoint(transcription) | job accepted -> transcript artifact stored -> EvidenceAssimilationRecord or quarantine review |
| SMS delivery provider | full_duplex | queue_command_outbox | queue_adapter_receipt_inbox | AdapterReceiptCheckpoint(notification_sms) | provider accept -> MessageDeliveryEvidenceBundle -> ThreadResolutionGate or delivery repair |
| Email and notification delivery provider | full_duplex | queue_command_outbox | queue_adapter_receipt_inbox | AdapterReceiptCheckpoint(notification_email) | provider accept -> MessageDeliveryEvidenceBundle -> ThreadResolutionGate or delivery repair |
| Malware and artifact scanning provider | outbound_then_inbound_derivation | queue_command_outbox | queue_adapter_receipt_inbox | AdapterReceiptCheckpoint(malware_scan) | scan accepted -> quarantine verdict or clean artifact settlement -> fallback review if unsafe |
| IM1 Pairing programme and prerequisite path | non_applicable_onboarding | n/a | n/a | n/a | Human-governed programme output gates adapter publication rather than acting as a runtime effect lane. |
| Principal GP-system supplier integration paths | non_applicable_programme_binding | n/a | n/a | n/a | Supplier path approval is encoded in AdapterContractProfile publication, not a separate live queue lane. |
| Local booking supplier adapter family | full_duplex | queue_command_outbox | queue_adapter_receipt_inbox | AdapterReceiptCheckpoint(booking_supplier) | dispatch accepted -> durable provider reference or read-after-write -> BookingConfirmationTruthProjection |
| Network and hub partner capacity feeds | inbound_only | n/a | queue_adapter_receipt_inbox | AdapterReceiptCheckpoint(capacity_feed) | snapshot accepted -> NetworkCoordinationPolicyEvaluation -> candidate refresh or quarantine |
| Cross-organisation secure messaging rail including MESH | full_duplex | queue_command_outbox | queue_adapter_receipt_inbox | AdapterReceiptCheckpoint(mesh) | transport accepted -> delivery evidence or dispute -> current confirmation or visibility settlement |
| Origin-practice acknowledgement rail | full_duplex | queue_command_outbox | queue_adapter_receipt_inbox | AdapterReceiptCheckpoint(practice_ack) | message accept -> PracticeAcknowledgementRecord generation -> ack evidence -> HubOfferToConfirmationTruthProjection closureState update |
| Pharmacy directory and discovery dependency | inbound_only | n/a | queue_adapter_receipt_inbox | AdapterReceiptCheckpoint(pharmacy_directory) | snapshot accepted -> PharmacyChoiceProof refresh or quarantine |
| Pharmacy referral transport dependency | full_duplex | queue_command_outbox | queue_adapter_receipt_inbox | AdapterReceiptCheckpoint(pharmacy_dispatch) | dispatch accepted -> provider ack or proof deadline -> PharmacyDispatchAttempt proof state -> ExternalConfirmationGate |
| Pharmacy outcome observation and reconciliation path | inbound_only | n/a | queue_adapter_receipt_inbox | AdapterReceiptCheckpoint(pharmacy_outcome) | inbound evidence -> replay classification -> PharmacyOutcomeReconciliationGate or accepted outcome settlement |
| Pharmacy urgent-return and professional-contact routes | inbound_only | n/a | queue_adapter_receipt_inbox | AdapterReceiptCheckpoint(pharmacy_urgent_return) | urgent return evidence -> BounceBackRecord -> safety preemption and reopened triage settlement |
| NHS App embedded-channel ecosystem | non_applicable_deferred | n/a | n/a | n/a | Deferred embedded channel posture binds to runtime publication and scope tuples, not a separate adapter effect lane in the current baseline. |
| Assistive model vendor and subprocessor family | non_applicable_deferred | n/a | n/a | n/a | Assistive vendors remain conditional and non-authoritative; no baseline proof chain depends on them. |
| NHS standards and assurance source set | non_applicable_human_governed | n/a | n/a | n/a | Evidence watchlist and standards monitoring are human-governed assurance inputs, not runtime adapter effects. |

        ## Processing Law

        - More-info TTL, callback promises, booking confirmation, waitlist continuation, hub patient choice, practice acknowledgement, pharmacy proof windows, and recovery expiry all persist in `store_timer_state`.
        - A timer wakeup only recomputes checkpoints and submits governed commands. It does not silently mutate business truth.
        - Inbound-only dependencies such as capacity feeds, pharmacy directory snapshots, and pharmacy outcomes still reconcile through durable inbox plus receipt rules.
        - Defer or onboarding-only dependencies are explicitly marked non-applicable instead of left implied.
