# Phase 9 Incident Reportability Workflow Algorithm Alignment

Task 447 implements section 9G as a governed backend workflow. Incidents can originate from telemetry, operator reports, near misses, audit, break-glass review, projection quarantine, assurance evidence gaps, external notifications, or supplier alerts.

Near misses are first-class records. They can remain near misses, link to incidents, drive CAPA, or create training drills without being forced into the incident queue.

Reportability decisions are versioned, evidence-based, timeline-pinned, supersedable, and paired with external handoff state. Post-incident review blocks closure until reportability and CAPA ownership are complete.

Containment actions require role, purpose, reason, tenant-bound scope, and idempotency. High-risk containment proves evidence preservation and authoritative command settlement refs before it can settle.

Incident outcomes propagate into CAPA, assurance packs, training drills, redacted telemetry fences, assurance-ledger entries, and graph edge refs.
