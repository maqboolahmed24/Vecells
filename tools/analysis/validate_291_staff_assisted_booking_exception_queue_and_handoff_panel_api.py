#!/usr/bin/env python3
from __future__ import annotations

import runpy
from pathlib import Path


ROOT = Path(__file__).resolve().parent


if __name__ == "__main__":
    runpy.run_path(str(ROOT / "validate_291_staff_assisted_booking_api.py"), run_name="__main__")
