# 266 Patient Conversation Surface Spec

Visual mode: `Calm_Care_Conversation`

## Intent

`266` introduces one governed patient conversation family for more-info replies, callback status, message updates, and contact repair. The surface stays inside the patient shell, keeps the owning request or message cluster explicit, and follows the route law: reassure first, orient second, act third, explain always.

This is not a generic inbox. It is a request-tied care conversation.

## Route family

- `/requests/:requestId/conversation`
- `/requests/:requestId/conversation/more-info`
- `/requests/:requestId/conversation/callback`
- `/requests/:requestId/conversation/messages`
- `/requests/:requestId/conversation/repair`

Launch points:

- request detail route via `request-detail-open-conversation`
- message cluster route via `message-open-request-conversation`

Return continuity:

- request launch returns to the owning request detail
- message launch returns to the owning message cluster
- stale and blocked states keep the last safe anchor and bundle visible

## Authoritative inputs

- `PatientRequestReturnBundle`
- `PatientMoreInfoStatusProjection`
- `PatientMoreInfoResponseThreadProjection`
- `PatientCallbackStatusProjection`
- `PatientReachabilitySummaryProjection`
- `PatientContactRepairProjection`
- `PatientConversationCluster`
- `ConversationThreadProjection`
- `ConversationSubthreadProjection`
- `PatientReceiptEnvelope`
- `ConversationCommandSettlement`
- `PatientComposerLease`

## Core primitives

- `PatientConversationRoute`
- `PatientMoreInfoReplySurface`
- `PatientCallbackStatusCard`
- `PatientMessageThread`
- `PatientContactRepairPrompt`
- `PatientConversationReturnBridge`

## Layout law

- readable main column capped near `720-800px`
- secondary rail sized for request-return, callback summary, and next-step context
- single dominant action bar at the bottom of the route
- no detached modal or generic message-center chrome

## State law

### Live

- more-info reply is editable
- callback status is summary-first and plain language
- message reply can be sent, but the receipt stays pending and non-final

### Repair

- `PatientContactRepairProjection` becomes dominant
- blocked action summary stays visible in-shell
- callback or reply reassurance does not outrun degraded route truth

### Stale recoverable

- last safe context stays visible
- dominant action becomes same-shell recovery
- local message acknowledgement cannot imply delivery

### Blocked policy

- reading remains available
- mutation controls freeze in place
- next-step copy explains the blocking condition in plain language

### Expired

- current question and why it mattered stay readable
- no fresh mutation is offered
- return context stays explicit

## Copy law

- do not expose transport jargon as the patient-facing explanation
- do not promise delivery or review from local send state
- do not bury contact repair behind detached account maintenance
- do not lose request or cluster return context after mutation begins

## DOM contract

Root route node publishes:

- `data-patient-conversation-state`
- `data-request-return-bundle`
- `data-callback-state`
- `data-contact-repair-state`
- `data-dominant-patient-action`

Additional shell markers:

- `data-shell-type="patient_request_shell"`
- `data-route-family="patient_conversation"`
- `data-continuity-key`
- `data-route-anchor`

## Interaction notes

- question answers stay in the same route and advance to a check step before send
- sending a reply preserves the route and moves focus to the receipt panel
- message chronology anchors can be selected without leaving the route
- browser back and reload restore the same request or cluster context when continuity evidence remains valid
- the patient shell top nav continues to work from inside the conversation family

## Inspiration posture

Borrowed direction:

- Linear for reduced noise and calm density
- Vercel for persistent section chrome and child-route continuity
- IBM Carbon for disciplined dense scanning
- NHS guidance for patient-safe wording and transactional question flow

Rejected direction:

- consumer chat bubbles
- CRM-style table chrome
- optimistic “sent equals done” copy
- detached account-maintenance repair flows
