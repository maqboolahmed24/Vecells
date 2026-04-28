# 260 Approval Escalation Accessibility Notes

## Keyboard and focus

- Approval and escalation filters remain native buttons with visible selected state.
- Sort controls remain native `select` elements with explicit `aria-label`.
- Row selection and task-open actions are separate click targets so keyboard users do not accidentally leave the route when trying to inspect a row.
- Focus order remains lane, stage, side stage. Reduced chrome does not hide the dominant action path from keyboard users.

## Headings and landmarks

- Each route keeps one route heading, one stage heading, and one side-stage heading.
- `ApprovalReviewStage`, `ApprovalAuthoritySummary`, `UrgentContactTimeline`, and `EscalationOutcomeRecorder` all expose named sections through visible headings.
- The workspace shell keeps the same route-family landmarks from `255`.

## Reduced motion

- Reduced motion preserves meaning with opacity, outline, and density changes rather than animated travel.
- Freeze posture and supersession still rely on text, badges, and static section order when motion is reduced.

## Color and semantic cues

- Approval, urgent, and caution states are reinforced with text labels and badges rather than color alone.
- Timeline events remain understandable without the dot color because each event keeps headline, actor, time, and outcome text.

## History and re-entry

- Browser back and reload preserve the route, selected anchor, and stage selection rather than forcing users to rescan the lane.
- Superseded approval states keep rationale and replacement authority text visible so frozen posture is understandable without prior context.
