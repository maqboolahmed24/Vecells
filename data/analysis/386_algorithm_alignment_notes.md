# 386 Algorithm Alignment Notes

The frontend model aligns with tracks 377-385 without importing node-only command-api code into
the browser bundle.

## 377 Manifest

All 13 journey paths from the Phase 7 manifest are represented in
`NHS_APP_ROUTE_INVENTORY`. Route patterns, route family refs, classifications, owners, fallback
routes, visibility posture, and release tuple refs are mirrored into the UI contract.

## 381 Bridge Runtime

The preview panel exposes bridge availability and action sets. Known 381 bridge actions such as
`isEmbedded`, `setBackAction`, `clearBackAction`, `goToAppPage`, `openOverlay`, and `downloadBytes`
are surfaced as compatibility facts, while unsupported routes show blocked or conditional posture.

## 382 Artifact Delivery

Records and file-adjacent routes are shown as summary-first or placeholder-only. The preview
copies artifact limitations instead of presenting raw download affordances when embedded file
handling is not trusted.

## 383 Route Readiness

The table uses the same readiness vocabulary: `ready`, `conditionally_ready`,
`placeholder_only`, `blocked`, and `evidence_missing`. Evidence refs include UI state contracts,
accessible content variants, audit evidence, and continuity evidence where those are available.

## 384 Environment Telemetry

Environment filters use `local_preview`, `sandpit`, `aos`, `limited_release`, and `full_release`.
The tuple ribbon makes manifest parity, profile-only posture, and disabled full-release state
visible before route inspection.

## 385 Live Control

Freeze and degradation states include the live-control dispositions: `read_only`,
`placeholder_only`, `hidden`, and `redirect_to_safe_route`. The preview renders these as read-only,
placeholder, hidden, or redirect states.
