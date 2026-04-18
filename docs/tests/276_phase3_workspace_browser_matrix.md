# 276 Workspace Browser Matrix

| Scenario family | Route or fixture | Chromium | Non-Chromium | Actor count | Notes |
| --- | --- | --- | --- | --- | --- |
| Semantic queue proof | `/workspace/queue/recommended?state=live&fixture=hardening_safe,large_queue` | Yes | Yes | 1 | Includes accessibility tree capture and large-list window proof |
| Task focus and dialog recovery | `/workspace/task/task-311?state=live&fixture=hardening_safe` | Yes | Yes | 1 | Includes skip-link jump, command-palette open/close, and focus return |
| Read-only recovery semantics | `/workspace/task/task-311/more-info?state=read_only&fixture=hardening_safe` | Yes | Yes | 1 | Recovery summary and fenced draft proof |
| Zoom and reflow | queue, task decision, approvals | Yes | No | 1 | Compact width, mission-stack, and large-text checks |
| Reduced motion | `/workspace/messages?state=live&fixture=hardening_safe` | Yes | No | 1 | Reduced-motion parity and no-overflow proof |
| Multi-user read-only | task more-info, approvals, escalations, changed, messages | Yes | No | 2 | Separate browser contexts for one writer and many readers |
| Performance budgets | Large queue and task shell | Yes | No | 1 | Queue window cap, command-palette, task transition, attachment load |
| Visual baselines | calm, stale, read-only, reduced, assurance lab | Yes | No | 1 | Screenshot baselines and trace bundles |

## Browser projects

- `chromium`
- `firefox` when available, otherwise `webkit` as the required non-Chromium semantic pass

## Viewport and posture matrix

| Mode | Target |
| --- | --- |
| Desktop | `1440x960` |
| Compact mobile | `390x844` |
| Mission-stack / reflow | `360x960` |
| Large text | `html { font-size: 200%; }` |
| Reduced motion | Playwright context `reducedMotion = reduce` |
