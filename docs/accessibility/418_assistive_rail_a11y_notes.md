# 418 Assistive Rail Accessibility Notes

Visual mode: `Assistive_Rail_Quiet_Copilot`.

## Landmark And Labels

`AssistiveRailShell` renders as `aside role="complementary"` and is labelled by the rail heading. The rail remains a supporting region for the main case canvas and is not a dialog, alert, or application landmark.

## Keyboard Model

- `Tab` reaches the rail toggle, summary, posture, mode panel, content well, and provenance footer in DOM order.
- `Enter` or `Space` activates the collapse toggle because it is a native button.
- `Escape` collapses the rail only when focus is inside the expanded rail.
- `Alt+A` toggles the rail as a dense-workflow shortcut without replacing normal tab access.

## State Communication

Each posture is encoded with text, `data-rail-state`, `data-trust-state`, and a visible chip. Color is never the only cue. Shadow and observe-only copy explicitly say the assistive output is not final workflow truth.

## Reduced Motion

`prefers-reduced-motion: reduce` removes rail, card, chip, and footer transitions. The state sequence and focus model remain identical.

## Playwright Coverage

The task adds Playwright coverage for:

- expanded and collapsed ARIA snapshots,
- complementary landmark and toggle semantics,
- keyboard collapse and focus behavior,
- independent contexts,
- desktop, collapsed, and narrow visual baselines,
- trace capture for failure triage.
