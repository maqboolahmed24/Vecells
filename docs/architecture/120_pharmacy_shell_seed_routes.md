# Pharmacy shell seed routes

- Task: `par_120`
- Visual mode: `Pharmacy_Shell_Seed_Routes`
- Shell: `pharmacy-console`
- Route family: `rf_pharmacy_console`

## Seed route law

The Phase 0 pharmacy shell keeps one continuity frame for queue, case workbench, validation review, inventory truth, dispatch proof, outcome review, and assurance. These are child states of the same pharmacy shell, not detached staff pages.

## Non-negotiable shell posture

1. Same case, same shell.
2. One checkpoint and one dominant action remain promoted at a time.
3. Inventory, consent, proof, and outcome truth stay explicit even when the shell is quiet.
4. Urgent return and reopen-for-safety posture stay in the same continuity frame rather than spawning a separate recovery UI.

## Canonical routes

- `/workspace/pharmacy` -> `lane`
- `/workspace/pharmacy/:pharmacyCaseId` -> `case`
- `/workspace/pharmacy/:pharmacyCaseId/validate` -> `validate`
- `/workspace/pharmacy/:pharmacyCaseId/inventory` -> `inventory`
- `/workspace/pharmacy/:pharmacyCaseId/resolve` -> `resolve`
- `/workspace/pharmacy/:pharmacyCaseId/handoff` -> `handoff`
- `/workspace/pharmacy/:pharmacyCaseId/assurance` -> `assurance`

## Seeded route witnesses

- `/workspace/pharmacy` -> `lane` :: Queue spine root with one active case pinned into the validation board.
- `/workspace/pharmacy/PHC-2057` -> `case` :: Case workbench route keeps the validation board and decision plane in one shell.
- `/workspace/pharmacy/PHC-2090/validate` -> `validate` :: Validation route promotes checkpoint detail without detaching from the case workbench.
- `/workspace/pharmacy/PHC-2081/inventory` -> `inventory` :: Inventory route shows supply delta, held posture, and table fallback inside the same shell.
- `/workspace/pharmacy/PHC-2124/resolve` -> `resolve` :: Resolve route keeps weak-match and manual-review truth explicit rather than resolved-looking.
- `/workspace/pharmacy/PHC-2072/handoff` -> `handoff` :: Handoff route distinguishes transport acceptance, provider acceptance, and authoritative proof.
- `/workspace/pharmacy/PHC-2103/assurance` -> `assurance` :: Assurance route keeps reopen-for-safety and watch-window posture explicit.

## Active anchors

- Queue lane root preserves the active case and queue anchor while the validation board stays visible.
- Case workbench preserves the active checkpoint and line item through same-shell posture changes.
- Child routes use a pharmacy return token instead of raw browser history so the exact checkpoint and line item reopen safely.
