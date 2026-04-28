# 160 Same-Shell Urgent Diversion Surface

`par_160` replaces the patient-web urgent placeholder with one governed `Urgent_Pathway_Frame` inside the Phase 1 mission shell.

## Core law

- `urgent_diversion_required` and `urgent_diverted` remain separate durable truths.
- The patient route may show urgent-required immediately after the authoritative safety decision settles.
- The patient route may show urgent-issued only after the urgent settlement is issued.
- `failed_safe` remains recovery grammar and may not borrow routine receipt language.
- external urgent actions stay bound to `OutboundNavigationGrant`, not raw route-local jumps.

## Surface split

The shell now renders three distinct post-submit postures:

1. `urgent_required_pending`
   The request cannot remain in routine flow. The shell keeps continuity while the urgent handoff is still pending settlement.
2. `urgent_issued`
   Urgent guidance is already issued and recorded on the same request lineage.
3. `failed_safe_recovery`
   The shell keeps the last safe summary and recovery posture, but the request was not placed in routine review.

## Same-shell continuity

- masthead, quiet status strip, selected anchor, and route family remain intact
- only the center canvas changes posture
- the bounded summary keeps “what you told us” in view without encouraging routine completion
- the dominant action stays near the top of the urgent card

## Gap closures

- `GAP_RESOLVED_URGENT_SURFACE_COPY_PENDING_ISSUED_SPLIT_V1`
  The urgent surface now renders pending-versus-issued settlement explicitly.
- `GAP_RESOLVED_URGENT_SURFACE_COPY_FAILED_SAFE_DISTINCT_V1`
  Failed-safe recovery now has separate visual language, action hierarchy, and copy.
- `GAP_RESOLVED_URGENT_SURFACE_COPY_OUTBOUND_NAVIGATION_GOVERNED_V1`
  Urgent handoff actions now expose governed grant metadata instead of behaving like raw location jumps.
