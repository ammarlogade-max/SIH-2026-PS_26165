"""
SIF Sentinel - Live Operational Analytics

IMPORTANT:
- Reads ONLY from the live HSE SQLite store.
- Does NOT modify the canonical 3,019-event corpus.
- Live density is operational monitoring, not a statistical estimate of
  real-world SIF probability.
"""

from __future__ import annotations

import json
import sqlite3
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

BASE_DIR = Path(__file__).resolve().parents[1]
DB_PATH = BASE_DIR / "ml" / "data" / "sif_sentinel_live.db"


def _load_reports() -> list[dict[str, Any]]:
    if not DB_PATH.exists():
        return []

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    try:
        rows = conn.execute(
            """
            SELECT
                id,
                report_id,
                created_at,
                report_type,
                activity,
                site,
                facility,
                location,
                precursor_state,
                confidence_band,
                energy,
                high_energy,
                human_present,
                line_of_fire,
                complete_triad,
                sif_affinity,
                hse_triage,
                iogp_predictions,
                review_status
            FROM reports
            ORDER BY created_at DESC
            """
        ).fetchall()

        reports = []

        for row in rows:
            item = dict(row)

            raw_iogp = item.get("iogp_predictions")

            if isinstance(raw_iogp, str):
                try:
                    item["iogp_predictions"] = json.loads(raw_iogp)
                except Exception:
                    item["iogp_predictions"] = []
            elif raw_iogp is None:
                item["iogp_predictions"] = []

            reports.append(item)

        return reports

    finally:
        conn.close()


def _safe_name(value: Any) -> str:
    if value is None:
        return "UNKNOWN"

    value = str(value).strip()

    return value if value else "UNKNOWN"


def _density(total: int, precursor_count: int) -> float:
    if total <= 0:
        return 0.0

    return precursor_count / total


def _profile(
    reports: list[dict[str, Any]],
    field: str,
) -> list[dict[str, Any]]:
    groups: dict[str, list[dict[str, Any]]] = defaultdict(list)

    for report in reports:
        groups[_safe_name(report.get(field))].append(report)

    output = []

    for name, rows in groups.items():
        total = len(rows)

        high = sum(
            1
            for r in rows
            if "HIGH" in str(r.get("precursor_state", "")).upper()
        )

        priority = sum(
            1
            for r in rows
            if str(r.get("hse_triage", "")).upper() == "PRIORITY REVIEW"
        )

        review = sum(
            1
            for r in rows
            if str(r.get("hse_triage", "")).upper() == "REVIEW"
        )

        triad = sum(
            1
            for r in rows
            if bool(r.get("complete_triad"))
        )

        line_of_fire = sum(
            1
            for r in rows
            if bool(r.get("line_of_fire"))
        )

        human_present = sum(
            1
            for r in rows
            if bool(r.get("human_present"))
        )

        high_energy = sum(
            1
            for r in rows
            if bool(r.get("high_energy"))
        )

        output.append(
            {
                "name": name,
                "total_reports": total,
                "high_precursor": high,
                "priority_review": priority,
                "review": review,
                "complete_triad": triad,
                "line_of_fire": line_of_fire,
                "human_present": human_present,
                "high_energy": high_energy,
                "precursor_density": round(
                    _density(total, high), 4
                ),
                "triad_density": round(
                    _density(total, triad), 4
                ),
            }
        )

    return sorted(
        output,
        key=lambda x: (
            x["precursor_density"],
            x["total_reports"],
        ),
        reverse=True,
    )


def _iogp_summary(
    reports: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    counts = Counter()

    for report in reports:
        predictions = report.get("iogp_predictions") or []

        if isinstance(predictions, dict):
            predictions = [predictions]

        for prediction in predictions:
            if not isinstance(prediction, dict):
                continue

            rule = (
                prediction.get("rule_name")
                or prediction.get("rule")
                or prediction.get("name")
                or prediction.get("label")
            )

            if rule:
                counts[str(rule)] += 1

    return [
        {
            "rule": rule,
            "live_reports": count,
        }
        for rule, count in counts.most_common()
    ]


def build_live_analytics() -> dict[str, Any]:
    reports = _load_reports()

    total = len(reports)

    priority = sum(
        1
        for r in reports
        if str(r.get("hse_triage", "")).upper() == "PRIORITY REVIEW"
    )

    review = sum(
        1
        for r in reports
        if str(r.get("hse_triage", "")).upper() == "REVIEW"
    )

    routine = sum(
        1
        for r in reports
        if str(r.get("hse_triage", "")).upper() == "ROUTINE"
    )

    triad = sum(
        1
        for r in reports
        if bool(r.get("complete_triad"))
    )

    high_energy = sum(
        1
        for r in reports
        if bool(r.get("high_energy"))
    )

    line_of_fire = sum(
        1
        for r in reports
        if bool(r.get("line_of_fire"))
    )

    human_present = sum(
        1
        for r in reports
        if bool(r.get("human_present"))
    )

    status_counts = Counter(
        _safe_name(r.get("review_status"))
        for r in reports
    )

    return {
        "source": "LIVE_HSE_QUEUE",
        "database": str(DB_PATH),
        "canonical_corpus_untouched": True,
        "total_reports": total,
        "priority_review": priority,
        "review": review,
        "routine": routine,
        "complete_triad": triad,
        "high_energy": high_energy,
        "line_of_fire": line_of_fire,
        "human_present": human_present,
        "review_status": dict(status_counts),
        "activity_profiles": _profile(reports, "activity"),
        "site_profiles": _profile(reports, "site"),
        "facility_profiles": _profile(reports, "facility"),
        "location_profiles": _profile(reports, "location"),
        "iogp_rules": _iogp_summary(reports),
        "methodology": [
            "Live analytics are calculated only from reports submitted through the HSE workflow.",
            "The canonical 3,019-event external corpus is not modified.",
            "Precursor density is the share of live reports with precursor_state=HIGH.",
            "Complete precursor triad is a descriptive operational signal.",
            "SIF affinity is a ranking signal, not a calibrated fatality probability.",
            "Small live groups should not be interpreted as stable statistical rates.",
        ],
    }


if __name__ == "__main__":
    data = build_live_analytics()

    print("\n===== SIF SENTINEL LIVE ANALYTICS =====")
    print(f"Live reports:        {data['total_reports']}")
    print(f"Priority review:     {data['priority_review']}")
    print(f"Review:              {data['review']}")
    print(f"Routine:             {data['routine']}")
    print(f"Complete triad:      {data['complete_triad']}")
    print(f"High energy:         {data['high_energy']}")
    print(f"Line of fire:        {data['line_of_fire']}")
    print(f"Human present:       {data['human_present']}")

    print("\n--- SITE PROFILES ---")
    for row in data["site_profiles"]:
        print(
            f"{row['name']}: "
            f"{row['total_reports']} reports | "
            f"high precursor={row['precursor_density']:.1%}"
        )

    print("\n--- ACTIVITY PROFILES ---")
    for row in data["activity_profiles"]:
        print(
            f"{row['name']}: "
            f"{row['total_reports']} reports | "
            f"high precursor={row['precursor_density']:.1%}"
        )

    print("\n--- FACILITY PROFILES ---")
    for row in data["facility_profiles"]:
        print(
            f"{row['name']}: "
            f"{row['total_reports']} reports | "
            f"high precursor={row['precursor_density']:.1%}"
        )

    print("\n--- IOGP RULES ---")
    for row in data["iogp_rules"]:
        print(
            f"{row['rule']}: "
            f"{row['live_reports']}"
        )

    print("\n===== ANALYTICS OK =====")
