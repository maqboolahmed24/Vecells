#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]

DECISION_PATH = ROOT / "data" / "analysis" / "225_crosscutting_exit_gate_decision.json"
ROWS_PATH = ROOT / "data" / "analysis" / "225_conformance_rows.json"
EVIDENCE_PATH = ROOT / "data" / "analysis" / "225_evidence_manifest.csv"
OPEN_ITEMS_PATH = ROOT / "data" / "analysis" / "225_open_items_and_phase3_carry_forward.json"

EXIT_PACK_PATH = ROOT / "docs" / "governance" / "225_crosscutting_exit_gate_pack.md"
GO_NO_GO_PATH = ROOT / "docs" / "governance" / "225_portal_and_support_go_no_go_decision.md"
SCORECARD_PATH = ROOT / "docs" / "governance" / "225_portal_and_support_conformance_scorecard.md"
BOUNDARY_PATH = ROOT / "docs" / "governance" / "225_phase3_carry_forward_boundary.md"
BOARD_PATH = ROOT / "docs" / "frontend" / "225_portal_support_exit_board.html"


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n", encoding="utf-8")


def md_join(items: list[str]) -> str:
    return "<br>".join(items)


def code_list(items: list[str]) -> str:
    return "<br>".join(f"`{item}`" for item in items)


def status_counts(rows: list[dict[str, Any]]) -> tuple[int, int, int]:
    approved = sum(1 for row in rows if row["status"] == "approved")
    constrained = sum(1 for row in rows if row["status"] == "go_with_constraints")
    withheld = sum(1 for row in rows if row["status"] == "withheld")
    return approved, constrained, withheld


def render_pack(decision: dict[str, Any], rows: list[dict[str, Any]], open_items: list[dict[str, Any]]) -> str:
    question_rows = "\n".join(
        f"| {item['question']} | {item['answerState']} | {md_join(item['evidenceRefs'])} |"
        for item in decision["gateQuestions"]
    )
    suite_rows = "\n".join(
        f"| {suite['suiteId']} | {suite['verificationOutcome']} | {suite['proofBasis']} | {suite['summary']} |"
        for suite in decision["mandatorySuites"]
    )
    conformance_rows = "\n".join(
        f"| {row['capabilityLabel']} | {row['status']} | {row['proofBasis']} | {row['blockerClass']} | {code_list(row['owningTasks'])} |"
        for row in rows
    )
    boundary_rows = "\n".join(
        f"| {item['title']} | {item['deferredState']} | `{item['nextOwningTask']}` | {md_join(item['futureTaskRefs'])} | {item['whyNotExitBlocker']} |"
        for item in open_items
    )
    return f"""# 225 Crosscutting Exit Gate Pack

Task: `seq_225`

Visual mode: `{decision["visualMode"]}`

Verdict: `{decision["gateVerdict"]}`

Decision boundary: {decision["approvalBoundary"]}

## Design Research References

The board and scorecard reuse structural ideas, not branding, from:

- https://service-manual.nhs.uk/accessibility/design for plain-language recovery and restrained hierarchy
- https://design-system.service.gov.uk/components/service-navigation/ for compact sectioning and route orientation
- https://atlassian.design/components/navigation-system for stable product-family navigation and low-noise inspector patterns
- https://support.zendesk.com/hc/en-us/articles/4408821259930-About-the-Zendesk-Agent-Workspace for ticket-first chronology and bounded omnichannel support posture
- https://playwright.dev/docs/screenshots and https://playwright.dev/docs/emulation#reduced-motion for screenshot, accessibility, keyboard, and reduced-motion proof expectations

## Gate Decision

This is a real go/no-go gate. The verdict is `{decision["gateVerdict"]}` because the repository now has traceable, machine-readable proof for the complete portal and support baseline in scope, while later Phase 3 contract work and live-environment proof remain explicit carry-forward items rather than hidden assumptions.

| Question | Answer state | Evidence |
| --- | --- | --- |
{question_rows}

## Mandatory Suite

| Suite | Outcome | Proof basis | Summary |
| --- | --- | --- | --- |
{suite_rows}

## Conformance Summary

| Capability family | Status | Proof basis | Blocker class | Owning tasks |
| --- | --- | --- | --- | --- |
{conformance_rows}

## Carry-Forward Boundary

| Item | State | Owner | Future task refs | Why non-blocking now |
| --- | --- | --- | --- | --- |
{boundary_rows}

## Machine-Readable Artifacts

- `data/analysis/225_crosscutting_exit_gate_decision.json`
- `data/analysis/225_conformance_rows.json`
- `data/analysis/225_evidence_manifest.csv`
- `data/analysis/225_open_items_and_phase3_carry_forward.json`
- `docs/governance/225_crosscutting_exit_gate_pack.md`
- `docs/governance/225_portal_and_support_go_no_go_decision.md`
- `docs/governance/225_portal_and_support_conformance_scorecard.md`
- `docs/governance/225_phase3_carry_forward_boundary.md`
- `docs/frontend/225_portal_support_exit_board.html`
- `tools/analysis/validate_crosscutting_exit_gate.py`
- `tests/playwright/225_portal_support_exit_board.spec.js`

## Risk And Operational Posture

- The patient/support baseline is approved for Phase 3 entry because the repository proof is complete and internally coherent for the in-scope route families.
- Phase 3 must extend this baseline without reopening the already-approved identity, status, continuity, masking, or replay-safe truth.
- Credentialled live-provider proof and production assurance signoff remain explicit future boundaries, not implicit by-products of this approval.
"""


def render_go_no_go(decision: dict[str, Any]) -> str:
    approved, constrained, withheld = status_counts(read_json(ROWS_PATH))
    question_blocks = "\n".join(
        f"### {item['questionId']}\n\n**Question**: {item['question']}\n\n**Answer**: `{item['answerState']}`\n\n{item['answer']}\n\nEvidence: {md_join(item['evidenceRefs'])}\n"
        for item in decision["gateQuestions"]
    )
    return f"""# 225 Portal And Support Go/No-Go Decision

Gate reference: `{decision["gatePackRef"]}`

Verdict: `{decision["gateVerdict"]}`

Baseline scope: `{decision["baselineScope"]}`

Approval boundary: {decision["approvalBoundary"]}

## Formal Decision

The portal and support baseline is `{decision["gateVerdict"]}` for Phase 3 entry.

This means:

- the repository now has one coherent patient/support product family across patient account, records, communications, support entry, support ticket, masking, replay, and read-only fallback routes
- the definitive continuity suite passed and the repository-owned defects discovered during that suite were fixed before exit
- later Phase 3 work must consume this baseline rather than reopen it
- live-provider and production-signoff proof are still out of scope and explicitly not approved here

## Score Summary

- approved rows: `{approved}`
- go-with-constraints rows: `{constrained}`
- withheld rows: `{withheld}`
- open carry-forward items: `{decision["summary"]["openItemCount"]}`

## Decision Questions

{question_blocks}

## Approval Statement

This is an honest baseline approval, not a production release approval. Any future change that would alter patient/support identity truth, continuity tuples, masking laws, replay recovery, or artifact parity must be recorded as a later change, not smuggled into Phase 3 implementation as local UI logic.
"""


def render_scorecard(rows: list[dict[str, Any]]) -> str:
    table_rows = "\n".join(
        f"| {row['capabilityLabel']} | {row['status']} | {row['proofBasis']} | {row['blockerClass']} | {code_list(row['owningTasks'])} | {md_join(row['implementationEvidence'][:3])} | {md_join(row['automatedProofArtifacts'][:2])} |"
        for row in rows
    )
    return f"""# 225 Portal And Support Conformance Scorecard

This scorecard is the readable companion to `data/analysis/225_conformance_rows.json`.

| Capability family | Status | Proof basis | Blocker class | Owning tasks | Key implementation evidence | Automated proof |
| --- | --- | --- | --- | --- | --- | --- |
{table_rows}

## Reading Notes

- `repository_run` means the current repository can produce the proof directly with local fixtures, validators, and browser automation.
- `mixed` means the proof is still repository-runnable, but it depends on simulator-backed or fixture-backed continuity assumptions already frozen by earlier gates.
- No row is `withheld` and no row is `go_with_constraints` for this baseline approval.
"""


def render_boundary(open_items: list[dict[str, Any]]) -> str:
    item_rows = "\n".join(
        f"| {item['title']} | `{item['nextOwningTask']}` | {item['carryForwardClass']} | {item['blockingClass']} | {item['whyNotExitBlocker']} |"
        for item in open_items
    )
    return f"""# 225 Phase 3 Carry-Forward Boundary

This boundary preserves the approved patient/support baseline while making the next work explicit.

## Non-Reopening Laws

Phase 3 and later release work may extend the baseline, but they may not reopen these already-approved truths without an explicit future change record:

1. patient and support routes consume the same Phase 2 identity, status, capability, and recovery truth
2. same-shell continuity and typed return bundles remain mandatory across patient and support route families
3. support replay, observe, mask scope, and read-only fallback preserve chronology and fail closed in place
4. record artifacts and communication artifacts remain parity-safe and restriction-safe
5. support remains a governed ticket surface and may not become a second system of record

## Carry-Forward Items

| Item | Next owner | Carry-forward class | Blocking class | Why this is not an exit blocker |
| --- | --- | --- | --- | --- |
{item_rows}

## Boundary Interpretation

- Items owned by `seq_226` through `seq_229` are Phase 3 contract-publication and implementation prerequisites, not defects in the current baseline.
- Items owned by the future production release gate remain outside this approval by design and must stay outside until re-proven in credentialled live environments.
"""


def render_html(decision: dict[str, Any], rows: list[dict[str, Any]], evidence: list[dict[str, str]], open_items: list[dict[str, Any]]) -> str:
    payload = {
        "decision": decision,
        "rows": rows,
        "evidence": evidence,
        "openItems": open_items,
    }
    payload_json = json.dumps(payload, separators=(",", ":")).replace("</", "<\\/")
    return f"""<!doctype html>
<html lang="en" data-ready="false">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Portal Support Baseline Exit Board</title>
    <style>
      :root {{
        --canvas: #f7f8fa;
        --panel: #ffffff;
        --inset: #eef2f6;
        --muted: #5e6b78;
        --text: #24313d;
        --strong: #0f1720;
        --border: #d7dfe7;
        --approved: #0f766e;
        --constrained: #b7791f;
        --withheld: #b42318;
        --accent: #3158e0;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }}
      * {{ box-sizing: border-box; }}
      body {{ margin: 0; background: var(--canvas); color: var(--text); }}
      button, input, select {{ font: inherit; }}
      button {{
        border: 1px solid var(--border);
        background: var(--panel);
        color: var(--strong);
        min-height: 36px;
        padding: 0 12px;
        border-radius: 6px;
        cursor: pointer;
        text-align: left;
      }}
      button:hover {{ border-color: var(--accent); }}
      button:focus-visible {{
        outline: 3px solid rgba(49, 88, 224, 0.28);
        outline-offset: 2px;
        border-color: var(--accent);
      }}
      .page {{
        max-width: 1560px;
        margin: 0 auto;
        padding: 0 28px 56px;
      }}
      .masthead {{
        min-height: 72px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        border-bottom: 1px solid var(--border);
      }}
      .brand {{
        display: inline-flex;
        align-items: center;
        gap: 10px;
      }}
      .brand-mark {{
        width: 30px;
        height: 30px;
        border-radius: 8px;
        background: linear-gradient(135deg, rgba(49, 88, 224, 0.12), rgba(15, 118, 110, 0.18));
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }}
      .brand-mark svg {{ width: 18px; height: 18px; }}
      .eyebrow {{
        margin: 0 0 6px;
        color: var(--muted);
        font-size: 0.8rem;
        font-weight: 760;
        text-transform: uppercase;
      }}
      h1, h2, h3, p {{ margin-top: 0; }}
      h1 {{
        margin-bottom: 0;
        color: var(--strong);
        font-size: clamp(1.6rem, 3vw, 2.45rem);
        line-height: 1.05;
      }}
      h2 {{ color: var(--strong); font-size: 1.05rem; line-height: 1.2; }}
      h3 {{ color: var(--strong); font-size: 0.95rem; line-height: 1.2; }}
      .mode-pill {{
        display: inline-flex;
        align-items: center;
        min-height: 32px;
        padding: 0 12px;
        border: 1px solid var(--border);
        border-radius: 999px;
        background: var(--panel);
        color: var(--strong);
        font-size: 0.82rem;
        font-weight: 760;
        white-space: nowrap;
      }}
      .verdict-band {{
        margin: 26px 0 22px;
        display: grid;
        grid-template-columns: minmax(0, 1.25fr) minmax(320px, 0.75fr);
        gap: 20px;
        padding: 24px;
        border: 1px solid var(--border);
        border-radius: 8px;
        background: var(--panel);
      }}
      .verdict-kicker {{
        color: var(--muted);
        font-size: 0.8rem;
        font-weight: 760;
        text-transform: uppercase;
        margin-bottom: 8px;
      }}
      .verdict-value {{
        color: var(--approved);
        font-size: clamp(2.8rem, 6vw, 5.6rem);
        line-height: 0.92;
        font-weight: 860;
        overflow-wrap: anywhere;
      }}
      .verdict-value[data-preview="go_with_constraints"] {{ color: var(--constrained); }}
      .verdict-value[data-preview="withheld"] {{ color: var(--withheld); }}
      .verdict-copy {{
        max-width: 76ch;
        font-size: 1rem;
        line-height: 1.55;
      }}
      .metric-grid {{
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }}
      .metric {{
        min-height: 86px;
        padding: 14px;
        border-radius: 8px;
        border: 1px solid var(--border);
        background: var(--inset);
      }}
      .metric strong {{
        display: block;
        color: var(--strong);
        font-size: 1.7rem;
        line-height: 1;
      }}
      .metric span {{
        color: var(--muted);
        font-size: 0.82rem;
      }}
      .state-controls {{
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 16px;
      }}
      .main-grid {{
        display: grid;
        grid-template-columns: minmax(0, 8fr) minmax(320px, 4fr);
        gap: 24px;
        align-items: start;
      }}
      .boundary-grid {{
        display: grid;
        grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
        gap: 24px;
        margin-top: 24px;
      }}
      .panel {{
        min-width: 0;
        border: 1px solid var(--border);
        border-radius: 8px;
        background: var(--panel);
        padding: 18px;
      }}
      .panel-copy {{ color: var(--muted); font-size: 0.92rem; line-height: 1.5; }}
      .ladder {{
        display: grid;
        gap: 8px;
        margin-bottom: 16px;
      }}
      .ladder button {{
        width: 100%;
        display: grid;
        grid-template-columns: minmax(180px, 1.2fr) minmax(120px, 0.5fr) minmax(140px, 0.6fr);
        gap: 10px;
        align-items: center;
      }}
      .label-strong {{
        color: var(--strong);
        font-weight: 760;
        overflow-wrap: anywhere;
      }}
      .status-chip {{
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 26px;
        padding: 0 10px;
        border-radius: 999px;
        color: #fff;
        background: var(--approved);
        font-size: 0.78rem;
        font-weight: 760;
        white-space: nowrap;
      }}
      .status-chip[data-status="go_with_constraints"] {{ background: var(--constrained); }}
      .status-chip[data-status="withheld"] {{ background: var(--withheld); }}
      .proof-basis {{
        color: var(--muted);
        font-size: 0.82rem;
        overflow-wrap: anywhere;
      }}
      .inspector {{
        display: grid;
        gap: 14px;
      }}
      .inspector-card {{
        border: 1px solid var(--border);
        border-radius: 8px;
        background: linear-gradient(180deg, #ffffff 0%, #f6f8fb 100%);
        padding: 14px;
      }}
      .kv {{
        display: grid;
        grid-template-columns: minmax(112px, 0.55fr) minmax(0, 1fr);
        gap: 10px;
        font-size: 0.9rem;
      }}
      .kv dt {{
        color: var(--muted);
        font-weight: 700;
      }}
      .kv dd {{
        margin: 0;
        color: var(--text);
        overflow-wrap: anywhere;
      }}
      .evidence-table,
      .open-items-table,
      .score-table,
      .boundary-table {{
        width: 100%;
        border-collapse: collapse;
        font-size: 0.9rem;
      }}
      th, td {{
        padding: 10px 0;
        vertical-align: top;
        text-align: left;
        border-bottom: 1px solid var(--border);
        overflow-wrap: anywhere;
      }}
      th {{
        color: var(--muted);
        font-size: 0.78rem;
        font-weight: 760;
        text-transform: uppercase;
      }}
      .boundary-map {{
        display: grid;
        gap: 8px;
        margin-bottom: 16px;
      }}
      .boundary-map button {{
        width: 100%;
        display: grid;
        grid-template-columns: minmax(180px, 1fr) auto;
        gap: 12px;
        align-items: center;
      }}
      .detail-list {{
        margin: 0;
        padding-left: 18px;
        color: var(--text);
      }}
      .detail-list li {{
        margin: 0 0 8px;
      }}
      .footnote {{
        margin-top: 14px;
        color: var(--muted);
        font-size: 0.82rem;
      }}
      @media (max-width: 1180px) {{
        .verdict-band,
        .main-grid,
        .boundary-grid {{
          grid-template-columns: 1fr;
        }}
      }}
      @media (max-width: 720px) {{
        .page {{ padding: 0 16px 44px; }}
        .masthead {{ align-items: flex-start; padding: 14px 0; flex-direction: column; }}
        .metric-grid {{ grid-template-columns: 1fr 1fr; }}
        .ladder button,
        .boundary-map button {{
          grid-template-columns: 1fr;
        }}
      }}
      @media (prefers-reduced-motion: reduce) {{
        *, *::before, *::after {{
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }}
      }}
    </style>
  </head>
  <body>
    <div class="page" data-testid="Portal_Support_Baseline_Exit_Board">
      <header class="masthead">
        <div class="brand">
          <span class="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M6 15.5 12 4l6 11.5M8.5 11.5h7" />
            </svg>
          </span>
          <div>
            <p class="eyebrow">Vecells Governance</p>
            <h1>Portal and support baseline exit</h1>
          </div>
        </div>
        <span class="mode-pill">Portal_Support_Baseline_Exit_Board</span>
      </header>

      <section class="verdict-band panel" data-testid="VerdictBand" aria-labelledby="verdict-title">
        <div>
          <p class="verdict-kicker">Formal exit verdict</p>
          <h2 id="verdict-title" class="sr-only" style="position:absolute;left:-9999px;">Verdict</h2>
          <div class="verdict-value" data-testid="decision-verdict"></div>
          <p class="verdict-copy" data-testid="decision-boundary"></p>
          <div class="state-controls" aria-label="Verdict previews">
            <button type="button" data-preview-state="approved">Approved state</button>
            <button type="button" data-preview-state="go_with_constraints">Go-with-constraints state</button>
            <button type="button" data-preview-state="withheld">Withheld state</button>
          </div>
        </div>
        <div>
          <div class="metric-grid">
            <div class="metric"><strong data-testid="approved-count"></strong><span>approved rows</span></div>
            <div class="metric"><strong data-testid="constrained-count"></strong><span>go-with-constraints rows</span></div>
            <div class="metric"><strong data-testid="withheld-count"></strong><span>withheld rows</span></div>
            <div class="metric"><strong data-testid="open-item-count"></strong><span>carry-forward items</span></div>
          </div>
          <p class="footnote" data-testid="verdict-footnote"></p>
        </div>
      </section>

      <div class="main-grid">
        <section class="panel" data-testid="CapabilityConformanceLadder">
          <h2>Capability conformance ladder</h2>
          <p class="panel-copy">One row per capability family required by the exit gate. Every row maps to source traces, owning tasks, machine-readable evidence, and automated proof.</p>
          <div class="ladder" data-testid="family-list"></div>
          <table class="score-table" data-testid="conformance-score-table">
            <thead>
              <tr><th>Capability family</th><th>Status</th><th>Proof basis</th><th>Owner</th></tr>
            </thead>
            <tbody data-testid="score-table-body"></tbody>
          </table>
        </section>

        <aside class="panel" data-testid="EvidenceManifestPanel">
          <h2>Evidence manifest</h2>
          <div class="inspector" data-testid="inspector"></div>
          <p class="footnote">Selected evidence rows: <strong data-testid="selected-evidence-count">0</strong></p>
          <table class="evidence-table" data-testid="evidence-table">
            <thead>
              <tr><th>Kind</th><th>Artifact</th><th>Task</th></tr>
            </thead>
            <tbody data-testid="evidence-table-body"></tbody>
          </table>
        </aside>
      </div>

      <div class="boundary-grid">
        <section class="panel" data-testid="PatientSupportBoundaryMap">
          <h2>Patient/support boundary map</h2>
          <p class="panel-copy">Approved truths stay frozen here. Later Phase 3 and live-environment work must extend them without reopening them.</p>
          <div class="boundary-map" data-testid="boundary-map-list"></div>
          <table class="boundary-table" data-testid="boundary-map-table">
            <thead>
              <tr><th>Carry-forward item</th><th>Owner</th><th>Class</th></tr>
            </thead>
            <tbody data-testid="boundary-table-body"></tbody>
          </table>
        </section>

        <section class="panel" data-testid="OpenItemsCarryForwardTable">
          <h2>Open items and carry-forward table</h2>
          <table class="open-items-table">
            <thead>
              <tr><th>Item</th><th>Blocking class</th><th>Why it is not an exit blocker</th></tr>
            </thead>
            <tbody data-testid="open-items-table-body"></tbody>
          </table>
          <p class="footnote">No blocker is hidden as a note. Every item has an owner, risk, impact statement, and next task boundary.</p>
        </section>
      </div>
    </div>

    <script id="portal-support-exit-data" type="application/json">{payload_json}</script>
    <script>
      const payload = JSON.parse(document.getElementById("portal-support-exit-data").textContent);
      const decision = payload.decision;
      const rows = payload.rows;
      const evidence = payload.evidence;
      const openItems = payload.openItems;
      const previewNotes = {{
        approved: "Approved for the repository-runnable baseline only. Phase 3 may extend it, but live-provider and production signoff remain separate gates.",
        go_with_constraints: "Preview mode only. This would be the fail-closed posture if any conformance family fell below approval or if hidden blockers appeared.",
        withheld: "Preview mode only. This would be the fail-closed posture if mandatory evidence went missing or contradictions remained unresolved."
      }};
      let previewVerdict = decision.gateVerdict;
      let selectedFamilyId = rows[0].capabilityFamilyId;
      let selectedOpenItemId = openItems[0].itemId;

      function statusChip(status) {{
        return `<span class="status-chip" data-status="${{status}}">${{status}}</span>`;
      }}

      function findRow() {{
        return rows.find((row) => row.capabilityFamilyId === selectedFamilyId) || rows[0];
      }}

      function findOpenItem() {{
        return openItems.find((item) => item.itemId === selectedOpenItemId) || openItems[0];
      }}

      function renderVerdict() {{
        document.querySelector("[data-testid='decision-verdict']").textContent = previewVerdict;
        document.querySelector("[data-testid='decision-verdict']").dataset.preview = previewVerdict;
        document.querySelector("[data-testid='decision-boundary']").textContent = decision.approvalBoundary;
        document.querySelector("[data-testid='verdict-footnote']").textContent = previewNotes[previewVerdict];
        document.querySelector("[data-testid='approved-count']").textContent = String(decision.summary.approvedRowCount);
        document.querySelector("[data-testid='constrained-count']").textContent = String(decision.summary.goWithConstraintsRowCount);
        document.querySelector("[data-testid='withheld-count']").textContent = String(decision.summary.withheldRowCount);
        document.querySelector("[data-testid='open-item-count']").textContent = String(decision.summary.openItemCount);
      }}

      function wireRovingButtons(buttons) {{
        buttons.forEach((button, index) => {{
          button.addEventListener("keydown", (event) => {{
            if (!["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {{
              return;
            }}
            event.preventDefault();
            let nextIndex = index;
            if (event.key === "ArrowDown" || event.key === "ArrowRight") {{
              nextIndex = Math.min(buttons.length - 1, index + 1);
            }} else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {{
              nextIndex = Math.max(0, index - 1);
            }} else if (event.key === "Home") {{
              nextIndex = 0;
            }} else if (event.key === "End") {{
              nextIndex = buttons.length - 1;
            }}
            buttons[nextIndex]?.focus();
          }});
        }});
      }}

      function renderLadder() {{
        const ladder = document.querySelector("[data-testid='family-list']");
        ladder.innerHTML = rows.map((row) => `
          <button
            type="button"
            data-testid="family-button-${{row.capabilityFamilyId}}"
            aria-pressed="${{row.capabilityFamilyId === selectedFamilyId}}"
          >
            <span class="label-strong">${{row.capabilityLabel}}</span>
            ${{statusChip(row.status)}}
            <span class="proof-basis">${{row.proofBasis}}</span>
          </button>
        `).join("");
        const buttons = Array.from(ladder.querySelectorAll("button"));
        buttons.forEach((button) => {{
          button.addEventListener("click", () => {{
            selectedFamilyId = button.dataset.testid.replace("family-button-", "");
            renderInspector();
            renderLadder();
          }});
        }});
        wireRovingButtons(buttons);

        document.querySelector("[data-testid='score-table-body']").innerHTML = rows.map((row) => `
          <tr>
            <td>${{row.capabilityLabel}}</td>
            <td>${{statusChip(row.status)}}</td>
            <td>${{row.proofBasis}}</td>
            <td>${{row.owningTasks.join(", ")}}</td>
          </tr>
        `).join("");
      }}

      function renderBoundaryMap() {{
        const boundaryList = document.querySelector("[data-testid='boundary-map-list']");
        boundaryList.innerHTML = openItems.map((item) => `
          <button
            type="button"
            data-testid="open-item-button-${{item.itemId}}"
            aria-pressed="${{item.itemId === selectedOpenItemId}}"
          >
            <span class="label-strong">${{item.title}}</span>
            ${{statusChip(item.deferredState)}}
          </button>
        `).join("");
        const buttons = Array.from(boundaryList.querySelectorAll("button"));
        buttons.forEach((button) => {{
          button.addEventListener("click", () => {{
            selectedOpenItemId = button.dataset.testid.replace("open-item-button-", "");
            renderInspector();
            renderBoundaryMap();
          }});
        }});
        wireRovingButtons(buttons);

        document.querySelector("[data-testid='boundary-table-body']").innerHTML = openItems.map((item) => `
          <tr>
            <td>${{item.title}}</td>
            <td>${{item.nextOwningTask}}</td>
            <td>${{item.carryForwardClass}}</td>
          </tr>
        `).join("");
        document.querySelector("[data-testid='open-items-table-body']").innerHTML = openItems.map((item) => `
          <tr>
            <td>${{item.title}}</td>
            <td>${{item.blockingClass}}</td>
            <td>${{item.whyNotExitBlocker}}</td>
          </tr>
        `).join("");
      }}

      function renderInspector() {{
        const row = findRow();
        const item = findOpenItem();
        const matchingEvidence = evidence.filter((entry) => entry.capability_family_id === row.capabilityFamilyId);
        document.querySelector("[data-testid='selected-evidence-count']").textContent = String(matchingEvidence.length);
        document.querySelector("[data-testid='inspector']").innerHTML = `
          <section class="inspector-card">
            <h3>${{row.capabilityLabel}}</h3>
            <p class="panel-copy">${{row.summary}}</p>
            <dl class="kv">
              <dt>Status</dt><dd>${{row.status}}</dd>
              <dt>Proof basis</dt><dd>${{row.proofBasis}}</dd>
              <dt>Owner</dt><dd>${{row.owningTasks.join(", ")}}</dd>
              <dt>Invariants</dt><dd>${{row.invariantRefs.join(", ")}}</dd>
            </dl>
          </section>
          <section class="inspector-card">
            <h3>${{item.title}}</h3>
            <p class="panel-copy">${{item.whyNotExitBlocker}}</p>
            <dl class="kv">
              <dt>Owner</dt><dd>${{item.nextOwningTask}}</dd>
              <dt>Class</dt><dd>${{item.carryForwardClass}}</dd>
              <dt>Risk</dt><dd>${{item.risk}}</dd>
            </dl>
          </section>
        `;
        document.querySelector("[data-testid='evidence-table-body']").innerHTML = matchingEvidence.map((entry) => `
          <tr>
            <td>${{entry.evidence_kind}}</td>
            <td>${{entry.artifact_ref}}</td>
            <td>${{entry.task_ref}}</td>
          </tr>
        `).join("");
      }}

      function render() {{
        renderVerdict();
        renderLadder();
        renderBoundaryMap();
        renderInspector();
      }}

      document.querySelectorAll("[data-preview-state]").forEach((button) => {{
        button.addEventListener("click", () => {{
          previewVerdict = button.dataset.previewState;
          renderVerdict();
        }});
      }});

      render();
      document.documentElement.dataset.ready = "true";
    </script>
  </body>
</html>
"""


def main() -> None:
    decision = read_json(DECISION_PATH)
    rows = read_json(ROWS_PATH)
    evidence = read_csv(EVIDENCE_PATH)
    open_items = read_json(OPEN_ITEMS_PATH)

    write(EXIT_PACK_PATH, render_pack(decision, rows, open_items))
    write(GO_NO_GO_PATH, render_go_no_go(decision))
    write(SCORECARD_PATH, render_scorecard(rows))
    write(BOUNDARY_PATH, render_boundary(open_items))
    write(BOARD_PATH, render_html(decision, rows, evidence, open_items))


if __name__ == "__main__":
    main()
