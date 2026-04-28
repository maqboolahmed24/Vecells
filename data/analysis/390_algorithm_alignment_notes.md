# 390 Algorithm Alignment Notes

## Request Status Binding

`resolveEmbeddedRequestStatusContext` maps embedded paths under `/nhs-app/requests/:requestRef/...` to the canonical patient request detail resolver. The top summary, status ribbon, lineage, and next action come from `PatientRequestDetailProjection` and `PatientRequestSummaryProjection`.

## More-Info Binding

The more-info surface calls `resolveWorkflowEntry` and reads `PatientMoreInfoStatusProjection` plus `PatientMoreInfoResponseThreadProjection`. The reply textarea is live only when the status says `reply_needed` and the thread says `answerable`.

## Callback Binding

`EmbeddedCallbackStatusCard` renders `PatientCallbackStatusProjection`. Repair-required callback states preserve the request summary and suppress live action affordances in place.

## Conversation Binding

`EmbeddedConversationCluster` renders the active `PatientConversationPreviewDigest`, `PatientReceiptEnvelope`, and `ConversationCommandSettlement` returned by the canonical communications resolver.

## Phase 3 Bundle Binding

The embedded family also resolves `Phase3PatientWorkspaceConversationBundle` for route parity, due state, recovery posture, selected anchors, and same-shell continuity evidence.
