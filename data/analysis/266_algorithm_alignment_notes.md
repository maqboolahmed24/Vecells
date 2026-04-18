# 266 Algorithm Alignment Notes

## Route and projection alignment

- `conversation_overview`
  - launch context: `PatientRequestReturnBundle`
  - orientation truth: `PatientMoreInfoStatusProjection`, `PatientCallbackStatusProjection`, `PatientConversationCluster`
  - UI behavior: reassure with one summary-first route, then point to the dominant patient action

- `conversation_more_info`
  - governing truth: `PatientMoreInfoStatusProjection` + `PatientMoreInfoResponseThreadProjection`
  - UI behavior: question-page draft, then check step, then same-shell receipt
  - no detached send confirmation page

- `conversation_callback`
  - governing truth: `PatientCallbackStatusProjection` + `PatientReachabilitySummaryProjection`
  - UI behavior: callback timing and risk remain honest; no local countdown promise

- `conversation_messages`
  - governing truth: `ConversationThreadProjection`, `ConversationSubthreadProjection`, `PatientReceiptEnvelope`, `ConversationCommandSettlement`, `PatientComposerLease`
  - UI behavior: chronology first, patient-safe receipt language, pending review remains explicit

- `conversation_repair`
  - governing truth: `PatientContactRepairProjection` + `PatientReachabilitySummaryProjection`
  - UI behavior: preserve blocked-action context and promote repair in the same shell

## Return-bundle law

- request launch keeps `PatientRequestReturnBundle` as the owning return bridge
- message-cluster launch uses the same shell but returns to the originating cluster route
- browser refresh and history restore must prefer stored continuity over best-guess reconstruction

## Blocked-action and recovery law

- detached-message-center gap: closed by keeping more-info, callback, messages, and repair inside one route family
- local-countdown-promise gap: closed by deriving callback and receipt truth from canonical status projections, not timers
- buried-contact-repair gap: closed by promoting `PatientContactRepairPrompt` in the same route
- jargon gap: closed by plain-language copy that never uses transport or workflow internals as patient explanation
- stale-return-anchor gap: closed by `data-route-anchor`, continuity storage, and request or cluster return labels

## Edge-case mapping

- stale recoverable -> preserve prior safe context, freeze mutation, promote in-shell recovery
- blocked policy -> keep reading available, suppress fresh mutation, explain the next step
- expired reply window -> preserve question and return context without reopening mutation
- repair applied -> keep repair visible until route verification rebounds
- local pending reply -> show local acknowledgement without implying delivery or review
