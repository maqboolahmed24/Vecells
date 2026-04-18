# 271 Phase 3 Patient Workspace Conversation Runbook

## Purpose

Use this runbook when verifying that one same-lineage request behaves consistently across:

- staff more-info compose
- staff callback detail
- staff task thread review
- patient conversation child routes
- message-cluster launch and return

## Operator Checks

1. Open `/workspace/task/task-311/more-info?state=live`.
2. Confirm `MoreInfoInlineSideStage` publishes the same bundle, cycle, checkpoint, due state, reply eligibility, secure-link access state, delivery posture, repair posture, and dominant action as `/requests/request_211_a/conversation/more-info?state=live`.
3. Send the patient more-info reply in the same shell. Confirm the patient stays on the same child route and the receipt anchor becomes active.
4. Open `/workspace/task/task-311`. Confirm `PatientResponseThreadPanel` publishes the same bundle, cluster, thread, `EvidenceDeltaPacket`, and `MoreInfoResponseDisposition` as `/requests/request_211_a/conversation/messages`.
5. Open `/workspace/callbacks?state=live`, select `task-412`, and confirm `CallbackDetailSurface` targets `/requests/request_215_callback/conversation/callback`.
6. Open `/messages/cluster_214_callback`, then enter the patient conversation route. Confirm the return path still points to the same message cluster and the same callback lineage.

## Recovery Checks

- `state=expired`:
  The patient route must show `replyEligibilityState=expired`, `secureLinkAccessState=expired_link`, and keep recovery in the same shell.
- `state=blocked`:
  The patient and staff routes must both show `deliveryPosture=step_up_required`.
- `state=stale`:
  The patient and staff routes must both preserve the same bundle and show `stale_recoverable`.
- `state=repair`:
  The patient and staff callback surfaces must both promote `repair_contact_route`.

## Known Non-Live Boundaries

- notification delivery, callback transport, and reminder dispatch remain simulator-backed
- signed-in vs secure-link vs step-up transitions are browser-seeded rather than coming from a live external bridge
- shells still consume the 271 bundle through seeded projection helpers instead of a live query client

These are accepted only while the parity bundle and route law stay stable.
