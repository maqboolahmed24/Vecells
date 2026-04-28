# Assistive Evaluation Domain

This package owns the Phase 8 executable evaluation plane:

- dataset partition manifests for `gold`, `shadow_live`, and `feedback`
- deterministic case replay bundles and replay runs
- ground-truth labels, adjudication, and error taxonomy records
- shadow dataset capture that remains invisible to end users
- summary-first evaluation export artifacts
- internal evaluation surface binding resolution

The package deliberately has no live workflow mutation dependency. It reads frozen refs and writes only evaluation-plane records.
