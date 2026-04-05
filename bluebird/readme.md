# Bluebird

Bluebird is a manifest-driven remediation queue for the architecture and blueprint corpus in `/Users/test/Code/V/blueprint`.

This file remains the human-readable entry alias for Bluebird. If an autonomous agent is told to "read and implement `bluebird/readme.md`", that instruction must resolve to `/Users/test/Code/V/bluebird/agent.md`, which is the only authoritative execution manifest.

## What Bluebird Contains

- `/Users/test/Code/V/bluebird/agent.md`
  The single state-managed manifest for all Bluebird work. It defines the execution protocol, task states, dependency handling, lane structure, claiming rules, and completion rules.
- `/Users/test/Code/V/bluebird/01-*.md` through `/Users/test/Code/V/bluebird/100-*.md`
  One remediation prompt per failure class. Each prompt tells an agent to map a failure class onto the real system, implement the strongest viable fix, verify it, and close the issue only when the unsafe path is removed or governed.

## Structure

Bluebird currently defines 100 tasks arranged into 10 sequential dependency lanes:

- `L1`: intake, lineage, identity, evidence, and safety foundations
- `L2`: queueing, leases, booking flow, and hub execution
- `L3`: pharmacy, shell continuity, support replay, and governance control
- `L4`: runtime publication, migration safety, audit, and core architecture
- `L5`: identity/session separation, visibility, shell ownership, and trust state
- `L6`: ops-governance handoff, adapters, communications, record parity, and UI kernel
- `L7`: topology, release controls, migration governance, resilience, tenancy, and patient shell
- `L8`: record continuation, assistive rollout, capacity explainability, and ranking
- `L9`: repair journeys, resend tooling, governance simulation, release watch, and degraded mode
- `L10`: embedded runtime, accessibility, visualization parity, testing, audit, and conformance

The lane heads are independent. Tasks deeper in a lane are only claimable after their dependency has been completed.

## Operating Model

Every Bluebird prompt assumes write access to the shared repository and expects direct implementation, not analysis-only output.

The required flow is:

1. Read `/Users/test/Code/V/bluebird/agent.md` first.
2. Determine the single eligible task using the manifest's deterministic selection rules.
3. Claim exactly one task by updating only its checklist line from `pending` to `in-progress`.
4. Read the referenced prompt file.
5. Implement the remediation directly in the repository, usually across the blueprint and architecture documents the prompt references.
6. Verify the change locally.
7. Mark only that claimed task as `completed`, then stop.

If the task cannot be finished safely, the owning agent must release it back to `pending` and terminate rather than leaving stale ownership behind.

## Important Constraints

- `agent.md` is the source of truth. Do not infer work state from this file.
- Never claim or execute more than one Bluebird task in a single run.
- Never begin from a prompt file directly; always start with the manifest.
- Do not bulk-edit the checklist or normalize unrelated task lines.
- Do not stop at diagnosis when the environment is writable.

## Typical Output Surface

Most Bluebird prompts target the documents in `/Users/test/Code/V/blueprint`, including phase blueprints, cross-phase contracts, runtime and release architecture, UI contracts, and verification artifacts. The objective is to keep the planning layer, canonical architecture, verification model, and conformance proof aligned as one system.

## Entry Rule

For autonomous execution, open `/Users/test/Code/V/bluebird/agent.md` and follow it exactly.
