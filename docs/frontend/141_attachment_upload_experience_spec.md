
# 141 Attachment Upload Experience Spec

Generated: 2026-04-14T12:37:32Z

## Surface Mode

`Attachment_Evidence_Rail`

## Experience Intent

The upload surface feels premium, exact, and supportive. It is part of the intake shell rather than a detached gallery or utility page. Local card errors remain local and must not reset the question flow or current step anchor.

## Layout

- overall max width: `1320px`
- centered intake shell mock frame: `760px`
- secondary evidence rail on desktop, collapsing below the shell on narrow layouts
- drop or capture zone minimum height: `168px`
- preview card grid: `2-3` cards per row on desktop, one column on mobile
- lower scan-state and artifact-mode parity region

## Visual Bootstrap

| Token | Value |
| --- | --- |
| Canvas | #F7F8FA |
| Shell | #EEF2F6 |
| Panel | #FFFFFF |
| Inset | #F3F6F9 |
| Text strong | #0F1720 |
| Text default | #24313D |
| Text muted | #5E6B78 |
| Accent upload | #2F6FED |
| Accent safe | #117A55 |
| Accent retry | #B7791F |
| Accent quarantine | #B42318 |
| Accent preview | #5B61F6 |

Typography fallback:

- h1 `28/34`
- h2 `20/26`
- body `16/24`
- meta `13/20`

## Interaction Rules

- desktop supports drag and drop plus file-picker flows
- mobile surfaces show camera capture affordance only where the current channel can support it
- retry, remove, and replace stay local to the card
- progress copy stays concise: upload, scan, settled, retry
- quarantine states are explicit but low-drama
- preview, open, download, and handoff remain subordinate and governed

## Artifact-Mode Mapping

| Mode | Artifact stage | Preview visibility | Open action | Continuity |
| --- | --- | --- | --- | --- |
| Summary while scanning | structured_summary | summary_only | forbidden | Keep the current step anchor and card slot stable while upload or scan is pending. |
| Governed preview | governed_preview | governed_preview | grant_required | Summary and return anchor remain primary while governed preview stays available. |
| Quiet placeholder only | placeholder_only | summary_only | grant_required | A quiet placeholder replaces preview without resetting the shell or step anchor. |
| Recovery only | recovery_only | hidden | forbidden | Replace, remove, and retry stay local to the card and keep the same shell continuity. |

## Accessibility And Motion

- one polite live region announces progress and failure without toast spam
- card states expose stable labels and data markers
- reduced-motion mode preserves the same meaning with transitions removed
- ladder and matrix visuals each ship with table parity

## Explicit Continuity Rule

`local_card_errors_may_reset_shell = false`
