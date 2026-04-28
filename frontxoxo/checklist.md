# Frontxoxo UI/UX Task Board

This is the live synchronized task board for UI/UX bug-hunt agents.
Agents must read `/Users/test/Code/V/frontxoxo/AGENT.md` before claiming or updating any task.

## Status Legend

- `[ ]` Unclaimed
- `[-]` In progress
- `[X]` Complete
- `[!]` Blocked

## Rules

- Claim exactly one numbered ID per turn.
- Do not claim a whole file, platform, or folder.
- Claim work only by changing `[ ]` to `[-]` and filling `owner:` and `claimed:`.
- Mark `[X]` only after direct inspection and verification.
- Mark `[!]` with blocker notes when work cannot continue.
- Do not reorder tasks manually; regenerate with `node frontxoxo/tools/build-checklist.mjs` when scope files change.

## Tasks

### Clinical Workspace/Booking UI.md

- [ ] CW-BU-S2-001 | area: Clinical Workspace/Booking UI.md | kind: screen | task: Booking workbench. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-BU-S2-002 | area: Clinical Workspace/Booking UI.md | kind: screen | task: Booking case detail. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-BU-S2-003 | area: Clinical Workspace/Booking UI.md | kind: screen | task: Booking candidate slots. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-BU-S2-004 | area: Clinical Workspace/Booking UI.md | kind: screen | task: Booking handoff. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-BU-S2-005 | area: Clinical Workspace/Booking UI.md | kind: screen | task: Booking return state. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-BU-S2-006 | area: Clinical Workspace/Booking UI.md | kind: screen | task: Booking unavailable state. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-BU-S2-007 | area: Clinical Workspace/Booking UI.md | kind: screen | task: Booking recovery state. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-BU-S3-001 | area: Clinical Workspace/Booking UI.md | kind: bug-check | task: Verify booking state, patient preference, slot constraints, and handoff target are visible together. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-BU-S3-002 | area: Clinical Workspace/Booking UI.md | kind: bug-check | task: Verify slot selection and handoff actions have confirmation or undo where needed. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-BU-S3-003 | area: Clinical Workspace/Booking UI.md | kind: bug-check | task: Verify unavailable/recovery states do not look like successful bookings. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-BU-S3-004 | area: Clinical Workspace/Booking UI.md | kind: bug-check | task: Verify long clinic/location names do not break tables or cards. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Clinical Workspace/Queue UI.md

- [ ] CW-QU-S2-001 | area: Clinical Workspace/Queue UI.md | kind: screen | task: Queue workboard. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-QU-S2-002 | area: Clinical Workspace/Queue UI.md | kind: screen | task: Quick capture tray. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-QU-S2-003 | area: Clinical Workspace/Queue UI.md | kind: screen | task: Buffered queue change tray. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-QU-S2-004 | area: Clinical Workspace/Queue UI.md | kind: screen | task: Changed-work digest. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-QU-S2-005 | area: Clinical Workspace/Queue UI.md | kind: screen | task: Queue filter controls. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-QU-S2-006 | area: Clinical Workspace/Queue UI.md | kind: screen | task: Queue item cards or rows. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-QU-S2-007 | area: Clinical Workspace/Queue UI.md | kind: screen | task: Queue empty state. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-QU-S2-008 | area: Clinical Workspace/Queue UI.md | kind: screen | task: Queue overloaded state. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-QU-S3-001 | area: Clinical Workspace/Queue UI.md | kind: bug-check | task: Verify queue priority, SLA, ownership, and status are scannable at row density. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-QU-S3-002 | area: Clinical Workspace/Queue UI.md | kind: bug-check | task: Verify filters and saved states are understandable and reversible. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-QU-S3-003 | area: Clinical Workspace/Queue UI.md | kind: bug-check | task: Verify queue updates do not cause unexpected focus jumps or layout shifts. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-QU-S3-004 | area: Clinical Workspace/Queue UI.md | kind: bug-check | task: Verify capture trays can be opened, dismissed, and completed by keyboard. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Clinical Workspace/Staff entry.md

- [ ] CW-SE-S2-001 | area: Clinical Workspace/Staff entry.md | kind: screen | task: Workspace home entry. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-SE-S2-002 | area: Clinical Workspace/Staff entry.md | kind: screen | task: Workspace queue entry. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-SE-S2-003 | area: Clinical Workspace/Staff entry.md | kind: screen | task: Ops overview entry. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-SE-S2-004 | area: Clinical Workspace/Staff entry.md | kind: screen | task: Ops support entry. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-SE-S2-005 | area: Clinical Workspace/Staff entry.md | kind: screen | task: Ops support inbox entry. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-SE-S3-001 | area: Clinical Workspace/Staff entry.md | kind: bug-check | task: Verify each entry makes the destination and role context obvious. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-SE-S3-002 | area: Clinical Workspace/Staff entry.md | kind: bug-check | task: Verify route cards or links have clear active, hover, focus, and disabled states. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-SE-S3-003 | area: Clinical Workspace/Staff entry.md | kind: bug-check | task: Verify unsupported or missing route states do not strand the user. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-SE-S3-004 | area: Clinical Workspace/Staff entry.md | kind: bug-check | task: Verify staff entry routes work at dense desktop and narrow laptop widths. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Clinical Workspace/Support in clinical.md

- [ ] CW-SIC-S2-001 | area: Clinical Workspace/Support in clinical.md | kind: screen | task: Support ticket overview. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-SIC-S2-002 | area: Clinical Workspace/Support in clinical.md | kind: screen | task: Ticket conversation. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-SIC-S2-003 | area: Clinical Workspace/Support in clinical.md | kind: screen | task: Ticket history. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-SIC-S2-004 | area: Clinical Workspace/Support in clinical.md | kind: screen | task: Ticket knowledge. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-SIC-S2-005 | area: Clinical Workspace/Support in clinical.md | kind: screen | task: Controlled resend action. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-SIC-S2-006 | area: Clinical Workspace/Support in clinical.md | kind: screen | task: Channel change action. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-SIC-S2-007 | area: Clinical Workspace/Support in clinical.md | kind: screen | task: Callback reschedule action. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-SIC-S2-008 | area: Clinical Workspace/Support in clinical.md | kind: screen | task: Attachment recovery action. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-SIC-S2-009 | area: Clinical Workspace/Support in clinical.md | kind: screen | task: Identity correction action. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-SIC-S2-010 | area: Clinical Workspace/Support in clinical.md | kind: screen | task: Observe session. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-SIC-S2-011 | area: Clinical Workspace/Support in clinical.md | kind: screen | task: Replay session. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-SIC-S3-001 | area: Clinical Workspace/Support in clinical.md | kind: bug-check | task: Verify support context is clearly separate from clinical decision context. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-SIC-S3-002 | area: Clinical Workspace/Support in clinical.md | kind: bug-check | task: Verify controlled actions show disclosure, confirmation, and audit consequences. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-SIC-S3-003 | area: Clinical Workspace/Support in clinical.md | kind: bug-check | task: Verify replay/observe states cannot be mistaken for live editing. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-SIC-S3-004 | area: Clinical Workspace/Support in clinical.md | kind: bug-check | task: Verify knowledge and subject-history panels remain readable in split layouts. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Clinical Workspace/Task canvas.md

- [ ] CW-TC-S2-001 | area: Clinical Workspace/Task canvas.md | kind: screen | task: Case pulse band. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-TC-S2-002 | area: Clinical Workspace/Task canvas.md | kind: screen | task: Task status strip. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-TC-S2-003 | area: Clinical Workspace/Task canvas.md | kind: screen | task: Main task canvas. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-TC-S2-004 | area: Clinical Workspace/Task canvas.md | kind: screen | task: Evidence stack. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-TC-S2-005 | area: Clinical Workspace/Task canvas.md | kind: screen | task: Reference stack. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-TC-S2-006 | area: Clinical Workspace/Task canvas.md | kind: screen | task: Summary panel. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-TC-S2-007 | area: Clinical Workspace/Task canvas.md | kind: screen | task: Delta panel. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-TC-S2-008 | area: Clinical Workspace/Task canvas.md | kind: screen | task: Consequence stack. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-TC-S2-009 | area: Clinical Workspace/Task canvas.md | kind: screen | task: Decision dock. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-TC-S2-010 | area: Clinical Workspace/Task canvas.md | kind: screen | task: Promoted support region. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-TC-S3-001 | area: Clinical Workspace/Task canvas.md | kind: bug-check | task: Verify clinical priority, patient context, and decision state are visible without scrolling. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-TC-S3-002 | area: Clinical Workspace/Task canvas.md | kind: bug-check | task: Verify evidence panels have clear provenance, freshness, and expansion behavior. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-TC-S3-003 | area: Clinical Workspace/Task canvas.md | kind: bug-check | task: Verify decision dock buttons cannot be confused with informational chips. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-TC-S3-004 | area: Clinical Workspace/Task canvas.md | kind: bug-check | task: Verify long clinical text remains readable and does not crush adjacent rails. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Clinical Workspace/Validation UI.md

- [ ] CW-VU-S2-001 | area: Clinical Workspace/Validation UI.md | kind: screen | task: Validation board. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-VU-S2-002 | area: Clinical Workspace/Validation UI.md | kind: screen | task: Contact mismatch panel. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-VU-S2-003 | area: Clinical Workspace/Validation UI.md | kind: screen | task: PDS evidence panel. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-VU-S2-004 | area: Clinical Workspace/Validation UI.md | kind: screen | task: Identity evidence panel. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-VU-S2-005 | area: Clinical Workspace/Validation UI.md | kind: screen | task: Validation complete state. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-VU-S2-006 | area: Clinical Workspace/Validation UI.md | kind: screen | task: Validation failed state. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-VU-S2-007 | area: Clinical Workspace/Validation UI.md | kind: screen | task: Validation manual-review state. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-VU-S3-001 | area: Clinical Workspace/Validation UI.md | kind: bug-check | task: Verify match, mismatch, unknown, and manually verified states are visually distinct. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-VU-S3-002 | area: Clinical Workspace/Validation UI.md | kind: bug-check | task: Verify evidence source and timestamp are visible wherever decisions are made. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-VU-S3-003 | area: Clinical Workspace/Validation UI.md | kind: bug-check | task: Verify validation failures explain the next safe action. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-VU-S3-004 | area: Clinical Workspace/Validation UI.md | kind: bug-check | task: Verify warning colors are not the only signal of severity. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Clinical Workspace/Workspace shell.md

- [ ] CW-WS-S2-001 | area: Clinical Workspace/Workspace shell.md | kind: screen | task: Workspace home. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-WS-S2-002 | area: Clinical Workspace/Workspace shell.md | kind: screen | task: Queue route. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-WS-S2-003 | area: Clinical Workspace/Workspace shell.md | kind: screen | task: Task route. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-WS-S2-004 | area: Clinical Workspace/Workspace shell.md | kind: screen | task: More-info child route. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-WS-S2-005 | area: Clinical Workspace/Workspace shell.md | kind: screen | task: Decision child route. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-WS-S2-006 | area: Clinical Workspace/Workspace shell.md | kind: screen | task: Validation route. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-WS-S2-007 | area: Clinical Workspace/Workspace shell.md | kind: screen | task: Consequences route. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-WS-S2-008 | area: Clinical Workspace/Workspace shell.md | kind: screen | task: Callbacks route. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-WS-S2-009 | area: Clinical Workspace/Workspace shell.md | kind: screen | task: Messages route. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-WS-S2-010 | area: Clinical Workspace/Workspace shell.md | kind: screen | task: Approvals route. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-WS-S2-011 | area: Clinical Workspace/Workspace shell.md | kind: screen | task: Escalations route. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-WS-S2-012 | area: Clinical Workspace/Workspace shell.md | kind: screen | task: Changed requests route. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-WS-S2-013 | area: Clinical Workspace/Workspace shell.md | kind: screen | task: Bookings route. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-WS-S2-014 | area: Clinical Workspace/Workspace shell.md | kind: screen | task: Search route. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-WS-S2-015 | area: Clinical Workspace/Workspace shell.md | kind: screen | task: Support handoff route. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-WS-S3-001 | area: Clinical Workspace/Workspace shell.md | kind: bug-check | task: Verify shell route rail, active route, breadcrumbs, and return controls stay synchronized. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-WS-S3-002 | area: Clinical Workspace/Workspace shell.md | kind: bug-check | task: Verify route content does not overflow under dense operational data. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-WS-S3-003 | area: Clinical Workspace/Workspace shell.md | kind: bug-check | task: Verify keyboard focus restores when moving between parent and child routes. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] CW-WS-S3-004 | area: Clinical Workspace/Workspace shell.md | kind: bug-check | task: Verify shell status and interruption surfaces do not hide primary work actions. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Governance Console/Access.md

- [ ] GC-ACC-S2-001 | area: Governance Console/Access.md | kind: screen | task: Access home. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-ACC-S2-002 | area: Governance Console/Access.md | kind: screen | task: Users. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-ACC-S2-003 | area: Governance Console/Access.md | kind: screen | task: Roles. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-ACC-S2-004 | area: Governance Console/Access.md | kind: screen | task: Reviews. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-ACC-S2-005 | area: Governance Console/Access.md | kind: screen | task: Access surface. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-ACC-S2-006 | area: Governance Console/Access.md | kind: screen | task: Access preview. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-ACC-S2-007 | area: Governance Console/Access.md | kind: screen | task: Open review action. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-ACC-S2-008 | area: Governance Console/Access.md | kind: screen | task: Acknowledge review action. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-ACC-S3-001 | area: Governance Console/Access.md | kind: bug-check | task: Verify user, role, permission, and review states are not conflated. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-ACC-S3-002 | area: Governance Console/Access.md | kind: bug-check | task: Verify access previews show what will change before approval. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-ACC-S3-003 | area: Governance Console/Access.md | kind: bug-check | task: Verify review actions include confirmation and audit intent. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-ACC-S3-004 | area: Governance Console/Access.md | kind: bug-check | task: Verify long names, roles, and org labels wrap safely. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Governance Console/Common governance UI.md

- [ ] GC-CGUI-S2-001 | area: Governance Console/Common governance UI.md | kind: screen | task: Governance route rail. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-CGUI-S2-002 | area: Governance Console/Common governance UI.md | kind: screen | task: Governance object rail. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-CGUI-S2-003 | area: Governance Console/Common governance UI.md | kind: screen | task: Scope ribbon. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-CGUI-S2-004 | area: Governance Console/Common governance UI.md | kind: screen | task: Disposition controls. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-CGUI-S2-005 | area: Governance Console/Common governance UI.md | kind: screen | task: Landing surface. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-CGUI-S2-006 | area: Governance Console/Common governance UI.md | kind: screen | task: Support regions. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-CGUI-S2-007 | area: Governance Console/Common governance UI.md | kind: screen | task: Decision dock. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-CGUI-S2-008 | area: Governance Console/Common governance UI.md | kind: screen | task: Review notice. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-CGUI-S2-009 | area: Governance Console/Common governance UI.md | kind: screen | task: Return button. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-CGUI-S2-010 | area: Governance Console/Common governance UI.md | kind: screen | task: Telemetry log. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-CGUI-S2-011 | area: Governance Console/Common governance UI.md | kind: screen | task: Selected anchor. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-CGUI-S2-012 | area: Governance Console/Common governance UI.md | kind: screen | task: Focus restore. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-CGUI-S3-001 | area: Governance Console/Common governance UI.md | kind: bug-check | task: Verify route rail and object rail do not compete for selected state. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-CGUI-S3-002 | area: Governance Console/Common governance UI.md | kind: bug-check | task: Verify decision dock remains tied to the selected object and route. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-CGUI-S3-003 | area: Governance Console/Common governance UI.md | kind: bug-check | task: Verify telemetry log is useful but not the dominant visual element. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-CGUI-S3-004 | area: Governance Console/Common governance UI.md | kind: bug-check | task: Verify focus restore works after drawers, approvals, and return navigation. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Governance Console/Comms.md

- [ ] GC-COM-S2-001 | area: Governance Console/Comms.md | kind: screen | task: Comms home. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-COM-S2-002 | area: Governance Console/Comms.md | kind: screen | task: Templates. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-COM-S2-003 | area: Governance Console/Comms.md | kind: screen | task: Template list. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-COM-S2-004 | area: Governance Console/Comms.md | kind: screen | task: Template detail. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-COM-S2-005 | area: Governance Console/Comms.md | kind: screen | task: Template preview. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-COM-S2-006 | area: Governance Console/Comms.md | kind: screen | task: Template approval state. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-COM-S2-007 | area: Governance Console/Comms.md | kind: screen | task: Template evidence state. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-COM-S3-001 | area: Governance Console/Comms.md | kind: bug-check | task: Verify template status, audience, channel, and version are visible. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-COM-S3-002 | area: Governance Console/Comms.md | kind: bug-check | task: Verify previews show variable substitution and missing-variable states. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-COM-S3-003 | area: Governance Console/Comms.md | kind: bug-check | task: Verify approval states are not confused with draft/editing states. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-COM-S3-004 | area: Governance Console/Comms.md | kind: bug-check | task: Verify template copy is readable at preview widths. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Governance Console/Config.md

- [ ] GC-CFG-S2-001 | area: Governance Console/Config.md | kind: screen | task: Config home. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-CFG-S2-002 | area: Governance Console/Config.md | kind: screen | task: Config bundles. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-CFG-S2-003 | area: Governance Console/Config.md | kind: screen | task: Config promotions. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-CFG-S2-004 | area: Governance Console/Config.md | kind: screen | task: Change envelope. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-CFG-S2-005 | area: Governance Console/Config.md | kind: screen | task: Impact preview. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-CFG-S2-006 | area: Governance Console/Config.md | kind: screen | task: Approval stepper. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-CFG-S2-007 | area: Governance Console/Config.md | kind: screen | task: Evidence panel. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-CFG-S2-008 | area: Governance Console/Config.md | kind: screen | task: Release tuple. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-CFG-S3-001 | area: Governance Console/Config.md | kind: bug-check | task: Verify bundle and promotion states expose source, target, owner, and risk. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-CFG-S3-002 | area: Governance Console/Config.md | kind: bug-check | task: Verify impact preview is visible before approval/submit actions. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-CFG-S3-003 | area: Governance Console/Config.md | kind: bug-check | task: Verify approval stepper shows current, completed, blocked, and rejected states. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-CFG-S3-004 | area: Governance Console/Config.md | kind: bug-check | task: Verify evidence panels remain accessible from every change decision. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Governance Console/Governance.md

- [ ] GC-GOV-S2-001 | area: Governance Console/Governance.md | kind: screen | task: Governance home. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-GOV-S2-002 | area: Governance Console/Governance.md | kind: screen | task: Tenants. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-GOV-S2-003 | area: Governance Console/Governance.md | kind: screen | task: Authority links. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-GOV-S2-004 | area: Governance Console/Governance.md | kind: screen | task: Compliance. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-GOV-S2-005 | area: Governance Console/Governance.md | kind: screen | task: Records lifecycle. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-GOV-S2-006 | area: Governance Console/Governance.md | kind: screen | task: Tenant config matrix. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-GOV-S2-007 | area: Governance Console/Governance.md | kind: screen | task: Authority map. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-GOV-S2-008 | area: Governance Console/Governance.md | kind: screen | task: Compliance ledger. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-GOV-S3-001 | area: Governance Console/Governance.md | kind: bug-check | task: Verify governance scope and selected tenant are always visible. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-GOV-S3-002 | area: Governance Console/Governance.md | kind: bug-check | task: Verify matrices and ledgers support dense scanning without overflow. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-GOV-S3-003 | area: Governance Console/Governance.md | kind: bug-check | task: Verify compliance status uses labels beyond color. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-GOV-S3-004 | area: Governance Console/Governance.md | kind: bug-check | task: Verify authority links expose evidence and effective dates. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Governance Console/Release.md

- [ ] GC-REL-S2-001 | area: Governance Console/Release.md | kind: screen | task: Release home. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-REL-S2-002 | area: Governance Console/Release.md | kind: screen | task: Release surface. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-REL-S2-003 | area: Governance Console/Release.md | kind: screen | task: Release tuple. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-REL-S2-004 | area: Governance Console/Release.md | kind: screen | task: Release evidence. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-REL-S2-005 | area: Governance Console/Release.md | kind: screen | task: Release approval. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-REL-S2-006 | area: Governance Console/Release.md | kind: screen | task: Release blocked state. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-REL-S2-007 | area: Governance Console/Release.md | kind: screen | task: Release acknowledged state. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-REL-S3-001 | area: Governance Console/Release.md | kind: bug-check | task: Verify release environment, scope, and status are visible together. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-REL-S3-002 | area: Governance Console/Release.md | kind: bug-check | task: Verify blocked/approved/released states are visually and textually distinct. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-REL-S3-003 | area: Governance Console/Release.md | kind: bug-check | task: Verify release evidence is accessible before final actions. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] GC-REL-S3-004 | area: Governance Console/Release.md | kind: bug-check | task: Verify acknowledgement states persist after navigation. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Hub Desk/Acting access UI.md

- [ ] HD-AA-S2-001 | area: Hub Desk/Acting access UI.md | kind: screen | task: Status authority strip. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-AA-S2-002 | area: Hub Desk/Acting access UI.md | kind: screen | task: Acting context chip. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-AA-S2-003 | area: Hub Desk/Acting access UI.md | kind: screen | task: Scope summary strip. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-AA-S2-004 | area: Hub Desk/Acting access UI.md | kind: screen | task: Acting site switcher. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-AA-S2-005 | area: Hub Desk/Acting access UI.md | kind: screen | task: Purpose-of-use panel. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-AA-S2-006 | area: Hub Desk/Acting access UI.md | kind: screen | task: Scope drift freeze banner. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-AA-S2-007 | area: Hub Desk/Acting access UI.md | kind: screen | task: Access denied state. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-AA-S2-008 | area: Hub Desk/Acting access UI.md | kind: screen | task: Break-glass reason modal. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-AA-S2-009 | area: Hub Desk/Acting access UI.md | kind: screen | task: Organisation switch drawer. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-AA-S3-001 | area: Hub Desk/Acting access UI.md | kind: bug-check | task: Verify acting context is always visible before privileged actions. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-AA-S3-002 | area: Hub Desk/Acting access UI.md | kind: bug-check | task: Verify site switching explains downstream impact before commit. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-AA-S3-003 | area: Hub Desk/Acting access UI.md | kind: bug-check | task: Verify access denied and scope drift states offer safe recovery without hidden controls. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-AA-S3-004 | area: Hub Desk/Acting access UI.md | kind: bug-check | task: Verify break-glass modal uses correct focus trap, reason validation, and audit copy. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Hub Desk/Alternatives.md

- [ ] HD-ALT-S2-001 | area: Hub Desk/Alternatives.md | kind: screen | task: Alternatives route. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-ALT-S2-002 | area: Hub Desk/Alternatives.md | kind: screen | task: No-slot resolution panel. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-ALT-S2-003 | area: Hub Desk/Alternatives.md | kind: screen | task: Callback transfer pending state. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-ALT-S2-004 | area: Hub Desk/Alternatives.md | kind: screen | task: Return-to-practice receipt. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-ALT-S2-005 | area: Hub Desk/Alternatives.md | kind: screen | task: Alternative offer list. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-ALT-S2-006 | area: Hub Desk/Alternatives.md | kind: screen | task: Alternative comparison state. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-ALT-S3-001 | area: Hub Desk/Alternatives.md | kind: bug-check | task: Verify alternatives are comparable by location, time, constraint, and risk. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-ALT-S3-002 | area: Hub Desk/Alternatives.md | kind: bug-check | task: Verify pending transfer states prevent duplicate actions. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-ALT-S3-003 | area: Hub Desk/Alternatives.md | kind: bug-check | task: Verify return-to-practice receipt is distinct from successful hub resolution. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-ALT-S3-004 | area: Hub Desk/Alternatives.md | kind: bug-check | task: Verify no-slot language explains next ownership clearly. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Hub Desk/Audit.md

- [ ] HD-AUD-S2-001 | area: Hub Desk/Audit.md | kind: screen | task: Audit route. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-AUD-S2-002 | area: Hub Desk/Audit.md | kind: screen | task: Access scope transition receipt. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-AUD-S2-003 | area: Hub Desk/Audit.md | kind: screen | task: Visibility envelope legend. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-AUD-S2-004 | area: Hub Desk/Audit.md | kind: screen | task: Minimum-necessary placeholder block. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-AUD-S2-005 | area: Hub Desk/Audit.md | kind: screen | task: Provenance evidence. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-AUD-S2-006 | area: Hub Desk/Audit.md | kind: screen | task: Audit detail state. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-AUD-S3-001 | area: Hub Desk/Audit.md | kind: bug-check | task: Verify audit records are readable without exposing unnecessary patient details. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-AUD-S3-002 | area: Hub Desk/Audit.md | kind: bug-check | task: Verify scope transitions are easy to compare chronologically. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-AUD-S3-003 | area: Hub Desk/Audit.md | kind: bug-check | task: Verify visibility legend explains hidden/redacted content. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-AUD-S3-004 | area: Hub Desk/Audit.md | kind: bug-check | task: Verify audit filters and receipts have accessible names. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Hub Desk/Commit confirmation.md

- [ ] HD-CC-S2-001 | area: Hub Desk/Commit confirmation.md | kind: screen | task: Commit confirmation pane. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-CC-S2-002 | area: Hub Desk/Commit confirmation.md | kind: screen | task: Settlement receipt. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-CC-S2-003 | area: Hub Desk/Commit confirmation.md | kind: screen | task: Commit attempt timeline. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-CC-S2-004 | area: Hub Desk/Commit confirmation.md | kind: screen | task: Practice acknowledgement indicator. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-CC-S2-005 | area: Hub Desk/Commit confirmation.md | kind: screen | task: Practice visibility panel. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-CC-S2-006 | area: Hub Desk/Commit confirmation.md | kind: screen | task: Continuity delivery evidence drawer. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-CC-S2-007 | area: Hub Desk/Commit confirmation.md | kind: screen | task: Imported confirmation review panel. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-CC-S2-008 | area: Hub Desk/Commit confirmation.md | kind: screen | task: Supplier drift banner. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-CC-S2-009 | area: Hub Desk/Commit confirmation.md | kind: screen | task: Manual native booking proof modal. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-CC-S3-001 | area: Hub Desk/Commit confirmation.md | kind: bug-check | task: Verify commit success, pending, imported, manual, and drift states are visually distinct. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-CC-S3-002 | area: Hub Desk/Commit confirmation.md | kind: bug-check | task: Verify proof drawers and modals restore focus to the triggering control. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-CC-S3-003 | area: Hub Desk/Commit confirmation.md | kind: bug-check | task: Verify acknowledgement status does not look like final settlement unless it is final. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-CC-S3-004 | area: Hub Desk/Commit confirmation.md | kind: bug-check | task: Verify manual proof copy states what evidence is required. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Hub Desk/Exceptions.md

- [ ] HD-EX-S2-001 | area: Hub Desk/Exceptions.md | kind: screen | task: Exceptions route. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-EX-S2-002 | area: Hub Desk/Exceptions.md | kind: screen | task: Exception queue view. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-EX-S2-003 | area: Hub Desk/Exceptions.md | kind: screen | task: Exception detail drawer. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-EX-S2-004 | area: Hub Desk/Exceptions.md | kind: screen | task: Urgent bounce-back banner. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-EX-S2-005 | area: Hub Desk/Exceptions.md | kind: screen | task: Recovery diff strip. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-EX-S2-006 | area: Hub Desk/Exceptions.md | kind: screen | task: Reopen provenance stub. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-EX-S2-007 | area: Hub Desk/Exceptions.md | kind: screen | task: Supervisor escalation panel. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-EX-S2-008 | area: Hub Desk/Exceptions.md | kind: screen | task: Recovery case canvas. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-EX-S3-001 | area: Hub Desk/Exceptions.md | kind: bug-check | task: Verify exception severity and required owner are immediately visible. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-EX-S3-002 | area: Hub Desk/Exceptions.md | kind: bug-check | task: Verify drawers trap and restore focus correctly. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-EX-S3-003 | area: Hub Desk/Exceptions.md | kind: bug-check | task: Verify recovery diff makes before/after changes understandable. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-EX-S3-004 | area: Hub Desk/Exceptions.md | kind: bug-check | task: Verify urgent bounce-back cannot be dismissed without a clear recovery route. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Hub Desk/Hub case.md

- [ ] HD-HC-S2-001 | area: Hub Desk/Hub case.md | kind: screen | task: Hub case route. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-HC-S2-002 | area: Hub Desk/Hub case.md | kind: screen | task: Case canvas. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-HC-S2-003 | area: Hub Desk/Hub case.md | kind: screen | task: Case stage host. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-HC-S2-004 | area: Hub Desk/Hub case.md | kind: screen | task: Right rail host. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-HC-S2-005 | area: Hub Desk/Hub case.md | kind: screen | task: Decision dock host. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-HC-S2-006 | area: Hub Desk/Hub case.md | kind: screen | task: Support drawer. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-HC-S2-007 | area: Hub Desk/Hub case.md | kind: screen | task: Mission stack continuity binder. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-HC-S3-001 | area: Hub Desk/Hub case.md | kind: bug-check | task: Verify patient/case context, acting site, and coordination stage stay visible. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-HC-S3-002 | area: Hub Desk/Hub case.md | kind: bug-check | task: Verify right-rail and support drawer interactions do not hide decision controls. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-HC-S3-003 | area: Hub Desk/Hub case.md | kind: bug-check | task: Verify continuity binder communicates saved/restored work. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-HC-S3-004 | area: Hub Desk/Hub case.md | kind: bug-check | task: Verify case stage labels are meaningful without relying only on color. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Hub Desk/Hub queue.md

- [ ] HD-HQ-S2-001 | area: Hub Desk/Hub queue.md | kind: screen | task: Hub queue route. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-HQ-S2-002 | area: Hub Desk/Hub queue.md | kind: screen | task: Saved view rail. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-HQ-S2-003 | area: Hub Desk/Hub queue.md | kind: screen | task: Queue workbench. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-HQ-S2-004 | area: Hub Desk/Hub queue.md | kind: screen | task: Queue entry strip. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-HQ-S2-005 | area: Hub Desk/Hub queue.md | kind: screen | task: Start-of-day resume card. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-HQ-S2-006 | area: Hub Desk/Hub queue.md | kind: screen | task: Queue empty state. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-HQ-S2-007 | area: Hub Desk/Hub queue.md | kind: screen | task: Queue overloaded state. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-HQ-S3-001 | area: Hub Desk/Hub queue.md | kind: bug-check | task: Verify coordination priority, site, status, and next action are visible in each row/card. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-HQ-S3-002 | area: Hub Desk/Hub queue.md | kind: bug-check | task: Verify saved views and filters are reversible and clearly active. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-HQ-S3-003 | area: Hub Desk/Hub queue.md | kind: bug-check | task: Verify resume card does not compete with urgent queue items. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] HD-HQ-S3-004 | area: Hub Desk/Hub queue.md | kind: bug-check | task: Verify queue density remains readable on laptop widths. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Mock And Studio Apps/Evidence Gate Lab.md

- [ ] MSA-EGL-S2-001 | area: Mock And Studio Apps/Evidence Gate Lab.md | kind: screen | task: Evidence gate pages. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-EGL-S2-002 | area: Mock And Studio Apps/Evidence Gate Lab.md | kind: screen | task: Job rail. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-EGL-S2-003 | area: Mock And Studio Apps/Evidence Gate Lab.md | kind: screen | task: Job profiles. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-EGL-S2-004 | area: Mock And Studio Apps/Evidence Gate Lab.md | kind: screen | task: Workspace. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-EGL-S2-005 | area: Mock And Studio Apps/Evidence Gate Lab.md | kind: screen | task: Transcript scenario. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-EGL-S2-006 | area: Mock And Studio Apps/Evidence Gate Lab.md | kind: screen | task: Transcript select. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-EGL-S2-007 | area: Mock And Studio Apps/Evidence Gate Lab.md | kind: screen | task: Transcript simulate. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-EGL-S2-008 | area: Mock And Studio Apps/Evidence Gate Lab.md | kind: screen | task: Transcript retry. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-EGL-S2-009 | area: Mock And Studio Apps/Evidence Gate Lab.md | kind: screen | task: Transcript supersede. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-EGL-S2-010 | area: Mock And Studio Apps/Evidence Gate Lab.md | kind: screen | task: Scan scenario. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-EGL-S2-011 | area: Mock And Studio Apps/Evidence Gate Lab.md | kind: screen | task: Scan select. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-EGL-S2-012 | area: Mock And Studio Apps/Evidence Gate Lab.md | kind: screen | task: Scan simulate. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-EGL-S2-013 | area: Mock And Studio Apps/Evidence Gate Lab.md | kind: screen | task: Scan retry. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-EGL-S2-014 | area: Mock And Studio Apps/Evidence Gate Lab.md | kind: screen | task: Scan review. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-EGL-S2-015 | area: Mock And Studio Apps/Evidence Gate Lab.md | kind: screen | task: Event inspector. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-EGL-S2-016 | area: Mock And Studio Apps/Evidence Gate Lab.md | kind: screen | task: Actual fields. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-EGL-S2-017 | area: Mock And Studio Apps/Evidence Gate Lab.md | kind: screen | task: Policy drawer. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-EGL-S2-018 | area: Mock And Studio Apps/Evidence Gate Lab.md | kind: screen | task: Pipeline diagram. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-EGL-S3-001 | area: Mock And Studio Apps/Evidence Gate Lab.md | kind: bug-check | task: Verify transcript and scan workflows are clearly different. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-EGL-S3-002 | area: Mock And Studio Apps/Evidence Gate Lab.md | kind: bug-check | task: Verify retry and supersede actions explain their consequence. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-EGL-S3-003 | area: Mock And Studio Apps/Evidence Gate Lab.md | kind: bug-check | task: Verify event inspector and policy drawer preserve selected job context. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-EGL-S3-004 | area: Mock And Studio Apps/Evidence Gate Lab.md | kind: bug-check | task: Verify pipeline state is readable and accessible without relying only on color. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Mock And Studio Apps/IM1 Pairing Studio.md

- [ ] MSA-IM1-S2-001 | area: Mock And Studio Apps/IM1 Pairing Studio.md | kind: screen | task: IM1 readiness overview. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-IM1-S2-002 | area: Mock And Studio Apps/IM1 Pairing Studio.md | kind: screen | task: Prerequisites dossier. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-IM1-S2-003 | area: Mock And Studio Apps/IM1 Pairing Studio.md | kind: screen | task: SCAL artifact map. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-IM1-S2-004 | area: Mock And Studio Apps/IM1 Pairing Studio.md | kind: screen | task: Provider compatibility matrix. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-IM1-S2-005 | area: Mock And Studio Apps/IM1 Pairing Studio.md | kind: screen | task: Licence and RFC watch. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-IM1-S2-006 | area: Mock And Studio Apps/IM1 Pairing Studio.md | kind: screen | task: Stage rail. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-IM1-S2-007 | area: Mock And Studio Apps/IM1 Pairing Studio.md | kind: screen | task: Evidence drawer. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-IM1-S2-008 | area: Mock And Studio Apps/IM1 Pairing Studio.md | kind: screen | task: Provider matrix. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-IM1-S2-009 | area: Mock And Studio Apps/IM1 Pairing Studio.md | kind: screen | task: Live gates. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-IM1-S2-010 | area: Mock And Studio Apps/IM1 Pairing Studio.md | kind: screen | task: Actual fields. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-IM1-S2-011 | area: Mock And Studio Apps/IM1 Pairing Studio.md | kind: screen | task: Flow diagram. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-IM1-S3-001 | area: Mock And Studio Apps/IM1 Pairing Studio.md | kind: bug-check | task: Verify readiness status and provider compatibility are not conflated. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-IM1-S3-002 | area: Mock And Studio Apps/IM1 Pairing Studio.md | kind: bug-check | task: Verify SCAL artifacts show missing, stale, accepted, and rejected states. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-IM1-S3-003 | area: Mock And Studio Apps/IM1 Pairing Studio.md | kind: bug-check | task: Verify licence/RFC watch calls out blocker severity and next owner. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-IM1-S3-004 | area: Mock And Studio Apps/IM1 Pairing Studio.md | kind: bug-check | task: Verify matrices remain readable with multiple providers and long artifact names. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Mock And Studio Apps/MESH Mailroom.md

- [ ] MSA-MESH-S2-001 | area: Mock And Studio Apps/MESH Mailroom.md | kind: screen | task: Mailbox rail. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-MESH-S2-002 | area: Mock And Studio Apps/MESH Mailroom.md | kind: screen | task: Page tabs. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-MESH-S2-003 | area: Mock And Studio Apps/MESH Mailroom.md | kind: screen | task: Mailbox buttons. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-MESH-S2-004 | area: Mock And Studio Apps/MESH Mailroom.md | kind: screen | task: Workflow rows. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-MESH-S2-005 | area: Mock And Studio Apps/MESH Mailroom.md | kind: screen | task: Workflow validation banner. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-MESH-S2-006 | area: Mock And Studio Apps/MESH Mailroom.md | kind: screen | task: Workflow validation message. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-MESH-S2-007 | area: Mock And Studio Apps/MESH Mailroom.md | kind: screen | task: Timeline workbench. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-MESH-S2-008 | area: Mock And Studio Apps/MESH Mailroom.md | kind: screen | task: Advance lifecycle action. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-MESH-S2-009 | area: Mock And Studio Apps/MESH Mailroom.md | kind: screen | task: Live gates. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-MESH-S2-010 | area: Mock And Studio Apps/MESH Mailroom.md | kind: screen | task: Actual fields. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-MESH-S2-011 | area: Mock And Studio Apps/MESH Mailroom.md | kind: screen | task: Send message action. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-MESH-S2-012 | area: Mock And Studio Apps/MESH Mailroom.md | kind: screen | task: Workflow select. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-MESH-S2-013 | area: Mock And Studio Apps/MESH Mailroom.md | kind: screen | task: Scenario select. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-MESH-S2-014 | area: Mock And Studio Apps/MESH Mailroom.md | kind: screen | task: Message list. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-MESH-S2-015 | area: Mock And Studio Apps/MESH Mailroom.md | kind: screen | task: Event list. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-MESH-S2-016 | area: Mock And Studio Apps/MESH Mailroom.md | kind: screen | task: Proof inspector. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-MESH-S2-017 | area: Mock And Studio Apps/MESH Mailroom.md | kind: screen | task: Lineage strip. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-MESH-S3-001 | area: Mock And Studio Apps/MESH Mailroom.md | kind: bug-check | task: Verify mailbox, workflow, and scenario context stay visible together. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-MESH-S3-002 | area: Mock And Studio Apps/MESH Mailroom.md | kind: bug-check | task: Verify lifecycle controls prevent unsafe repeated sends or advances. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-MESH-S3-003 | area: Mock And Studio Apps/MESH Mailroom.md | kind: bug-check | task: Verify message and event lists handle long IDs without overflow. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-MESH-S3-004 | area: Mock And Studio Apps/MESH Mailroom.md | kind: bug-check | task: Verify proof inspector is reachable and clearly tied to the selected event. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Mock And Studio Apps/Mock NHS Login.md

- [ ] MSA-MNL-S2-001 | area: Mock And Studio Apps/Mock NHS Login.md | kind: screen | task: Admin view. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-MNL-S2-002 | area: Mock And Studio Apps/Mock NHS Login.md | kind: screen | task: Sign-in view. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-MNL-S2-003 | area: Mock And Studio Apps/Mock NHS Login.md | kind: screen | task: Consent view. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-MNL-S2-004 | area: Mock And Studio Apps/Mock NHS Login.md | kind: screen | task: Return view. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-MNL-S2-005 | area: Mock And Studio Apps/Mock NHS Login.md | kind: screen | task: Settings view. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-MNL-S2-006 | area: Mock And Studio Apps/Mock NHS Login.md | kind: screen | task: Pending redirect state. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-MNL-S2-007 | area: Mock And Studio Apps/Mock NHS Login.md | kind: screen | task: Error or declined state. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-MNL-S3-001 | area: Mock And Studio Apps/Mock NHS Login.md | kind: bug-check | task: Verify simulator mode is obvious and cannot be mistaken for production NHS login. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-MNL-S3-002 | area: Mock And Studio Apps/Mock NHS Login.md | kind: bug-check | task: Verify sign-in and consent flows have clear primary/secondary action hierarchy. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-MNL-S3-003 | area: Mock And Studio Apps/Mock NHS Login.md | kind: bug-check | task: Verify return and error states explain the redirect outcome. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-MNL-S3-004 | area: Mock And Studio Apps/Mock NHS Login.md | kind: bug-check | task: Verify settings changes are visible before the next simulated flow. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Mock And Studio Apps/NHS App Onboarding Studio.md

- [ ] MSA-NAOS-S2-001 | area: Mock And Studio Apps/NHS App Onboarding Studio.md | kind: screen | task: Deferred banner. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-NAOS-S2-002 | area: Mock And Studio Apps/NHS App Onboarding Studio.md | kind: screen | task: Readiness state. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-NAOS-S2-003 | area: Mock And Studio Apps/NHS App Onboarding Studio.md | kind: screen | task: Mode switch. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-NAOS-S2-004 | area: Mock And Studio Apps/NHS App Onboarding Studio.md | kind: screen | task: Stage rail. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-NAOS-S2-005 | area: Mock And Studio Apps/NHS App Onboarding Studio.md | kind: screen | task: Page tabs. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-NAOS-S2-006 | area: Mock And Studio Apps/NHS App Onboarding Studio.md | kind: screen | task: Eligibility chips. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-NAOS-S2-007 | area: Mock And Studio Apps/NHS App Onboarding Studio.md | kind: screen | task: Artifact toggles. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-NAOS-S2-008 | area: Mock And Studio Apps/NHS App Onboarding Studio.md | kind: screen | task: Standalone preview. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-NAOS-S2-009 | area: Mock And Studio Apps/NHS App Onboarding Studio.md | kind: screen | task: Embedded preview. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-NAOS-S2-010 | area: Mock And Studio Apps/NHS App Onboarding Studio.md | kind: screen | task: Live-gate board. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-NAOS-S2-011 | area: Mock And Studio Apps/NHS App Onboarding Studio.md | kind: screen | task: Environment ladder. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-NAOS-S2-012 | area: Mock And Studio Apps/NHS App Onboarding Studio.md | kind: screen | task: Evidence drawer. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-NAOS-S3-001 | area: Mock And Studio Apps/NHS App Onboarding Studio.md | kind: bug-check | task: Verify readiness, eligibility, and live-gate statuses use consistent labels. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-NAOS-S3-002 | area: Mock And Studio Apps/NHS App Onboarding Studio.md | kind: bug-check | task: Verify previews are clearly marked as standalone or embedded. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-NAOS-S3-003 | area: Mock And Studio Apps/NHS App Onboarding Studio.md | kind: bug-check | task: Verify environment ladder shows current, blocked, and complete states. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-NAOS-S3-004 | area: Mock And Studio Apps/NHS App Onboarding Studio.md | kind: bug-check | task: Verify evidence drawer preserves page tab context. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Mock And Studio Apps/NHS App Site Link Studio.md

- [ ] MSA-NASLS-S2-001 | area: Mock And Studio Apps/NHS App Site Link Studio.md | kind: screen | task: Route path allowlist. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-NASLS-S2-002 | area: Mock And Studio Apps/NHS App Site Link Studio.md | kind: screen | task: Android assetlinks generator. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-NASLS-S2-003 | area: Mock And Studio Apps/NHS App Site Link Studio.md | kind: screen | task: iOS AASA generator. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-NASLS-S2-004 | area: Mock And Studio Apps/NHS App Site Link Studio.md | kind: screen | task: Local hosting validator. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-NASLS-S2-005 | area: Mock And Studio Apps/NHS App Site Link Studio.md | kind: screen | task: Real registration gates. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-NASLS-S2-006 | area: Mock And Studio Apps/NHS App Site Link Studio.md | kind: screen | task: Route tree. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-NASLS-S2-007 | area: Mock And Studio Apps/NHS App Site Link Studio.md | kind: screen | task: Route filter. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-NASLS-S2-008 | area: Mock And Studio Apps/NHS App Site Link Studio.md | kind: screen | task: Inspector. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-NASLS-S2-009 | area: Mock And Studio Apps/NHS App Site Link Studio.md | kind: screen | task: Environment switcher. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-NASLS-S2-010 | area: Mock And Studio Apps/NHS App Site Link Studio.md | kind: screen | task: Platform switcher. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-NASLS-S2-011 | area: Mock And Studio Apps/NHS App Site Link Studio.md | kind: screen | task: Route diagram. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-NASLS-S2-012 | area: Mock And Studio Apps/NHS App Site Link Studio.md | kind: screen | task: Reduced-motion preview. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-NASLS-S3-001 | area: Mock And Studio Apps/NHS App Site Link Studio.md | kind: bug-check | task: Verify generated Android and iOS metadata is readable and copyable. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-NASLS-S3-002 | area: Mock And Studio Apps/NHS App Site Link Studio.md | kind: bug-check | task: Verify route allowlist validation explains pass/fail causes. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-NASLS-S3-003 | area: Mock And Studio Apps/NHS App Site Link Studio.md | kind: bug-check | task: Verify environment and platform switches update dependent panels clearly. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-NASLS-S3-004 | area: Mock And Studio Apps/NHS App Site Link Studio.md | kind: bug-check | task: Verify route diagrams remain readable with many routes. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Mock And Studio Apps/NHS Login Onboarding Studio.md

- [ ] MSA-NLOS-S2-001 | area: Mock And Studio Apps/NHS Login Onboarding Studio.md | kind: screen | task: Readiness banner. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-NLOS-S2-002 | area: Mock And Studio Apps/NHS Login Onboarding Studio.md | kind: screen | task: Mode switch. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-NLOS-S2-003 | area: Mock And Studio Apps/NHS Login Onboarding Studio.md | kind: screen | task: Stage rail. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-NLOS-S2-004 | area: Mock And Studio Apps/NHS Login Onboarding Studio.md | kind: screen | task: Form sections. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-NLOS-S2-005 | area: Mock And Studio Apps/NHS Login Onboarding Studio.md | kind: screen | task: Artifact panel. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-NLOS-S2-006 | area: Mock And Studio Apps/NHS Login Onboarding Studio.md | kind: screen | task: Checkpoint panel. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-NLOS-S2-007 | area: Mock And Studio Apps/NHS Login Onboarding Studio.md | kind: screen | task: Process parity panel. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-NLOS-S2-008 | area: Mock And Studio Apps/NHS Login Onboarding Studio.md | kind: screen | task: Evidence drawer. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-NLOS-S2-009 | area: Mock And Studio Apps/NHS Login Onboarding Studio.md | kind: screen | task: Actual submission notice. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-NLOS-S3-001 | area: Mock And Studio Apps/NHS Login Onboarding Studio.md | kind: bug-check | task: Verify stage progress and readiness status are understandable together. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-NLOS-S3-002 | area: Mock And Studio Apps/NHS Login Onboarding Studio.md | kind: bug-check | task: Verify artifact requirements show missing, complete, and blocked states. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-NLOS-S3-003 | area: Mock And Studio Apps/NHS Login Onboarding Studio.md | kind: bug-check | task: Verify evidence drawer does not hide active form controls. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-NLOS-S3-004 | area: Mock And Studio Apps/NHS Login Onboarding Studio.md | kind: bug-check | task: Verify actual-submission warnings are prominent and unambiguous. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Mock And Studio Apps/Notification Studio.md

- [ ] MSA-NS-S2-001 | area: Mock And Studio Apps/Notification Studio.md | kind: screen | task: Template rail. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-NS-S2-002 | area: Mock And Studio Apps/Notification Studio.md | kind: screen | task: Page tabs. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-NS-S2-003 | area: Mock And Studio Apps/Notification Studio.md | kind: screen | task: Template buttons. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-NS-S2-004 | area: Mock And Studio Apps/Notification Studio.md | kind: screen | task: Workspace. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-NS-S2-005 | area: Mock And Studio Apps/Notification Studio.md | kind: screen | task: Scenario select. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-NS-S2-006 | area: Mock And Studio Apps/Notification Studio.md | kind: screen | task: Simulate message action. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-NS-S2-007 | area: Mock And Studio Apps/Notification Studio.md | kind: screen | task: Delivery timeline. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-NS-S2-008 | area: Mock And Studio Apps/Notification Studio.md | kind: screen | task: Retry action. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-NS-S2-009 | area: Mock And Studio Apps/Notification Studio.md | kind: screen | task: Repair action. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-NS-S2-010 | area: Mock And Studio Apps/Notification Studio.md | kind: screen | task: Settle action. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-NS-S2-011 | area: Mock And Studio Apps/Notification Studio.md | kind: screen | task: Actual fields. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-NS-S2-012 | area: Mock And Studio Apps/Notification Studio.md | kind: screen | task: Lower diagram. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-NS-S2-013 | area: Mock And Studio Apps/Notification Studio.md | kind: screen | task: Inspector panel. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-NS-S3-001 | area: Mock And Studio Apps/Notification Studio.md | kind: bug-check | task: Verify template selection and scenario selection are clearly separate. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-NS-S3-002 | area: Mock And Studio Apps/Notification Studio.md | kind: bug-check | task: Verify delivery timeline distinguishes queued, sent, failed, repaired, and settled states. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-NS-S3-003 | area: Mock And Studio Apps/Notification Studio.md | kind: bug-check | task: Verify retry/repair/settle actions have confirmation and outcome feedback. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-NS-S3-004 | area: Mock And Studio Apps/Notification Studio.md | kind: bug-check | task: Verify simulated message content is readable with long variables. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Mock And Studio Apps/PDS Access Studio.md

- [ ] MSA-PDS-S2-001 | area: Mock And Studio Apps/PDS Access Studio.md | kind: screen | task: PDS flag overview. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-PDS-S2-002 | area: Mock And Studio Apps/PDS Access Studio.md | kind: screen | task: Access mode lattice. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-PDS-S2-003 | area: Mock And Studio Apps/PDS Access Studio.md | kind: screen | task: Use case and legal basis. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-PDS-S2-004 | area: Mock And Studio Apps/PDS Access Studio.md | kind: screen | task: Risk log and hazard map. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-PDS-S2-005 | area: Mock And Studio Apps/PDS Access Studio.md | kind: screen | task: Rollback and kill switches. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-PDS-S2-006 | area: Mock And Studio Apps/PDS Access Studio.md | kind: screen | task: Feature flag select. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-PDS-S2-007 | area: Mock And Studio Apps/PDS Access Studio.md | kind: screen | task: Access mode select. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-PDS-S2-008 | area: Mock And Studio Apps/PDS Access Studio.md | kind: screen | task: Scenario select. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-PDS-S2-009 | area: Mock And Studio Apps/PDS Access Studio.md | kind: screen | task: Trace query. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-PDS-S2-010 | area: Mock And Studio Apps/PDS Access Studio.md | kind: screen | task: Trace run. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-PDS-S2-011 | area: Mock And Studio Apps/PDS Access Studio.md | kind: screen | task: Trace status. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-PDS-S2-012 | area: Mock And Studio Apps/PDS Access Studio.md | kind: screen | task: Legal basis textarea. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-PDS-S2-013 | area: Mock And Studio Apps/PDS Access Studio.md | kind: screen | task: Live gate rows. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-PDS-S2-014 | area: Mock And Studio Apps/PDS Access Studio.md | kind: screen | task: Actual fields. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-PDS-S2-015 | area: Mock And Studio Apps/PDS Access Studio.md | kind: screen | task: Route rail. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-PDS-S2-016 | area: Mock And Studio Apps/PDS Access Studio.md | kind: screen | task: Lineage strip. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-PDS-S2-017 | area: Mock And Studio Apps/PDS Access Studio.md | kind: screen | task: Inspector. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-PDS-S3-001 | area: Mock And Studio Apps/PDS Access Studio.md | kind: bug-check | task: Verify access modes and legal basis are visible before enabling risky controls. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-PDS-S3-002 | area: Mock And Studio Apps/PDS Access Studio.md | kind: bug-check | task: Verify hazard and rollback panels show severity, owner, and current status. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-PDS-S3-003 | area: Mock And Studio Apps/PDS Access Studio.md | kind: bug-check | task: Verify trace results have loading, failed, and empty states. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-PDS-S3-004 | area: Mock And Studio Apps/PDS Access Studio.md | kind: bug-check | task: Verify kill-switch controls have confirmation and unmistakable warning copy. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Mock And Studio Apps/Telephony Lab.md

- [ ] MSA-TEL-S2-001 | area: Mock And Studio Apps/Telephony Lab.md | kind: screen | task: Number rail. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-TEL-S2-002 | area: Mock And Studio Apps/Telephony Lab.md | kind: screen | task: Page tabs. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-TEL-S2-003 | area: Mock And Studio Apps/Telephony Lab.md | kind: screen | task: Flow editor. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-TEL-S2-004 | area: Mock And Studio Apps/Telephony Lab.md | kind: screen | task: Assign number action. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-TEL-S2-005 | area: Mock And Studio Apps/Telephony Lab.md | kind: screen | task: Release number action. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-TEL-S2-006 | area: Mock And Studio Apps/Telephony Lab.md | kind: screen | task: Scenario select. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-TEL-S2-007 | area: Mock And Studio Apps/Telephony Lab.md | kind: screen | task: Carrier base URL. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-TEL-S2-008 | area: Mock And Studio Apps/Telephony Lab.md | kind: screen | task: Simulate call action. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-TEL-S2-009 | area: Mock And Studio Apps/Telephony Lab.md | kind: screen | task: Advance call action. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-TEL-S2-010 | area: Mock And Studio Apps/Telephony Lab.md | kind: screen | task: Retry webhook action. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-TEL-S2-011 | area: Mock And Studio Apps/Telephony Lab.md | kind: screen | task: Actual fields. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-TEL-S2-012 | area: Mock And Studio Apps/Telephony Lab.md | kind: screen | task: Event stream. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-TEL-S2-013 | area: Mock And Studio Apps/Telephony Lab.md | kind: screen | task: Call cards. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-TEL-S2-014 | area: Mock And Studio Apps/Telephony Lab.md | kind: screen | task: Lower diagram. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-TEL-S2-015 | area: Mock And Studio Apps/Telephony Lab.md | kind: screen | task: Inspector panel. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-TEL-S3-001 | area: Mock And Studio Apps/Telephony Lab.md | kind: bug-check | task: Verify number assignment/release actions are guarded and show outcome. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-TEL-S3-002 | area: Mock And Studio Apps/Telephony Lab.md | kind: bug-check | task: Verify call state and webhook state are visually distinct. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-TEL-S3-003 | area: Mock And Studio Apps/Telephony Lab.md | kind: bug-check | task: Verify event stream handles rapid updates without focus or scroll jumps. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] MSA-TEL-S3-004 | area: Mock And Studio Apps/Telephony Lab.md | kind: bug-check | task: Verify carrier URL and actual fields wrap without breaking the control surface. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Ops Console/Channel subpanels.md

- [ ] OC-CSP-S2-001 | area: Ops Console/Channel subpanels.md | kind: screen | task: Context tab. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-CSP-S2-002 | area: Ops Console/Channel subpanels.md | kind: screen | task: Freeze tab. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-CSP-S2-003 | area: Ops Console/Channel subpanels.md | kind: screen | task: Patient tab. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-CSP-S2-004 | area: Ops Console/Channel subpanels.md | kind: screen | task: Audit tab. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-CSP-S2-005 | area: Ops Console/Channel subpanels.md | kind: screen | task: Summary tiles. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-CSP-S2-006 | area: Ops Console/Channel subpanels.md | kind: screen | task: SSO continuity card. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-CSP-S2-007 | area: Ops Console/Channel subpanels.md | kind: screen | task: Freeze posture panel. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-CSP-S2-008 | area: Ops Console/Channel subpanels.md | kind: screen | task: Artifact posture card. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-CSP-S2-009 | area: Ops Console/Channel subpanels.md | kind: screen | task: Audit deep-link strip. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-CSP-S2-010 | area: Ops Console/Channel subpanels.md | kind: screen | task: Support recovery action bar. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-CSP-S2-011 | area: Ops Console/Channel subpanels.md | kind: screen | task: Channel state preview card. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-CSP-S3-001 | area: Ops Console/Channel subpanels.md | kind: bug-check | task: Verify tab labels match the route mode and selected case state. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-CSP-S3-002 | area: Ops Console/Channel subpanels.md | kind: bug-check | task: Verify freeze and recovery controls have confirmation and audit copy. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-CSP-S3-003 | area: Ops Console/Channel subpanels.md | kind: bug-check | task: Verify SSO continuity errors explain user impact and recovery owner. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-CSP-S3-004 | area: Ops Console/Channel subpanels.md | kind: bug-check | task: Verify deep links are copyable, accessible, and do not expose unsafe details. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Ops Console/NHS App channel workbench.md

- [ ] OC-NACW-S2-001 | area: Ops Console/NHS App channel workbench.md | kind: screen | task: Channel support route. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-NACW-S2-002 | area: Ops Console/NHS App channel workbench.md | kind: screen | task: Channel support case route. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-NACW-S2-003 | area: Ops Console/NHS App channel workbench.md | kind: screen | task: Channel release case route. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-NACW-S2-004 | area: Ops Console/NHS App channel workbench.md | kind: screen | task: Channel audit route. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-NACW-S2-005 | area: Ops Console/NHS App channel workbench.md | kind: screen | task: Channel case row. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-NACW-S2-006 | area: Ops Console/NHS App channel workbench.md | kind: screen | task: Channel workbench tab. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-NACW-S2-007 | area: Ops Console/NHS App channel workbench.md | kind: screen | task: Channel control workbench. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-NACW-S2-008 | area: Ops Console/NHS App channel workbench.md | kind: screen | task: Channel inspector dock toggle. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-NACW-S3-001 | area: Ops Console/NHS App channel workbench.md | kind: bug-check | task: Verify support, release, and audit modes have unmistakable visual context. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-NACW-S3-002 | area: Ops Console/NHS App channel workbench.md | kind: bug-check | task: Verify case rows show patient/channel risk without excessive detail. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-NACW-S3-003 | area: Ops Console/NHS App channel workbench.md | kind: bug-check | task: Verify inspector dock toggling does not lose selected case state. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-NACW-S3-004 | area: Ops Console/NHS App channel workbench.md | kind: bug-check | task: Verify audit routes are read-only where required. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Ops Console/NHS App readiness cockpit.md

- [ ] OC-NARC-S2-001 | area: Ops Console/NHS App readiness cockpit.md | kind: screen | task: Readiness cockpit. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-NARC-S2-002 | area: Ops Console/NHS App readiness cockpit.md | kind: screen | task: Routes inventory. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-NARC-S2-003 | area: Ops Console/NHS App readiness cockpit.md | kind: screen | task: Route detail. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-NARC-S2-004 | area: Ops Console/NHS App readiness cockpit.md | kind: screen | task: Embedded preview. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-NARC-S2-005 | area: Ops Console/NHS App readiness cockpit.md | kind: screen | task: Local preview environment. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-NARC-S2-006 | area: Ops Console/NHS App readiness cockpit.md | kind: screen | task: Sandpit environment. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-NARC-S2-007 | area: Ops Console/NHS App readiness cockpit.md | kind: screen | task: AOS environment. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-NARC-S2-008 | area: Ops Console/NHS App readiness cockpit.md | kind: screen | task: Limited release environment. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-NARC-S2-009 | area: Ops Console/NHS App readiness cockpit.md | kind: screen | task: Full release environment. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-NARC-S3-001 | area: Ops Console/NHS App readiness cockpit.md | kind: bug-check | task: Verify route readiness state is clear for every environment. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-NARC-S3-002 | area: Ops Console/NHS App readiness cockpit.md | kind: bug-check | task: Verify release/freeze states are not visually confused with support states. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-NARC-S3-003 | area: Ops Console/NHS App readiness cockpit.md | kind: bug-check | task: Verify embedded preview loads in device-safe dimensions without clipping. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-NARC-S3-004 | area: Ops Console/NHS App readiness cockpit.md | kind: bug-check | task: Verify route detail returns to the filtered route inventory correctly. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Ops Console/Ops board internals.md

- [ ] OC-OBI-S2-001 | area: Ops Console/Ops board internals.md | kind: screen | task: North-star metrics. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-OBI-S2-002 | area: Ops Console/Ops board internals.md | kind: screen | task: Service health grid. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-OBI-S2-003 | area: Ops Console/Ops board internals.md | kind: screen | task: Cohort impact matrix. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-OBI-S2-004 | area: Ops Console/Ops board internals.md | kind: screen | task: Anomaly ranking list. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-OBI-S2-005 | area: Ops Console/Ops board internals.md | kind: screen | task: Delta gate controls. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-OBI-S2-006 | area: Ops Console/Ops board internals.md | kind: screen | task: Selection lease panel. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-OBI-S2-007 | area: Ops Console/Ops board internals.md | kind: screen | task: Route intent display. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-OBI-S2-008 | area: Ops Console/Ops board internals.md | kind: screen | task: Governance handoff. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-OBI-S2-009 | area: Ops Console/Ops board internals.md | kind: screen | task: Return token. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-OBI-S3-001 | area: Ops Console/Ops board internals.md | kind: bug-check | task: Verify metrics include labels, units, trend direction, and stale-data state. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-OBI-S3-002 | area: Ops Console/Ops board internals.md | kind: bug-check | task: Verify matrices and grids remain legible with many rows. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-OBI-S3-003 | area: Ops Console/Ops board internals.md | kind: bug-check | task: Verify selected items are obvious across panels and preserved after drilldown. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-OBI-S3-004 | area: Ops Console/Ops board internals.md | kind: bug-check | task: Verify governance handoff communicates consequence and destination. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Ops Console/Ops child screens.md

- [ ] OC-OCS-S2-001 | area: Ops Console/Ops child screens.md | kind: screen | task: Overview investigations. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-OCS-S2-002 | area: Ops Console/Ops child screens.md | kind: screen | task: Overview interventions. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-OCS-S2-003 | area: Ops Console/Ops child screens.md | kind: screen | task: Overview compare. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-OCS-S2-004 | area: Ops Console/Ops child screens.md | kind: screen | task: Overview health. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-OCS-S2-005 | area: Ops Console/Ops child screens.md | kind: screen | task: Queues investigations. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-OCS-S2-006 | area: Ops Console/Ops child screens.md | kind: screen | task: Queues interventions. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-OCS-S2-007 | area: Ops Console/Ops child screens.md | kind: screen | task: Queues compare. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-OCS-S2-008 | area: Ops Console/Ops child screens.md | kind: screen | task: Queues health. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-OCS-S2-009 | area: Ops Console/Ops child screens.md | kind: screen | task: Capacity investigations. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-OCS-S2-010 | area: Ops Console/Ops child screens.md | kind: screen | task: Capacity interventions. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-OCS-S2-011 | area: Ops Console/Ops child screens.md | kind: screen | task: Capacity compare. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-OCS-S2-012 | area: Ops Console/Ops child screens.md | kind: screen | task: Capacity health. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-OCS-S2-013 | area: Ops Console/Ops child screens.md | kind: screen | task: Dependencies investigations. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-OCS-S2-014 | area: Ops Console/Ops child screens.md | kind: screen | task: Dependencies interventions. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-OCS-S2-015 | area: Ops Console/Ops child screens.md | kind: screen | task: Dependencies compare. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-OCS-S2-016 | area: Ops Console/Ops child screens.md | kind: screen | task: Dependencies health. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-OCS-S2-017 | area: Ops Console/Ops child screens.md | kind: screen | task: Audit investigations. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-OCS-S2-018 | area: Ops Console/Ops child screens.md | kind: screen | task: Audit interventions. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-OCS-S2-019 | area: Ops Console/Ops child screens.md | kind: screen | task: Audit compare. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-OCS-S2-020 | area: Ops Console/Ops child screens.md | kind: screen | task: Audit health. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-OCS-S2-021 | area: Ops Console/Ops child screens.md | kind: screen | task: Assurance investigations. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-OCS-S2-022 | area: Ops Console/Ops child screens.md | kind: screen | task: Assurance interventions. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-OCS-S2-023 | area: Ops Console/Ops child screens.md | kind: screen | task: Assurance compare. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-OCS-S2-024 | area: Ops Console/Ops child screens.md | kind: screen | task: Assurance health. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-OCS-S2-025 | area: Ops Console/Ops child screens.md | kind: screen | task: Incidents investigations. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-OCS-S2-026 | area: Ops Console/Ops child screens.md | kind: screen | task: Incidents interventions. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-OCS-S2-027 | area: Ops Console/Ops child screens.md | kind: screen | task: Incidents compare. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-OCS-S2-028 | area: Ops Console/Ops child screens.md | kind: screen | task: Incidents health. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-OCS-S2-029 | area: Ops Console/Ops child screens.md | kind: screen | task: Resilience investigations. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-OCS-S2-030 | area: Ops Console/Ops child screens.md | kind: screen | task: Resilience interventions. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-OCS-S2-031 | area: Ops Console/Ops child screens.md | kind: screen | task: Resilience compare. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-OCS-S2-032 | area: Ops Console/Ops child screens.md | kind: screen | task: Resilience health. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-OCS-S3-001 | area: Ops Console/Ops child screens.md | kind: bug-check | task: Verify every child screen has a clear parent lens, child type, and return path. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-OCS-S3-002 | area: Ops Console/Ops child screens.md | kind: bug-check | task: Verify compare screens align before/after or cohort data cleanly. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-OCS-S3-003 | area: Ops Console/Ops child screens.md | kind: bug-check | task: Verify intervention screens expose risk, owner, and rollback state. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-OCS-S3-004 | area: Ops Console/Ops child screens.md | kind: bug-check | task: Verify investigation and health screens use consistent severity language. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Ops Console/Ops root boards.md

- [ ] OC-ORB-S2-001 | area: Ops Console/Ops root boards.md | kind: screen | task: Overview board. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-ORB-S2-002 | area: Ops Console/Ops root boards.md | kind: screen | task: Queues board. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-ORB-S2-003 | area: Ops Console/Ops root boards.md | kind: screen | task: Capacity board. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-ORB-S2-004 | area: Ops Console/Ops root boards.md | kind: screen | task: Dependencies board. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-ORB-S2-005 | area: Ops Console/Ops root boards.md | kind: screen | task: Audit board. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-ORB-S2-006 | area: Ops Console/Ops root boards.md | kind: screen | task: Assurance board. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-ORB-S2-007 | area: Ops Console/Ops root boards.md | kind: screen | task: Incidents board. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-ORB-S2-008 | area: Ops Console/Ops root boards.md | kind: screen | task: Resilience board. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-ORB-S3-001 | area: Ops Console/Ops root boards.md | kind: bug-check | task: Verify each board has a clear lens title, active navigation state, and primary metric hierarchy. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-ORB-S3-002 | area: Ops Console/Ops root boards.md | kind: bug-check | task: Verify dense operational cards do not create horizontal overflow. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-ORB-S3-003 | area: Ops Console/Ops root boards.md | kind: bug-check | task: Verify board filters, time windows, and status legends are discoverable. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-ORB-S3-004 | area: Ops Console/Ops root boards.md | kind: bug-check | task: Verify empty/degraded data states still explain system health. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Ops Console/Readiness subpanels.md

- [ ] OC-RSP-S2-001 | area: Ops Console/Readiness subpanels.md | kind: screen | task: Readiness filter rail. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-RSP-S2-002 | area: Ops Console/Readiness subpanels.md | kind: screen | task: Environment tuple ribbon. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-RSP-S2-003 | area: Ops Console/Readiness subpanels.md | kind: screen | task: Topology strip. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-RSP-S2-004 | area: Ops Console/Readiness subpanels.md | kind: screen | task: Route freeze badge group. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-RSP-S2-005 | area: Ops Console/Readiness subpanels.md | kind: screen | task: Route inventory table. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-RSP-S2-006 | area: Ops Console/Readiness subpanels.md | kind: screen | task: Route inspector evidence tab. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-RSP-S2-007 | area: Ops Console/Readiness subpanels.md | kind: screen | task: Route inspector compatibility tab. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-RSP-S2-008 | area: Ops Console/Readiness subpanels.md | kind: screen | task: Route inspector continuity tab. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-RSP-S2-009 | area: Ops Console/Readiness subpanels.md | kind: screen | task: Preview capability panel. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-RSP-S2-010 | area: Ops Console/Readiness subpanels.md | kind: screen | task: Embedded preview panel. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-RSP-S2-011 | area: Ops Console/Readiness subpanels.md | kind: screen | task: Evidence drawer. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-RSP-S2-012 | area: Ops Console/Readiness subpanels.md | kind: screen | task: iOS safe-area preview mode. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-RSP-S2-013 | area: Ops Console/Readiness subpanels.md | kind: screen | task: Android compact preview mode. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-RSP-S2-014 | area: Ops Console/Readiness subpanels.md | kind: screen | task: Narrow laptop preview mode. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-RSP-S2-015 | area: Ops Console/Readiness subpanels.md | kind: screen | task: Reduced-motion preview mode. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-RSP-S3-001 | area: Ops Console/Readiness subpanels.md | kind: bug-check | task: Verify filters, badges, and table rows share the same readiness vocabulary. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-RSP-S3-002 | area: Ops Console/Readiness subpanels.md | kind: bug-check | task: Verify inspector tabs preserve selected route context. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-RSP-S3-003 | area: Ops Console/Readiness subpanels.md | kind: bug-check | task: Verify evidence drawer does not hide route decision controls. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] OC-RSP-S3-004 | area: Ops Console/Readiness subpanels.md | kind: bug-check | task: Verify preview modes show the actual constraint being tested. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Patient Web/Account contact truth.md

- [ ] PW-ACT-S2-001 | area: Patient Web/Account contact truth.md | kind: screen | task: Contact summary. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-ACT-S2-002 | area: Patient Web/Account contact truth.md | kind: screen | task: Source truth cards. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-ACT-S2-003 | area: Patient Web/Account contact truth.md | kind: screen | task: Preference ledger. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-ACT-S2-004 | area: Patient Web/Account contact truth.md | kind: screen | task: Preference review. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-ACT-S2-005 | area: Patient Web/Account contact truth.md | kind: screen | task: Demographic source panel. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-ACT-S2-006 | area: Patient Web/Account contact truth.md | kind: screen | task: Risk panel. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-ACT-S2-007 | area: Patient Web/Account contact truth.md | kind: screen | task: Contact repair. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-ACT-S2-008 | area: Patient Web/Account contact truth.md | kind: screen | task: External-off state. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-ACT-S3-001 | area: Patient Web/Account contact truth.md | kind: bug-check | task: Verify contact truth labels distinguish patient-entered, demographic, and external sources. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-ACT-S3-002 | area: Patient Web/Account contact truth.md | kind: bug-check | task: Verify repair actions explain what will change and what will not change. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-ACT-S3-003 | area: Patient Web/Account contact truth.md | kind: bug-check | task: Verify risk warnings are prominent without hiding the editable controls. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-ACT-S3-004 | area: Patient Web/Account contact truth.md | kind: bug-check | task: Verify long phone/email values wrap cleanly. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Patient Web/Auth UI.md

- [ ] PW-AU-S2-001 | area: Patient Web/Auth UI.md | kind: screen | task: Sign-in entry. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-AU-S2-002 | area: Patient Web/Auth UI.md | kind: screen | task: Auth callback. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-AU-S2-003 | area: Patient Web/Auth UI.md | kind: screen | task: Confirming details. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-AU-S2-004 | area: Patient Web/Auth UI.md | kind: screen | task: Consent declined. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-AU-S2-005 | area: Patient Web/Auth UI.md | kind: screen | task: Higher assurance required. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-AU-S2-006 | area: Patient Web/Auth UI.md | kind: screen | task: Safe re-entry. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-AU-S2-007 | area: Patient Web/Auth UI.md | kind: screen | task: Session expired. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-AU-S2-008 | area: Patient Web/Auth UI.md | kind: screen | task: Clean signed-out state. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-AU-S3-001 | area: Patient Web/Auth UI.md | kind: bug-check | task: Verify auth state copy explains what happened and what the patient can do next. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-AU-S3-002 | area: Patient Web/Auth UI.md | kind: bug-check | task: Verify pending/callback states avoid dead ends and show progress without layout shift. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-AU-S3-003 | area: Patient Web/Auth UI.md | kind: bug-check | task: Verify session-expired and signed-out actions are visually distinct from destructive actions. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-AU-S3-004 | area: Patient Web/Auth UI.md | kind: bug-check | task: Verify focus lands on the primary message or first actionable control after redirects. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Patient Web/Authenticated home status.md

- [ ] PW-AHS-S2-001 | area: Patient Web/Authenticated home status.md | kind: screen | task: Normal authenticated home. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-AHS-S2-002 | area: Patient Web/Authenticated home status.md | kind: screen | task: Quiet home. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-AHS-S2-003 | area: Patient Web/Authenticated home status.md | kind: screen | task: Requests index. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-AHS-S2-004 | area: Patient Web/Authenticated home status.md | kind: screen | task: Request detail. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-AHS-S2-005 | area: Patient Web/Authenticated home status.md | kind: screen | task: Narrowed request detail. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-AHS-S2-006 | area: Patient Web/Authenticated home status.md | kind: screen | task: Reachability blocker. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-AHS-S2-007 | area: Patient Web/Authenticated home status.md | kind: screen | task: Session expiring. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-AHS-S2-008 | area: Patient Web/Authenticated home status.md | kind: screen | task: Session expired. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-AHS-S3-001 | area: Patient Web/Authenticated home status.md | kind: bug-check | task: Verify status tracker hierarchy is scannable and not duplicated by nearby cards. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-AHS-S3-002 | area: Patient Web/Authenticated home status.md | kind: bug-check | task: Verify quiet/reduced states still expose essential next actions. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-AHS-S3-003 | area: Patient Web/Authenticated home status.md | kind: bug-check | task: Verify blockers communicate owner, reason, and recovery path. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-AHS-S3-004 | area: Patient Web/Authenticated home status.md | kind: bug-check | task: Verify session warnings are timely, keyboard reachable, and do not trap focus. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Patient Web/Booking.md

- [ ] PW-BK-S2-001 | area: Patient Web/Booking.md | kind: screen | task: Booking entry from home. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-BK-S2-002 | area: Patient Web/Booking.md | kind: screen | task: Booking entry from requests. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-BK-S2-003 | area: Patient Web/Booking.md | kind: screen | task: Booking entry from appointments. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-BK-S2-004 | area: Patient Web/Booking.md | kind: screen | task: Booking entry read-only state. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-BK-S2-005 | area: Patient Web/Booking.md | kind: screen | task: Booking entry from records. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-BK-S2-006 | area: Patient Web/Booking.md | kind: screen | task: Booking entry recovery. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-BK-S2-007 | area: Patient Web/Booking.md | kind: screen | task: Booking workspace. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-BK-S2-008 | area: Patient Web/Booking.md | kind: screen | task: Select appointment. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-BK-S2-009 | area: Patient Web/Booking.md | kind: screen | task: Confirm appointment. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-BK-S2-010 | area: Patient Web/Booking.md | kind: screen | task: Manage appointment. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-BK-S2-011 | area: Patient Web/Booking.md | kind: screen | task: Waitlist. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-BK-S2-012 | area: Patient Web/Booking.md | kind: screen | task: Booking artifacts. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-BK-S3-001 | area: Patient Web/Booking.md | kind: bug-check | task: Verify slot cards show date, time, location, eligibility, and action hierarchy clearly. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-BK-S3-002 | area: Patient Web/Booking.md | kind: bug-check | task: Verify confirmation screens distinguish booked, pending, waitlisted, and read-only outcomes. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-BK-S3-003 | area: Patient Web/Booking.md | kind: bug-check | task: Verify manage and waitlist actions prevent accidental cancellation or duplicate booking. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-BK-S3-004 | area: Patient Web/Booking.md | kind: bug-check | task: Verify calendar-like layouts remain usable on small screens. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Patient Web/Claim resume.md

- [ ] PW-CR-S2-001 | area: Patient Web/Claim resume.md | kind: screen | task: Claim pending. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-CR-S2-002 | area: Patient Web/Claim resume.md | kind: screen | task: Support recovery required. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-CR-S2-003 | area: Patient Web/Claim resume.md | kind: screen | task: Wrong-patient freeze. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-CR-S2-004 | area: Patient Web/Claim resume.md | kind: screen | task: Promoted draft mapped. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-CR-S3-001 | area: Patient Web/Claim resume.md | kind: bug-check | task: Verify frozen/blocked states prevent unsafe continuation while still offering safe next steps. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-CR-S3-002 | area: Patient Web/Claim resume.md | kind: bug-check | task: Verify patient identity wording is clear and avoids exposing sensitive details. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-CR-S3-003 | area: Patient Web/Claim resume.md | kind: bug-check | task: Verify promoted draft mapping shows what was restored and what still needs review. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-CR-S3-004 | area: Patient Web/Claim resume.md | kind: bug-check | task: Verify support recovery actions remain visible on mobile. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Patient Web/Conversation surface.md

- [ ] PW-CS-S2-001 | area: Patient Web/Conversation surface.md | kind: screen | task: Conversation overview. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-CS-S2-002 | area: Patient Web/Conversation surface.md | kind: screen | task: Conversation more-info. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-CS-S2-003 | area: Patient Web/Conversation surface.md | kind: screen | task: Conversation callback. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-CS-S2-004 | area: Patient Web/Conversation surface.md | kind: screen | task: Conversation messages. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-CS-S2-005 | area: Patient Web/Conversation surface.md | kind: screen | task: Conversation repair. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-CS-S2-006 | area: Patient Web/Conversation surface.md | kind: screen | task: Live scenario. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-CS-S2-007 | area: Patient Web/Conversation surface.md | kind: screen | task: Repair scenario. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-CS-S2-008 | area: Patient Web/Conversation surface.md | kind: screen | task: Stale scenario. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-CS-S2-009 | area: Patient Web/Conversation surface.md | kind: screen | task: Blocked scenario. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-CS-S2-010 | area: Patient Web/Conversation surface.md | kind: screen | task: Expired scenario. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-CS-S3-001 | area: Patient Web/Conversation surface.md | kind: bug-check | task: Verify message chronology, status labels, and timestamps are readable. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-CS-S3-002 | area: Patient Web/Conversation surface.md | kind: bug-check | task: Verify blocked/stale/expired states disable unsafe input while showing next steps. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-CS-S3-003 | area: Patient Web/Conversation surface.md | kind: bug-check | task: Verify callback and message actions are visually distinct. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-CS-S3-004 | area: Patient Web/Conversation surface.md | kind: bug-check | task: Verify long message bodies and attachments do not overflow. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Patient Web/Embedded NHS app flows.md

- [ ] PW-ENHS-S2-001 | area: Patient Web/Embedded NHS app flows.md | kind: screen | task: Embedded entry corridor. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-ENHS-S2-002 | area: Patient Web/Embedded NHS app flows.md | kind: screen | task: Embedded start request. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-ENHS-S2-003 | area: Patient Web/Embedded NHS app flows.md | kind: screen | task: Embedded request status. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-ENHS-S2-004 | area: Patient Web/Embedded NHS app flows.md | kind: screen | task: Embedded more-info. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-ENHS-S2-005 | area: Patient Web/Embedded NHS app flows.md | kind: screen | task: Embedded callback. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-ENHS-S2-006 | area: Patient Web/Embedded NHS app flows.md | kind: screen | task: Embedded messages. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-ENHS-S2-007 | area: Patient Web/Embedded NHS app flows.md | kind: screen | task: Embedded booking offers. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-ENHS-S2-008 | area: Patient Web/Embedded NHS app flows.md | kind: screen | task: Embedded booking alternatives. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-ENHS-S2-009 | area: Patient Web/Embedded NHS app flows.md | kind: screen | task: Embedded booking waitlist. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-ENHS-S2-010 | area: Patient Web/Embedded NHS app flows.md | kind: screen | task: Embedded booking manage. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-ENHS-S2-011 | area: Patient Web/Embedded NHS app flows.md | kind: screen | task: Embedded booking confirmation. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-ENHS-S2-012 | area: Patient Web/Embedded NHS app flows.md | kind: screen | task: Embedded booking calendar. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-ENHS-S2-013 | area: Patient Web/Embedded NHS app flows.md | kind: screen | task: Embedded pharmacy choice. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-ENHS-S2-014 | area: Patient Web/Embedded NHS app flows.md | kind: screen | task: Embedded pharmacy instructions. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-ENHS-S2-015 | area: Patient Web/Embedded NHS app flows.md | kind: screen | task: Embedded pharmacy status. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-ENHS-S2-016 | area: Patient Web/Embedded NHS app flows.md | kind: screen | task: Embedded pharmacy outcome. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-ENHS-S2-017 | area: Patient Web/Embedded NHS app flows.md | kind: screen | task: Expired link recovery. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-ENHS-S2-018 | area: Patient Web/Embedded NHS app flows.md | kind: screen | task: Invalid context recovery. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-ENHS-S2-019 | area: Patient Web/Embedded NHS app flows.md | kind: screen | task: Lost session recovery. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-ENHS-S2-020 | area: Patient Web/Embedded NHS app flows.md | kind: screen | task: Unsupported action recovery. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-ENHS-S2-021 | area: Patient Web/Embedded NHS app flows.md | kind: screen | task: Channel unavailable recovery. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-ENHS-S2-022 | area: Patient Web/Embedded NHS app flows.md | kind: screen | task: Route freeze recovery. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-ENHS-S2-023 | area: Patient Web/Embedded NHS app flows.md | kind: screen | task: Degraded mode recovery. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-ENHS-S2-024 | area: Patient Web/Embedded NHS app flows.md | kind: screen | task: Artifact summary. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-ENHS-S2-025 | area: Patient Web/Embedded NHS app flows.md | kind: screen | task: Artifact preview. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-ENHS-S2-026 | area: Patient Web/Embedded NHS app flows.md | kind: screen | task: Download progress. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-ENHS-S2-027 | area: Patient Web/Embedded NHS app flows.md | kind: screen | task: Artifact fallback. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-ENHS-S2-028 | area: Patient Web/Embedded NHS app flows.md | kind: screen | task: Return safe. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-ENHS-S3-001 | area: Patient Web/Embedded NHS app flows.md | kind: bug-check | task: Verify embedded layouts respect host safe areas, narrow widths, and reduced-motion mode. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-ENHS-S3-002 | area: Patient Web/Embedded NHS app flows.md | kind: bug-check | task: Verify embedded recovery states always provide a safe return or fallback route. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-ENHS-S3-003 | area: Patient Web/Embedded NHS app flows.md | kind: bug-check | task: Verify booking/pharmacy/status embedded flows match the standalone patient semantics. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-ENHS-S3-004 | area: Patient Web/Embedded NHS app flows.md | kind: bug-check | task: Verify artifact preview/download states are accessible and do not require unsupported browser features. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Patient Web/Intake flow.md

- [ ] PW-IF-S2-001 | area: Patient Web/Intake flow.md | kind: screen | task: Landing entry. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-IF-S2-002 | area: Patient Web/Intake flow.md | kind: screen | task: Request type selection. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-IF-S2-003 | area: Patient Web/Intake flow.md | kind: screen | task: Request details form. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-IF-S2-004 | area: Patient Web/Intake flow.md | kind: screen | task: Supporting files upload. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-IF-S2-005 | area: Patient Web/Intake flow.md | kind: screen | task: Contact preferences. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-IF-S2-006 | area: Patient Web/Intake flow.md | kind: screen | task: Review and submit. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-IF-S2-007 | area: Patient Web/Intake flow.md | kind: screen | task: Resume recovery. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-IF-S2-008 | area: Patient Web/Intake flow.md | kind: screen | task: Urgent outcome. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-IF-S2-009 | area: Patient Web/Intake flow.md | kind: screen | task: Receipt outcome. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-IF-S2-010 | area: Patient Web/Intake flow.md | kind: screen | task: Request status. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-IF-S3-001 | area: Patient Web/Intake flow.md | kind: bug-check | task: Verify step progress, completed/current/error states, and return-to-step behavior. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-IF-S3-002 | area: Patient Web/Intake flow.md | kind: bug-check | task: Verify form validation copy is specific, visible, and announced to assistive tech. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-IF-S3-003 | area: Patient Web/Intake flow.md | kind: bug-check | task: Verify file upload states handle large names, failed uploads, and removal. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-IF-S3-004 | area: Patient Web/Intake flow.md | kind: bug-check | task: Verify urgent and receipt outcomes clearly separate next action from informational copy. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Patient Web/Network alternatives.md

- [ ] PW-NA-S2-001 | area: Patient Web/Network alternatives.md | kind: screen | task: Alternative choice. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-NA-S2-002 | area: Patient Web/Network alternatives.md | kind: screen | task: Alternative confirmation. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-NA-S2-003 | area: Patient Web/Network alternatives.md | kind: screen | task: Alternative management. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-NA-S3-001 | area: Patient Web/Network alternatives.md | kind: bug-check | task: Verify alternative options are comparable without hidden critical information. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-NA-S3-002 | area: Patient Web/Network alternatives.md | kind: bug-check | task: Verify confirmation explains what changed and where the request now sits. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-NA-S3-003 | area: Patient Web/Network alternatives.md | kind: bug-check | task: Verify manage actions expose cancel/return paths safely. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-NA-S3-004 | area: Patient Web/Network alternatives.md | kind: bug-check | task: Verify unavailable alternatives have clear disabled reasons. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Patient Web/Patient pharmacy.md

- [ ] PW-PH-S2-001 | area: Patient Web/Patient pharmacy.md | kind: screen | task: Choose pharmacy. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-PH-S2-002 | area: Patient Web/Patient pharmacy.md | kind: screen | task: Pharmacy instructions. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-PH-S2-003 | area: Patient Web/Patient pharmacy.md | kind: screen | task: Pharmacy status. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-PH-S3-001 | area: Patient Web/Patient pharmacy.md | kind: bug-check | task: Verify chosen pharmacy details are readable and distinguishable from alternatives. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-PH-S3-002 | area: Patient Web/Patient pharmacy.md | kind: bug-check | task: Verify instruction steps show patient responsibility and pharmacy responsibility separately. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-PH-S3-003 | area: Patient Web/Patient pharmacy.md | kind: bug-check | task: Verify status progress communicates pending, accepted, rejected, and recovery states. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-PH-S3-004 | area: Patient Web/Patient pharmacy.md | kind: bug-check | task: Verify pharmacy contact details wrap and remain tappable on mobile. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Patient Web/Patient shell.md

- [ ] PW-PS-S2-001 | area: Patient Web/Patient shell.md | kind: screen | task: Home route. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-PS-S2-002 | area: Patient Web/Patient shell.md | kind: screen | task: Embedded home route. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-PS-S2-003 | area: Patient Web/Patient shell.md | kind: screen | task: Requests index route. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-PS-S2-004 | area: Patient Web/Patient shell.md | kind: screen | task: Request detail route. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-PS-S2-005 | area: Patient Web/Patient shell.md | kind: screen | task: Appointments route. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-PS-S2-006 | area: Patient Web/Patient shell.md | kind: screen | task: Records route. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-PS-S2-007 | area: Patient Web/Patient shell.md | kind: screen | task: Record follow-up route. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-PS-S2-008 | area: Patient Web/Patient shell.md | kind: screen | task: Messages index route. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-PS-S2-009 | area: Patient Web/Patient shell.md | kind: screen | task: Message thread route. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-PS-S2-010 | area: Patient Web/Patient shell.md | kind: screen | task: Recovery secure-link route. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-PS-S3-001 | area: Patient Web/Patient shell.md | kind: bug-check | task: Verify active route highlighting, back/return affordances, and deep-link restoration. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-PS-S3-002 | area: Patient Web/Patient shell.md | kind: bug-check | task: Verify patient status banners do not obscure shell navigation or page actions. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-PS-S3-003 | area: Patient Web/Patient shell.md | kind: bug-check | task: Verify all shell regions reflow without overlap on narrow screens. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-PS-S3-004 | area: Patient Web/Patient shell.md | kind: bug-check | task: Verify keyboard focus moves predictably between navigation, primary content, and side regions. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Patient Web/Receipt status parity.md

- [ ] PW-RSP-S2-001 | area: Patient Web/Receipt status parity.md | kind: screen | task: Receipt parity entry. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-RSP-S2-002 | area: Patient Web/Receipt status parity.md | kind: screen | task: Request reference display. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-RSP-S2-003 | area: Patient Web/Receipt status parity.md | kind: screen | task: Channel status comparison. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-RSP-S2-004 | area: Patient Web/Receipt status parity.md | kind: screen | task: Next-step explanation. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-RSP-S2-005 | area: Patient Web/Receipt status parity.md | kind: screen | task: Recovery or mismatch messaging. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-RSP-S3-001 | area: Patient Web/Receipt status parity.md | kind: bug-check | task: Verify the same request status is described consistently across channels. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-RSP-S3-002 | area: Patient Web/Receipt status parity.md | kind: bug-check | task: Verify mismatch states are understandable and avoid blaming the patient. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-RSP-S3-003 | area: Patient Web/Receipt status parity.md | kind: bug-check | task: Verify reference numbers are copyable and readable on mobile. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-RSP-S3-004 | area: Patient Web/Receipt status parity.md | kind: bug-check | task: Verify next-step timing and ownership are explicit. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Patient Web/Records and communications.md

- [ ] PW-RC-S2-001 | area: Patient Web/Records and communications.md | kind: screen | task: Records overview. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-RC-S2-002 | area: Patient Web/Records and communications.md | kind: screen | task: Result detail. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-RC-S2-003 | area: Patient Web/Records and communications.md | kind: screen | task: Document detail. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-RC-S2-004 | area: Patient Web/Records and communications.md | kind: screen | task: Messages index. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-RC-S2-005 | area: Patient Web/Records and communications.md | kind: screen | task: Message cluster. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-RC-S2-006 | area: Patient Web/Records and communications.md | kind: screen | task: Message thread. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-RC-S2-007 | area: Patient Web/Records and communications.md | kind: screen | task: Message callback. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-RC-S2-008 | area: Patient Web/Records and communications.md | kind: screen | task: Message repair. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-RC-S3-001 | area: Patient Web/Records and communications.md | kind: bug-check | task: Verify record/result/document metadata is scannable and not duplicated. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-RC-S3-002 | area: Patient Web/Records and communications.md | kind: bug-check | task: Verify document previews, downloads, and fallback states are clear. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-RC-S3-003 | area: Patient Web/Records and communications.md | kind: bug-check | task: Verify thread navigation preserves context from records to messages. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-RC-S3-004 | area: Patient Web/Records and communications.md | kind: bug-check | task: Verify clinical terminology has patient-readable labels. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Patient Web/Request detail child surfaces.md

- [ ] PW-RDCS-S2-001 | area: Patient Web/Request detail child surfaces.md | kind: screen | task: More-info child surface. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-RDCS-S2-002 | area: Patient Web/Request detail child surfaces.md | kind: screen | task: Callback child surface. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-RDCS-S2-003 | area: Patient Web/Request detail child surfaces.md | kind: screen | task: Records child surface. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-RDCS-S2-004 | area: Patient Web/Request detail child surfaces.md | kind: screen | task: Communications child surface. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-RDCS-S2-005 | area: Patient Web/Request detail child surfaces.md | kind: screen | task: Booking child surface. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-RDCS-S2-006 | area: Patient Web/Request detail child surfaces.md | kind: screen | task: Pharmacy child surface. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-RDCS-S3-001 | area: Patient Web/Request detail child surfaces.md | kind: bug-check | task: Verify child surfaces preserve request context and return location. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-RDCS-S3-002 | area: Patient Web/Request detail child surfaces.md | kind: bug-check | task: Verify child actions do not compete with the parent request primary action. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-RDCS-S3-003 | area: Patient Web/Request detail child surfaces.md | kind: bug-check | task: Verify tabs, anchors, or child navigation are usable by keyboard. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-RDCS-S3-004 | area: Patient Web/Request detail child surfaces.md | kind: bug-check | task: Verify incomplete child tasks surface clearly on the parent detail screen. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Patient Web/Signed in start request.md

- [ ] PW-SISR-S2-001 | area: Patient Web/Signed in start request.md | kind: screen | task: Start request. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-SISR-S2-002 | area: Patient Web/Signed in start request.md | kind: screen | task: Continue request. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-SISR-S2-003 | area: Patient Web/Signed in start request.md | kind: screen | task: Restore request. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-SISR-S2-004 | area: Patient Web/Signed in start request.md | kind: screen | task: Post-auth return. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-SISR-S2-005 | area: Patient Web/Signed in start request.md | kind: screen | task: Promoted request. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-SISR-S2-006 | area: Patient Web/Signed in start request.md | kind: screen | task: Narrowed request. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-SISR-S3-001 | area: Patient Web/Signed in start request.md | kind: bug-check | task: Verify start/continue/restore labels are not visually or semantically confused. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-SISR-S3-002 | area: Patient Web/Signed in start request.md | kind: bug-check | task: Verify restored drafts show last saved context and next required action. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-SISR-S3-003 | area: Patient Web/Signed in start request.md | kind: bug-check | task: Verify post-auth return does not flash the wrong state or route. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-SISR-S3-004 | area: Patient Web/Signed in start request.md | kind: bug-check | task: Verify narrowed mode clearly communicates reduced scope. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Patient Web/SMS continuation.md

- [ ] PW-SMS-S2-001 | area: Patient Web/SMS continuation.md | kind: screen | task: Seeded continuation entry. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-SMS-S2-002 | area: Patient Web/SMS continuation.md | kind: screen | task: Challenge. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-SMS-S2-003 | area: Patient Web/SMS continuation.md | kind: screen | task: Challenge step. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-SMS-S2-004 | area: Patient Web/SMS continuation.md | kind: screen | task: Challenge verified. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-SMS-S2-005 | area: Patient Web/SMS continuation.md | kind: screen | task: Captured details. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-SMS-S2-006 | area: Patient Web/SMS continuation.md | kind: screen | task: Detail entry. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-SMS-S2-007 | area: Patient Web/SMS continuation.md | kind: screen | task: Upload. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-SMS-S2-008 | area: Patient Web/SMS continuation.md | kind: screen | task: Review. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-SMS-S2-009 | area: Patient Web/SMS continuation.md | kind: screen | task: Submitted. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-SMS-S2-010 | area: Patient Web/SMS continuation.md | kind: screen | task: Replay. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-SMS-S2-011 | area: Patient Web/SMS continuation.md | kind: screen | task: Stale link. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-SMS-S2-012 | area: Patient Web/SMS continuation.md | kind: screen | task: Recovery. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-SMS-S2-013 | area: Patient Web/SMS continuation.md | kind: screen | task: Manual-only. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-SMS-S2-014 | area: Patient Web/SMS continuation.md | kind: screen | task: Sign-in return. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-SMS-S3-001 | area: Patient Web/SMS continuation.md | kind: bug-check | task: Verify narrow mobile layout first, including tap targets and one-handed reach. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-SMS-S3-002 | area: Patient Web/SMS continuation.md | kind: bug-check | task: Verify challenge failures and stale links explain recovery without creating loops. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-SMS-S3-003 | area: Patient Web/SMS continuation.md | kind: bug-check | task: Verify uploads and review state preserve entered data after navigation. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PW-SMS-S3-004 | area: Patient Web/SMS continuation.md | kind: bug-check | task: Verify manual-only fallback has a clear, reachable primary action. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Pharmacy Console/Accessibility recovery.md

- [ ] PC-AR-S2-001 | area: Pharmacy Console/Accessibility recovery.md | kind: screen | task: Accessible status badge. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-AR-S2-002 | area: Pharmacy Console/Accessibility recovery.md | kind: screen | task: Accessibility announcement hub. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-AR-S2-003 | area: Pharmacy Console/Accessibility recovery.md | kind: screen | task: Focus route map. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-AR-S2-004 | area: Pharmacy Console/Accessibility recovery.md | kind: screen | task: Target size guard. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-AR-S2-005 | area: Pharmacy Console/Accessibility recovery.md | kind: screen | task: Inline acknowledgement. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-AR-S2-006 | area: Pharmacy Console/Accessibility recovery.md | kind: screen | task: Reduced motion bridge. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-AR-S2-007 | area: Pharmacy Console/Accessibility recovery.md | kind: screen | task: Dialog and drawer semantics. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-AR-S2-008 | area: Pharmacy Console/Accessibility recovery.md | kind: screen | task: Recovery strip. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-AR-S2-009 | area: Pharmacy Console/Accessibility recovery.md | kind: screen | task: Continuity frozen overlay. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-AR-S2-010 | area: Pharmacy Console/Accessibility recovery.md | kind: screen | task: Support region resume card. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-AR-S2-011 | area: Pharmacy Console/Accessibility recovery.md | kind: screen | task: Watch-window re-entry banner. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-AR-S3-001 | area: Pharmacy Console/Accessibility recovery.md | kind: bug-check | task: Verify live announcements are useful and not noisy. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-AR-S3-002 | area: Pharmacy Console/Accessibility recovery.md | kind: bug-check | task: Verify target sizes meet touch requirements. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-AR-S3-003 | area: Pharmacy Console/Accessibility recovery.md | kind: bug-check | task: Verify frozen overlays block unsafe actions while preserving context. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-AR-S3-004 | area: Pharmacy Console/Accessibility recovery.md | kind: bug-check | task: Verify reduced-motion mode removes nonessential animation without hiding state changes. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Pharmacy Console/Assurance.md

- [ ] PC-ASR-S2-001 | area: Pharmacy Console/Assurance.md | kind: screen | task: Assurance child route. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-ASR-S2-002 | area: Pharmacy Console/Assurance.md | kind: screen | task: Outcome assurance panel. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-ASR-S2-003 | area: Pharmacy Console/Assurance.md | kind: screen | task: Assurance decision dock. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-ASR-S2-004 | area: Pharmacy Console/Assurance.md | kind: screen | task: Reopened case banner. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-ASR-S2-005 | area: Pharmacy Console/Assurance.md | kind: screen | task: Review next-step state. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-ASR-S2-006 | area: Pharmacy Console/Assurance.md | kind: screen | task: Outcome accepted state. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-ASR-S2-007 | area: Pharmacy Console/Assurance.md | kind: screen | task: Outcome rejected state. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-ASR-S2-008 | area: Pharmacy Console/Assurance.md | kind: screen | task: Assurance evidence state. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-ASR-S3-001 | area: Pharmacy Console/Assurance.md | kind: bug-check | task: Verify assurance outcomes are distinguishable from operational case states. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-ASR-S3-002 | area: Pharmacy Console/Assurance.md | kind: bug-check | task: Verify reopened cases explain why the case returned and what changed. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-ASR-S3-003 | area: Pharmacy Console/Assurance.md | kind: bug-check | task: Verify evidence is available before final assurance actions. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-ASR-S3-004 | area: Pharmacy Console/Assurance.md | kind: bug-check | task: Verify accepted/rejected states are announced and persisted after navigation. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Pharmacy Console/Case route.md

- [ ] PC-CR-S2-001 | area: Pharmacy Console/Case route.md | kind: screen | task: Pharmacy case route. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-CR-S2-002 | area: Pharmacy Console/Case route.md | kind: screen | task: Case workbench. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-CR-S2-003 | area: Pharmacy Console/Case route.md | kind: screen | task: Checkpoint rail. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-CR-S2-004 | area: Pharmacy Console/Case route.md | kind: screen | task: Support region. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-CR-S2-005 | area: Pharmacy Console/Case route.md | kind: screen | task: Decision dock. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-CR-S2-006 | area: Pharmacy Console/Case route.md | kind: screen | task: Mission stack controller. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-CR-S2-007 | area: Pharmacy Console/Case route.md | kind: screen | task: Mission stack dock. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-CR-S2-008 | area: Pharmacy Console/Case route.md | kind: screen | task: Case resume stub. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-CR-S3-001 | area: Pharmacy Console/Case route.md | kind: bug-check | task: Verify case identity, medication context, patient safety status, and next action stay visible. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-CR-S3-002 | area: Pharmacy Console/Case route.md | kind: bug-check | task: Verify checkpoint state is understandable without opening every panel. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-CR-S3-003 | area: Pharmacy Console/Case route.md | kind: bug-check | task: Verify decision dock is reachable and not hidden by mission stack UI. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-CR-S3-004 | area: Pharmacy Console/Case route.md | kind: bug-check | task: Verify resume stubs show what work is being restored. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Pharmacy Console/Handoff.md

- [ ] PC-HO-S2-001 | area: Pharmacy Console/Handoff.md | kind: screen | task: Handoff child route. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-HO-S2-002 | area: Pharmacy Console/Handoff.md | kind: screen | task: Handoff readiness board. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-HO-S2-003 | area: Pharmacy Console/Handoff.md | kind: screen | task: Dispatch proof status strip. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-HO-S2-004 | area: Pharmacy Console/Handoff.md | kind: screen | task: Dispatch evidence rows. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-HO-S2-005 | area: Pharmacy Console/Handoff.md | kind: screen | task: Artifact summary card. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-HO-S2-006 | area: Pharmacy Console/Handoff.md | kind: screen | task: Continuity warning strip. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-HO-S2-007 | area: Pharmacy Console/Handoff.md | kind: screen | task: Patient consent checkpoint notice. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-HO-S2-008 | area: Pharmacy Console/Handoff.md | kind: screen | task: Dispatch pending state. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-HO-S2-009 | area: Pharmacy Console/Handoff.md | kind: screen | task: Referral confirmation drawer. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-HO-S3-001 | area: Pharmacy Console/Handoff.md | kind: bug-check | task: Verify readiness checklist makes blockers and completed checks clear. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-HO-S3-002 | area: Pharmacy Console/Handoff.md | kind: bug-check | task: Verify dispatch proof distinguishes pending, sent, acknowledged, and failed states. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-HO-S3-003 | area: Pharmacy Console/Handoff.md | kind: bug-check | task: Verify consent checkpoint is prominent before referral actions. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-HO-S3-004 | area: Pharmacy Console/Handoff.md | kind: bug-check | task: Verify confirmation drawer has accessible focus trap and return behavior. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Pharmacy Console/Inventory.md

- [ ] PC-INV-S2-001 | area: Pharmacy Console/Inventory.md | kind: screen | task: Inventory child route. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-INV-S2-002 | area: Pharmacy Console/Inventory.md | kind: screen | task: Inventory truth panel. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-INV-S2-003 | area: Pharmacy Console/Inventory.md | kind: screen | task: Inventory comparison workspace. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-INV-S2-004 | area: Pharmacy Console/Inventory.md | kind: screen | task: Stock available state. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-INV-S2-005 | area: Pharmacy Console/Inventory.md | kind: screen | task: Stock partial state. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-INV-S2-006 | area: Pharmacy Console/Inventory.md | kind: screen | task: Stock unavailable state. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-INV-S2-007 | area: Pharmacy Console/Inventory.md | kind: screen | task: Inventory stale-data state. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-INV-S3-001 | area: Pharmacy Console/Inventory.md | kind: bug-check | task: Verify stock truth source, freshness, and confidence are visible. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-INV-S3-002 | area: Pharmacy Console/Inventory.md | kind: bug-check | task: Verify comparison rows align medication, quantity, location, and availability. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-INV-S3-003 | area: Pharmacy Console/Inventory.md | kind: bug-check | task: Verify stale inventory cannot be mistaken for confirmed stock. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-INV-S3-004 | area: Pharmacy Console/Inventory.md | kind: bug-check | task: Verify long medication names and quantities do not break layout. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Pharmacy Console/Pharmacy lane.md

- [ ] PC-PL-S2-001 | area: Pharmacy Console/Pharmacy lane.md | kind: screen | task: Pharmacy lane route. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-PL-S2-002 | area: Pharmacy Console/Pharmacy lane.md | kind: screen | task: Queue spine. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-PL-S2-003 | area: Pharmacy Console/Pharmacy lane.md | kind: screen | task: Queue peek drawer. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-PL-S2-004 | area: Pharmacy Console/Pharmacy lane.md | kind: screen | task: Case pulse host. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-PL-S2-005 | area: Pharmacy Console/Pharmacy lane.md | kind: screen | task: Chosen provider anchor. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-PL-S2-006 | area: Pharmacy Console/Pharmacy lane.md | kind: screen | task: Lane empty state. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-PL-S2-007 | area: Pharmacy Console/Pharmacy lane.md | kind: screen | task: Lane overloaded state. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-PL-S3-001 | area: Pharmacy Console/Pharmacy lane.md | kind: bug-check | task: Verify prescription/case priority, provider, and status are scannable. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-PL-S3-002 | area: Pharmacy Console/Pharmacy lane.md | kind: bug-check | task: Verify queue peek opens, closes, and restores focus correctly. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-PL-S3-003 | area: Pharmacy Console/Pharmacy lane.md | kind: bug-check | task: Verify chosen provider anchor is visible before case decisions. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-PL-S3-004 | area: Pharmacy Console/Pharmacy lane.md | kind: bug-check | task: Verify lane density remains usable at narrow desktop widths. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Pharmacy Console/Resolve.md

- [ ] PC-RES-S2-001 | area: Pharmacy Console/Resolve.md | kind: screen | task: Resolve child route. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-RES-S2-002 | area: Pharmacy Console/Resolve.md | kind: screen | task: Bounce-back queue. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-RES-S2-003 | area: Pharmacy Console/Resolve.md | kind: screen | task: Urgent return mode. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-RES-S2-004 | area: Pharmacy Console/Resolve.md | kind: screen | task: Open original request action. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-RES-S2-005 | area: Pharmacy Console/Resolve.md | kind: screen | task: Return message preview. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-RES-S2-006 | area: Pharmacy Console/Resolve.md | kind: screen | task: Reopen diff strip. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-RES-S2-007 | area: Pharmacy Console/Resolve.md | kind: screen | task: Loop-risk escalation card. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-RES-S2-008 | area: Pharmacy Console/Resolve.md | kind: screen | task: Recovery decision dock. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-RES-S2-009 | area: Pharmacy Console/Resolve.md | kind: screen | task: Recovery control panel. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-RES-S3-001 | area: Pharmacy Console/Resolve.md | kind: bug-check | task: Verify return, reopen, and resolve actions are clearly separated. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-RES-S3-002 | area: Pharmacy Console/Resolve.md | kind: bug-check | task: Verify urgent mode changes both visual priority and accessible text. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-RES-S3-003 | area: Pharmacy Console/Resolve.md | kind: bug-check | task: Verify message previews show exactly what will be sent or returned. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-RES-S3-004 | area: Pharmacy Console/Resolve.md | kind: bug-check | task: Verify loop-risk escalation cannot be missed in dense layouts. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Pharmacy Console/Validate.md

- [ ] PC-VAL-S2-001 | area: Pharmacy Console/Validate.md | kind: screen | task: Validate child route. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-VAL-S2-002 | area: Pharmacy Console/Validate.md | kind: screen | task: Medication validation board. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-VAL-S2-003 | area: Pharmacy Console/Validate.md | kind: screen | task: Eligibility version chip. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-VAL-S2-004 | area: Pharmacy Console/Validate.md | kind: screen | task: Eligibility supersession notice. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-VAL-S2-005 | area: Pharmacy Console/Validate.md | kind: screen | task: Eligibility gate ladder. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-VAL-S2-006 | area: Pharmacy Console/Validate.md | kind: screen | task: Eligibility evidence drawer. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-VAL-S2-007 | area: Pharmacy Console/Validate.md | kind: screen | task: Rule explainer. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-VAL-S2-008 | area: Pharmacy Console/Validate.md | kind: screen | task: Patient unsuitable return state. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-VAL-S2-009 | area: Pharmacy Console/Validate.md | kind: screen | task: Patient alternative route next-step panel. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-VAL-S3-001 | area: Pharmacy Console/Validate.md | kind: bug-check | task: Verify eligibility pass/fail/unknown states are visually and textually distinct. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-VAL-S3-002 | area: Pharmacy Console/Validate.md | kind: bug-check | task: Verify rule explanations include source, version, and consequence. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-VAL-S3-003 | area: Pharmacy Console/Validate.md | kind: bug-check | task: Verify evidence drawers restore focus and preserve validation context. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] PC-VAL-S3-004 | area: Pharmacy Console/Validate.md | kind: bug-check | task: Verify unsuitable/alternative states explain patient impact and next owner. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Shared UI Packages/Design system.md

- [ ] SUP-DS-S2-001 | area: Shared UI Packages/Design system.md | kind: screen | task: Component primitives. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SUP-DS-S2-002 | area: Shared UI Packages/Design system.md | kind: screen | task: Buttons and action controls. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SUP-DS-S2-003 | area: Shared UI Packages/Design system.md | kind: screen | task: Cards and panels. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SUP-DS-S2-004 | area: Shared UI Packages/Design system.md | kind: screen | task: Status badges. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SUP-DS-S2-005 | area: Shared UI Packages/Design system.md | kind: screen | task: Artifact shell. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SUP-DS-S2-006 | area: Shared UI Packages/Design system.md | kind: screen | task: Status truth surfaces. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SUP-DS-S2-007 | area: Shared UI Packages/Design system.md | kind: screen | task: Cross-org artifact handoff. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SUP-DS-S2-008 | area: Shared UI Packages/Design system.md | kind: screen | task: Pharmacy shared workbench surfaces. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SUP-DS-S2-009 | area: Shared UI Packages/Design system.md | kind: screen | task: Pharmacy shared eligibility surfaces. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SUP-DS-S2-010 | area: Shared UI Packages/Design system.md | kind: screen | task: Pharmacy shared dispatch surfaces. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SUP-DS-S2-011 | area: Shared UI Packages/Design system.md | kind: screen | task: Pharmacy shared recovery surfaces. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SUP-DS-S2-012 | area: Shared UI Packages/Design system.md | kind: screen | task: Branding and theme tokens. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SUP-DS-S3-001 | area: Shared UI Packages/Design system.md | kind: bug-check | task: Verify shared components expose accessible names and state semantics. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SUP-DS-S3-002 | area: Shared UI Packages/Design system.md | kind: bug-check | task: Verify spacing, radius, typography, and color tokens are applied consistently. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SUP-DS-S3-003 | area: Shared UI Packages/Design system.md | kind: bug-check | task: Verify shared components do not impose one-platform assumptions on other apps. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SUP-DS-S3-004 | area: Shared UI Packages/Design system.md | kind: bug-check | task: Verify status truth components use consistent labels across patient, staff, ops, and pharmacy surfaces. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Shared UI Packages/Persistent shell.md

- [ ] SUP-PS-S2-001 | area: Shared UI Packages/Persistent shell.md | kind: screen | task: Route rail. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SUP-PS-S2-002 | area: Shared UI Packages/Persistent shell.md | kind: screen | task: Section band. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SUP-PS-S2-003 | area: Shared UI Packages/Persistent shell.md | kind: screen | task: Status strip. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SUP-PS-S2-004 | area: Shared UI Packages/Persistent shell.md | kind: screen | task: Fold toggle. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SUP-PS-S2-005 | area: Shared UI Packages/Persistent shell.md | kind: screen | task: Primary region. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SUP-PS-S2-006 | area: Shared UI Packages/Persistent shell.md | kind: screen | task: Dominant action. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SUP-PS-S2-007 | area: Shared UI Packages/Persistent shell.md | kind: screen | task: Anchor buttons. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SUP-PS-S2-008 | area: Shared UI Packages/Persistent shell.md | kind: screen | task: Hero card. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SUP-PS-S2-009 | area: Shared UI Packages/Persistent shell.md | kind: screen | task: Selected anchor. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SUP-PS-S2-010 | area: Shared UI Packages/Persistent shell.md | kind: screen | task: Aside runtime card. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SUP-PS-S2-011 | area: Shared UI Packages/Persistent shell.md | kind: screen | task: Continuity footer. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SUP-PS-S2-012 | area: Shared UI Packages/Persistent shell.md | kind: screen | task: Trace ribbon. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SUP-PS-S3-001 | area: Shared UI Packages/Persistent shell.md | kind: bug-check | task: Verify shell layout tokens keep dimensions stable across resident and child routes. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SUP-PS-S3-002 | area: Shared UI Packages/Persistent shell.md | kind: bug-check | task: Verify route changes, anchor selection, and focus restoration are consistent. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SUP-PS-S3-003 | area: Shared UI Packages/Persistent shell.md | kind: bug-check | task: Verify dominant actions remain visible without covering content. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SUP-PS-S3-004 | area: Shared UI Packages/Persistent shell.md | kind: bug-check | task: Verify shell chrome can support long titles and narrow widths. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Shared UI Packages/Surface postures.md

- [ ] SUP-SP-S2-001 | area: Shared UI Packages/Surface postures.md | kind: screen | task: Normal posture. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SUP-SP-S2-002 | area: Shared UI Packages/Surface postures.md | kind: screen | task: Degraded posture. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SUP-SP-S2-003 | area: Shared UI Packages/Surface postures.md | kind: screen | task: Frozen posture. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SUP-SP-S2-004 | area: Shared UI Packages/Surface postures.md | kind: screen | task: Read-only posture. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SUP-SP-S2-005 | area: Shared UI Packages/Surface postures.md | kind: screen | task: Recovery posture. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SUP-SP-S2-006 | area: Shared UI Packages/Surface postures.md | kind: screen | task: Handoff posture. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SUP-SP-S2-007 | area: Shared UI Packages/Surface postures.md | kind: screen | task: Unsupported posture. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SUP-SP-S2-008 | area: Shared UI Packages/Surface postures.md | kind: screen | task: Route freeze posture. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SUP-SP-S2-009 | area: Shared UI Packages/Surface postures.md | kind: screen | task: Channel unavailable posture. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SUP-SP-S2-010 | area: Shared UI Packages/Surface postures.md | kind: screen | task: Safe return posture. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SUP-SP-S3-001 | area: Shared UI Packages/Surface postures.md | kind: bug-check | task: Verify each posture communicates what is allowed, blocked, and recoverable. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SUP-SP-S3-002 | area: Shared UI Packages/Surface postures.md | kind: bug-check | task: Verify posture banners and overlays do not hide essential context. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SUP-SP-S3-003 | area: Shared UI Packages/Surface postures.md | kind: bug-check | task: Verify posture copy is consistent across embedded and standalone surfaces. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SUP-SP-S3-004 | area: Shared UI Packages/Surface postures.md | kind: bug-check | task: Verify recovery and safe-return controls are keyboard reachable and clearly primary. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Support Workspace/Persistent support ticket workspace.md

- [ ] SW-PSTW-S2-001 | area: Support Workspace/Persistent support ticket workspace.md | kind: screen | task: Ticket route shell. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SW-PSTW-S2-002 | area: Support Workspace/Persistent support ticket workspace.md | kind: screen | task: Active ticket primary region. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SW-PSTW-S2-003 | area: Support Workspace/Persistent support ticket workspace.md | kind: screen | task: Ticket active anchor. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SW-PSTW-S2-004 | area: Support Workspace/Persistent support ticket workspace.md | kind: screen | task: Ticket timeline anchor. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SW-PSTW-S2-005 | area: Support Workspace/Persistent support ticket workspace.md | kind: screen | task: Ticket return anchor. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SW-PSTW-S2-006 | area: Support Workspace/Persistent support ticket workspace.md | kind: screen | task: Dominant support handoff action. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SW-PSTW-S2-007 | area: Support Workspace/Persistent support ticket workspace.md | kind: screen | task: Continuity footer. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SW-PSTW-S3-001 | area: Support Workspace/Persistent support ticket workspace.md | kind: bug-check | task: Verify active ticket identity and status remain visible during scrolling. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SW-PSTW-S3-002 | area: Support Workspace/Persistent support ticket workspace.md | kind: bug-check | task: Verify anchors move focus to the intended section and update selected state. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SW-PSTW-S3-003 | area: Support Workspace/Persistent support ticket workspace.md | kind: bug-check | task: Verify dominant action is not hidden behind shell chrome. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SW-PSTW-S3-004 | area: Support Workspace/Persistent support ticket workspace.md | kind: bug-check | task: Verify continuity footer does not obscure forms or timelines on small screens. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Support Workspace/Replay observe.md

- [ ] SW-RO-S2-001 | area: Support Workspace/Replay observe.md | kind: screen | task: Replay observe route. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SW-RO-S2-002 | area: Support Workspace/Replay observe.md | kind: screen | task: Replay surface. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SW-RO-S2-003 | area: Support Workspace/Replay observe.md | kind: screen | task: Ticket replay anchor. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SW-RO-S2-004 | area: Support Workspace/Replay observe.md | kind: screen | task: Ticket proof anchor. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SW-RO-S2-005 | area: Support Workspace/Replay observe.md | kind: screen | task: Return-to-ticket action. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SW-RO-S2-006 | area: Support Workspace/Replay observe.md | kind: screen | task: Read-only replay state. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SW-RO-S2-007 | area: Support Workspace/Replay observe.md | kind: screen | task: Replay proof panel. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SW-RO-S3-001 | area: Support Workspace/Replay observe.md | kind: bug-check | task: Verify replay mode is visually and semantically read-only. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SW-RO-S3-002 | area: Support Workspace/Replay observe.md | kind: bug-check | task: Verify proof anchors expose evidence without losing replay context. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SW-RO-S3-003 | area: Support Workspace/Replay observe.md | kind: bug-check | task: Verify return-to-ticket behavior restores the previous support location. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SW-RO-S3-004 | area: Support Workspace/Replay observe.md | kind: bug-check | task: Verify timestamps, deltas, and replay controls are keyboard accessible. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

### Support Workspace/Shared shell behavior.md

- [ ] SW-SSB-S2-001 | area: Support Workspace/Shared shell behavior.md | kind: screen | task: Route rail. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SW-SSB-S2-002 | area: Support Workspace/Shared shell behavior.md | kind: screen | task: Status strip. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SW-SSB-S2-003 | area: Support Workspace/Shared shell behavior.md | kind: screen | task: Fold toggle. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SW-SSB-S2-004 | area: Support Workspace/Shared shell behavior.md | kind: screen | task: Primary content region. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SW-SSB-S2-005 | area: Support Workspace/Shared shell behavior.md | kind: screen | task: Dominant action. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SW-SSB-S2-006 | area: Support Workspace/Shared shell behavior.md | kind: screen | task: Anchor buttons. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SW-SSB-S2-007 | area: Support Workspace/Shared shell behavior.md | kind: screen | task: Hero card. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SW-SSB-S2-008 | area: Support Workspace/Shared shell behavior.md | kind: screen | task: Selected anchor state. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SW-SSB-S2-009 | area: Support Workspace/Shared shell behavior.md | kind: screen | task: Aside runtime card. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SW-SSB-S2-010 | area: Support Workspace/Shared shell behavior.md | kind: screen | task: Continuity footer. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SW-SSB-S2-011 | area: Support Workspace/Shared shell behavior.md | kind: screen | task: Trace ribbon. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SW-SSB-S3-001 | area: Support Workspace/Shared shell behavior.md | kind: bug-check | task: Verify shell regions have stable dimensions and do not shift when folded. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SW-SSB-S3-002 | area: Support Workspace/Shared shell behavior.md | kind: bug-check | task: Verify selected anchors and route rail labels stay synchronized. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SW-SSB-S3-003 | area: Support Workspace/Shared shell behavior.md | kind: bug-check | task: Verify trace ribbon content does not overwhelm the support task. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -
- [ ] SW-SSB-S3-004 | area: Support Workspace/Shared shell behavior.md | kind: bug-check | task: Verify shell controls have names, shortcuts only if implemented, and visible focus. | owner: unassigned | claimed: - | evidence: - | files: - | verified: - | notes: -

Total tasks: 926
