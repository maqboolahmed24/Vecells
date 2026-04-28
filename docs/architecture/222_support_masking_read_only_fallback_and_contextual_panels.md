# 222 Support Masking, Read-Only Fallback, and Contextual Panels

## Task

- Task id: `par_222_crosscutting_track_Playwright_or_other_appropriate_tooling_frontend_build_support_masking_read_only_fallback_and_contextual_playbook_panels`
- Visual mode: `Support_Masking_Fallback_Knowledge_Atlas`
- Shell host: same clinical SPA host introduced in `221`

## Consumed outputs

- `par_218_crosscutting_track_backend_build_support_lineage_binding_ticket_projection_and_subject_history_queries`
- `par_219_crosscutting_track_backend_build_controlled_resend_delivery_repair_and_support_replay_foundations`
- `par_221_crosscutting_track_Playwright_or_other_appropriate_tooling_frontend_build_support_workspace_shell_and_omnichannel_ticket_views`

## Route family

The existing `221` support shell was extended in place. No second workspace implementation was introduced.

- `/ops/support/tickets/:supportTicketId`
- `/ops/support/tickets/:supportTicketId/conversation`
- `/ops/support/tickets/:supportTicketId/history`
- `/ops/support/tickets/:supportTicketId/knowledge`
- `/ops/support/tickets/:supportTicketId/actions/:actionKey`
- `/ops/support/tickets/:supportTicketId/observe/:supportObserveSessionId`
- `/ops/support/replay/:supportReplaySessionId`

## Design outcome

The 222 pass closes the remaining support-front-end risk from the shared gap artifact:

1. masking keeps chronology, structure, lane identity, and timestamps visible
2. read-only fallback stays inside the same shell and preserves the strongest confirmed artifact
3. contextual knowledge stays bounded by the current support action and knowledge lease
4. history widening is summary-first and explicit
5. observe and replay remain continuously visible through shell chrome, chips, and action suppression

## Projection set now rendered in the shell

The support workspace now materializes and displays:

- `SupportTicketWorkspaceProjection`
- `SupportOmnichannelTimelineProjection`
- `SupportActionWorkbenchProjection`
- `SupportReachabilityPostureProjection`
- `SupportActionLease`
- `SupportActionSettlement`
- `SupportContinuityEvidenceProjection`
- `SupportSurfaceRuntimeBinding`
- `SupportReadOnlyFallbackProjection`
- `SupportPresentationArtifact`
- `SupportKnowledgeStackProjection`
- `SupportKnowledgeBinding`
- `SupportKnowledgeAssistLease`
- `SupportSubject360Projection`
- `SupportSubjectContextBinding`
- `SupportContextDisclosureRecord`
- `SupportObserveSession`
- `SupportReplaySession`
- `SupportReplayEvidenceBoundary`

## Reusable primitives

The shell adds the required 222 primitives without replacing the 221 shell frame:

- `MaskAwareTimelineCell`
- `MaskScopeBadge`
- `ReadOnlyFallbackHero`
- `FallbackArtifactAnchor`
- `ObserveReplayBreadcrumb`
- `KnowledgeStackRail`
- `PlaybookAssistCard`
- `SubjectHistorySummaryPanel`
- `DisclosureGatePrompt`
- `ReacquirePathCard`

## Masking model

`effectiveMaskScopeRef` is now rendered at the shell root and repeated in:

- header chips
- lineage strip
- timeline rows
- history route
- knowledge rail
- artifact anchor
- action dock

The UI never removes chronology structure when content narrows. Instead:

- event time remains visible
- lane identity remains visible
- row height remains stable
- masked fragments downgrade into explicit placeholder rows
- mask reason remains readable without leaking the hidden content

## Read-only fallback order

The fallback hero follows the mandated order:

1. why live controls dropped away
2. strongest confirmed artifact still safe to show
3. held action summary
4. shortest safe reacquire paths
5. queue or inbox return stub

Fallback remains same-shell for:

- route-intent drift
- observe-session drift
- replay-restore failure
- runtime publication drift
- disclosure drift

## Knowledge and disclosure rules

The knowledge rail is fixed to the right contextual plane already established by `221` and now shows only the top `1` to `3` cards by default. Each card shows:

- title
- why-now explanation
- freshness
- owner or policy marker
- safe preview or apply affordance

Executable behavior only appears when `SupportKnowledgeAssistLease.leaseState = executable`.

History widening is bound to `SupportContextDisclosureRecord`. When disclosure expires or is revoked, the route collapses back to summary in place and does not keep stale detail visible.

## Observe and replay posture

Observe and replay render through `ObserveReplayBreadcrumb` and keep:

- constrained mode visible in shell chrome
- mask scope continuously visible
- mutating controls suppressed
- current ticket anchor preserved

Replay additionally exposes a frozen `SupportReplayEvidenceBoundary` summary showing:

- included events
- excluded drafts
- frozen mask scope
- return route

## Browser proof

The Playwright suite proves:

- history summary and governed widen
- knowledge route with lease-bound playbook cards
- observe route with visible suppression
- replay route with frozen evidence boundary
- same-shell read-only fallback on mobile
- atlas and visual grammar artifacts
- ARIA snapshots
- reduced-motion parity

## Files

- route implementation: `/Users/test/Code/V/apps/clinical-workspace/src/support-workspace-shell.tsx`
- styles: `/Users/test/Code/V/apps/clinical-workspace/src/support-workspace-shell.css`
- contract: `/Users/test/Code/V/data/contracts/222_support_masking_and_contextual_ui_contract.json`
- validator: `/Users/test/Code/V/tools/analysis/validate_support_masking_and_fallback_ui.py`
- Playwright proof: `/Users/test/Code/V/tests/playwright/222_support_masking_read_only_fallback_and_contextual_playbook_panels.spec.js`
