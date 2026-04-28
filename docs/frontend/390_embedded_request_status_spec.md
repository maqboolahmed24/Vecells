# 390 Embedded Request Status Spec

## Purpose

`NHSApp_Embedded_Request_Status` is the NHS App embedded request-detail family for request status, more-information response, callback posture, and request-owned messages. It composes the existing `PatientRequestSummaryProjection`, `PatientMoreInfoStatusProjection`, `PatientConversationPreviewDigest`, `PatientCallbackStatusProjection`, and Phase 3 conversation bundle rather than creating a separate message or callback product.

## Components

- `EmbeddedRequestStatusTimeline`: semantic milestone strip over request, more-info, callback, and messages.
- `EmbeddedRequestHeaderSummary`: compact state summary and next safe action.
- `EmbeddedRequestStateRibbon`: current status and actionability.
- `EmbeddedMoreInfoResponseFlow`: reply surface gated by more-info answerability.
- `EmbeddedMoreInfoDueCard`: due-window and cycle disposition.
- `EmbeddedConversationCluster`: request-owned message cluster.
- `EmbeddedConversationPreviewRow`: canonical preview digest row.
- `EmbeddedCallbackStatusCard`: callback window and repair posture.
- `EmbeddedRequestRecoveryBanner`: stale or drifted action recovery.
- `EmbeddedRequestAnchorPreserver`: same-shell anchor evidence.
- `EmbeddedRequestActionReserve`: sticky embedded action reserve.

## Route Contract

Embedded routes are evaluated before the generic `/nhs-app` embedded shell:

- `/nhs-app/requests/:requestRef/status`
- `/nhs-app/requests/:requestRef/more-info`
- `/nhs-app/requests/:requestRef/callback`
- `/nhs-app/requests/:requestRef/messages`
- `/nhs-app/requests/:requestRef/recovery`
- `/embedded-request-status/:requestRef/status`

Every embedded route maps back to canonical browser projections under `/requests/:requestRef`, `/requests/:requestRef/more-info`, `/requests/:requestRef/callback`, and `/messages/:clusterRef`.

## State Laws

- More-info reply controls stay live only when `PatientMoreInfoStatusProjection.surfaceState` and `PatientMoreInfoResponseThreadProjection.answerabilityState` allow an answer.
- Callback controls degrade when `PatientCallbackStatusProjection.windowRiskState` is repair-required.
- Message rows render from `PatientConversationPreviewDigest` and receipt/settlement projections.
- Recovery preserves the last safe request summary and same-shell anchor while suppressing live mutation affordances.

## Layout

The route uses a stacked single-column layout with a 46rem maximum width, 20px summary and panel padding, 20px timeline gutter, 12px spacing, and a 72px sticky action reserve. Palette targets are `#F6F8FB`, `#FFFFFF`, `#F3F7FB`, `#D9E2EC`, `#0F172A`, `#334155`, `#64748B`, `#2457FF`, `#146C43`, `#A16207`, and `#B42318`.

## Verification

Validation is provided by `tools/analysis/validate_390_embedded_request_status_ui.ts`.

Playwright evidence covers status-only, more-info reply, callback expected, callback drifted, message preview, recovery, ARIA snapshots, traces, narrow mobile emulation, and visual baselines.
