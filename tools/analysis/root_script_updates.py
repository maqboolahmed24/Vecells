from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
PACKAGE_JSON_PATH = ROOT / "package.json"

with PACKAGE_JSON_PATH.open("r", encoding="utf-8") as handle:
    _package_scripts = json.load(handle).get("scripts", {})

ROOT_SCRIPT_UPDATES = {
    name: value
    for name, value in _package_scripts.items()
    if name in {"bootstrap", "check"} or name.startswith("validate:")
}
ROOT_SCRIPT_UPDATES.update(
    {
        "validate:235-review-bundle-stack": "python3 ./tools/analysis/validate_235_review_bundle_stack.py",
        "validate:236-more-info-kernel": "python3 ./tools/analysis/validate_236_more_info_kernel.py",
        "validate:237-response-resafety-pipeline": "python3 ./tools/analysis/validate_237_response_resafety_pipeline.py",
        "validate:238-endpoint-decision-engine": "python3 ./tools/analysis/validate_238_endpoint_decision_engine.py",
    },
)
