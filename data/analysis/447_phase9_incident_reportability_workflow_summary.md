# 447 Phase 9 Incident Reportability Workflow

Schema version: 447.phase9.incident-reportability-workflow.v1
Generated at: 2026-04-27T12:00:00.000Z
Telemetry incident: si_447_bba5b7a4610a530c
Near miss retained as first-class report: nmr_447_9c193b3c3e7e7648
Reportability decision: reported
CAPA action: capa_441_7cf055559c516467
Ledger writeback hash: 1692439fd53184d98bfd3e3b99a327a54dc08c361c695f51cbf5464b3d92e891
Replay hash: fc3c972e89f9a884f4ceda72a1336a990972e9400154145b91d617af4c4b4cce

## Workflow Contract

- Incidents can originate from telemetry, operator report, near miss, audit, break-glass, projection quarantine, assurance gap, external notification, or supplier alert sources.
- Near misses remain first-class records and can feed CAPA or training without forced incident conversion.
- Evidence and deterministic timeline refs are preserved before high-risk containment actions settle.
- Reportability decisions carry versioned framework refs, graph-pinned supporting facts, supersession, and external handoff state.
- Post-incident review cannot close while reportability or CAPA ownership is incomplete.
- Incident outcomes propagate to CAPA, assurance packs, training drills, redacted telemetry fences, the assurance ledger, and graph edge refs.
