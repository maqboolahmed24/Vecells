
# Crosscutting Parallel Claim Protocol

Task: `seq_209`

This protocol is the exact claim rule for the patient-account and support-surface work package.

## Claim Rule

1. A worker may claim any unchecked task from `210` through `222` after `seq_209` is complete.
2. Before implementing, the worker must read `prompt/AGENT.md`, the live checklist, the assigned prompt, this gate pack, the shared interface registry, and the adjacent shared operating contract.
3. The worker must treat `seq_208` and this gate as hard prerequisites.
4. Sibling outputs inside `210` to `222` are soft parallel seams unless the assigned prompt explicitly says otherwise and the output already exists.
5. If a sibling output is absent, stale, contradictory, or underspecified, the worker must consume the relevant `PARALLEL_INTERFACE_GAP_CROSSCUTTING_<AREA>.json` artifact and publish a governed placeholder, adapter, or compatibility note.
6. A worker may not mark a task complete until implementation, local validation, Playwright proof where browser-visible, and machine-readable artifacts are present.

## Parallel Compatibility

| Task | Allowed neighbors | Gap artifacts |
| --- | --- | --- |
| par_210 | par_211<br>par_212<br>par_213<br>par_214<br>par_215 | data/analysis/PARALLEL_INTERFACE_GAP_CROSSCUTTING_HOME.json<br>data/analysis/PARALLEL_INTERFACE_GAP_CROSSCUTTING_REQUEST_CONTEXT.json |
| par_211 | par_210<br>par_212<br>par_213<br>par_214<br>par_215<br>par_216<br>par_217 | data/analysis/PARALLEL_INTERFACE_GAP_CROSSCUTTING_COMMUNICATIONS.json<br>data/analysis/PARALLEL_INTERFACE_GAP_CROSSCUTTING_HOME.json<br>data/analysis/PARALLEL_INTERFACE_GAP_CROSSCUTTING_REQUEST_CONTEXT.json |
| par_212 | par_210<br>par_211<br>par_213<br>par_214<br>par_215<br>par_216 | data/analysis/PARALLEL_INTERFACE_GAP_CROSSCUTTING_COMMUNICATIONS.json<br>data/analysis/PARALLEL_INTERFACE_GAP_CROSSCUTTING_REQUEST_CONTEXT.json |
| par_213 | par_210<br>par_211<br>par_212<br>par_214<br>par_217 | data/analysis/PARALLEL_INTERFACE_GAP_CROSSCUTTING_RECORDS.json |
| par_214 | par_210<br>par_211<br>par_212<br>par_213<br>par_217<br>par_218<br>par_219 | data/analysis/PARALLEL_INTERFACE_GAP_CROSSCUTTING_COMMUNICATIONS.json<br>data/analysis/PARALLEL_INTERFACE_GAP_CROSSCUTTING_REQUEST_CONTEXT.json |
| par_215 | par_210<br>par_211<br>par_212<br>par_213<br>par_214<br>par_216<br>par_217 | data/analysis/PARALLEL_INTERFACE_GAP_CROSSCUTTING_HOME.json |
| par_216 | par_212<br>par_214<br>par_215<br>par_217 | data/analysis/PARALLEL_INTERFACE_GAP_CROSSCUTTING_REQUEST_CONTEXT.json |
| par_217 | par_213<br>par_214<br>par_215<br>par_216 | data/analysis/PARALLEL_INTERFACE_GAP_CROSSCUTTING_COMMUNICATIONS.json<br>data/analysis/PARALLEL_INTERFACE_GAP_CROSSCUTTING_RECORDS.json |
| par_218 | par_214<br>par_219<br>par_220<br>par_221<br>par_222 | data/analysis/PARALLEL_INTERFACE_GAP_CROSSCUTTING_COMMUNICATIONS.json<br>data/analysis/PARALLEL_INTERFACE_GAP_CROSSCUTTING_SUPPORT_LINEAGE.json |
| par_219 | par_214<br>par_218<br>par_220<br>par_221<br>par_222 | data/analysis/PARALLEL_INTERFACE_GAP_CROSSCUTTING_SUPPORT_LINEAGE.json<br>data/analysis/PARALLEL_INTERFACE_GAP_CROSSCUTTING_SUPPORT_REPAIR_REPLAY.json |
| par_220 | par_218<br>par_219<br>par_221<br>par_222 | data/analysis/PARALLEL_INTERFACE_GAP_CROSSCUTTING_SUPPORT_FRONTEND.json<br>data/analysis/PARALLEL_INTERFACE_GAP_CROSSCUTTING_SUPPORT_LINEAGE.json<br>data/analysis/PARALLEL_INTERFACE_GAP_CROSSCUTTING_SUPPORT_REPAIR_REPLAY.json |
| par_221 | par_218<br>par_219<br>par_220<br>par_222 | data/analysis/PARALLEL_INTERFACE_GAP_CROSSCUTTING_SUPPORT_FRONTEND.json<br>data/analysis/PARALLEL_INTERFACE_GAP_CROSSCUTTING_SUPPORT_LINEAGE.json<br>data/analysis/PARALLEL_INTERFACE_GAP_CROSSCUTTING_SUPPORT_REPAIR_REPLAY.json |
| par_222 | par_218<br>par_219<br>par_220<br>par_221 | data/analysis/PARALLEL_INTERFACE_GAP_CROSSCUTTING_SUPPORT_FRONTEND.json<br>data/analysis/PARALLEL_INTERFACE_GAP_CROSSCUTTING_SUPPORT_LINEAGE.json<br>data/analysis/PARALLEL_INTERFACE_GAP_CROSSCUTTING_SUPPORT_REPAIR_REPLAY.json |

## Merge Stop Conditions

- Any shared interface has two owners.
- Any task consumes a sibling projection without a real artifact or explicit gap artifact.
- Any frontend route recomputes domain truth locally.
- Any support surface becomes a second request, message, identity, artifact, or delivery system of record.
- Any live-provider, production clinical-safety, DSPT, rollback, or operational evidence is claimed by this mock-now gate.
