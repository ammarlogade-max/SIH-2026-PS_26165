from __future__ import annotations

import csv
import hashlib
import json
import uuid
from pathlib import Path
from typing import Any

from ml.live_inference import analyze_report
from ml.live_store import (
    save_report,
    find_report_by_content_hash,
)


SUPPORTED_SUFFIXES = {
    ".csv",
    ".json",
    ".jsonl",
}


TEXT_FIELDS = (
    "report_text",
    "text",
    "description",
    "observation",
    "report",
    "narrative",
)


METADATA_FIELDS = (
    "report_type",
    "activity",
    "site",
    "facility",
    "location",
    "source_record_id",
)


def _content_hash(text: str) -> str:
    return hashlib.sha256(
        text.strip().encode("utf-8")
    ).hexdigest()


def _batch_id() -> str:
    return "INGEST-" + uuid.uuid4().hex[:12].upper()


def _extract_text(record: dict[str, Any]) -> str:
    for field in TEXT_FIELDS:
        value = record.get(field)
        if value is not None:
            value = str(value).strip()
            if value:
                return value

    return ""


def _normalize_record(
    record: dict[str, Any],
    source_name: str,
) -> dict[str, Any]:

    text = _extract_text(record)

    normalized = {
        "report_text": text,
        "report_type": str(
            record.get("report_type") or ""
        ).strip(),
        "activity": str(
            record.get("activity") or ""
        ).strip(),
        "site": str(
            record.get("site") or ""
        ).strip(),
        "facility": str(
            record.get("facility") or ""
        ).strip(),
        "location": str(
            record.get("location") or ""
        ).strip(),
        "source_record_id": str(
            record.get("source_record_id") or ""
        ).strip(),
        "source_file": source_name,
        "content_hash": _content_hash(text) if text else "",
    }

    return normalized


def _load_csv(path: Path) -> list[dict[str, Any]]:
    with path.open(
        "r",
        encoding="utf-8-sig",
        newline="",
    ) as f:
        return list(csv.DictReader(f))


def _load_json(path: Path) -> list[dict[str, Any]]:
    with path.open(
        "r",
        encoding="utf-8",
    ) as f:
        data = json.load(f)

    if isinstance(data, list):
        return data

    if isinstance(data, dict):
        for key in (
            "reports",
            "records",
            "events",
            "data",
        ):
            value = data.get(key)
            if isinstance(value, list):
                return value

        return [data]

    raise ValueError("JSON root must be an object or array")


def _load_jsonl(path: Path) -> list[dict[str, Any]]:
    records = []

    with path.open(
        "r",
        encoding="utf-8",
    ) as f:

        for line_number, line in enumerate(f, 1):

            line = line.strip()

            if not line:
                continue

            try:
                record = json.loads(line)
            except json.JSONDecodeError as exc:
                raise ValueError(
                    f"Invalid JSONL at line {line_number}: {exc}"
                ) from exc

            records.append(record)

    return records


def load_records(path: str | Path) -> list[dict[str, Any]]:

    path = Path(path)

    if not path.exists():
        raise FileNotFoundError(path)

    if path.suffix.lower() not in SUPPORTED_SUFFIXES:
        raise ValueError(
            f"Unsupported file type: {path.suffix}"
        )

    suffix = path.suffix.lower()

    if suffix == ".csv":
        return _load_csv(path)

    if suffix == ".json":
        return _load_json(path)

    if suffix == ".jsonl":
        return _load_jsonl(path)

    raise ValueError(
        f"Unsupported file type: {suffix}"
    )


def ingest_records(
    records: list[dict[str, Any]],
    source_name: str = "unknown",
) -> dict[str, Any]:

    batch_id = _batch_id()

    summary = {
        "batch_id": batch_id,
        "source_file": source_name,
        "input_records": len(records),
        "accepted": 0,
        "duplicates": 0,
        "validation_failures": 0,
        "errors": 0,
        "records": [],
    }

    seen_hashes: set[str] = set()

    for index, record in enumerate(records):

        result = {
            "input_index": index,
        }

        try:

            if not isinstance(record, dict):
                raise ValueError(
                    "Record must be a JSON object / dictionary"
                )

            normalized = _normalize_record(
                record,
                source_name,
            )

            report_text = normalized["report_text"]

            if not report_text:
                summary["validation_failures"] += 1

                result.update({
                    "status": "VALIDATION_FAILED",
                    "reason": "Missing report text",
                })

                summary["records"].append(result)
                continue

            content_hash_value = normalized[
                "content_hash"
            ]

            # Duplicate inside current batch
            if content_hash_value in seen_hashes:

                summary["duplicates"] += 1

                result.update({
                    "status": "DUPLICATE_IN_BATCH",
                    "content_hash": content_hash_value,
                })

                summary["records"].append(result)
                continue

            seen_hashes.add(content_hash_value)

            # Duplicate against persistent live database
            existing = find_report_by_content_hash(
                content_hash_value
            )

            if existing is not None:

                summary["duplicates"] += 1

                result.update({
                    "status": "DUPLICATE_EXISTING",
                    "content_hash": content_hash_value,
                    "existing_report_id": existing[
                        "report_id"
                    ],
                    "existing_batch_id": existing[
                        "ingestion_batch_id"
                    ],
                })

                summary["records"].append(result)
                continue

            # REAL trained inference path
            inference = analyze_report(
                report_text
            )

            # REAL SQLite persistence
            report_id = save_report(
                inference,
                report_type=normalized[
                    "report_type"
                ],
                activity=normalized[
                    "activity"
                ],
                site=normalized["site"],
                facility=normalized[
                    "facility"
                ],
                location=normalized[
                    "location"
                ],
            )

            # Enrich persistence row with ingestion provenance.
            # This is intentionally performed after save_report()
            # so the existing live-store contract remains intact.
            from ml.live_store import get_connection

            conn = get_connection()

            try:
                from datetime import datetime, timezone

                ingested_at = datetime.now(
                    timezone.utc
                ).isoformat()

                conn.execute(
                    """
                    UPDATE reports
                    SET
                        ingestion_batch_id = ?,
                        source_file = ?,
                        source_record_id = ?,
                        content_hash = ?,
                        ingested_at = ?
                    WHERE report_id = ?
                    """,
                    (
                        batch_id,
                        normalized["source_file"],
                        normalized[
                            "source_record_id"
                        ],
                        content_hash_value,
                        ingested_at,
                        report_id,
                    ),
                )

                conn.commit()

            finally:
                conn.close()

            summary["accepted"] += 1

            result.update({
                "status": "ACCEPTED",
                "report_id": report_id,
                "source_record_id": normalized[
                    "source_record_id"
                ],
                "source_file": normalized[
                    "source_file"
                ],
                "content_hash": content_hash_value,
                "precursor_state": inference[
                    "precursor"
                ]["state"],
                "confidence_band": inference[
                    "precursor"
                ]["confidence_band"],
                "hse_triage": inference[
                    "triage"
                ],
                "sif_affinity_score": inference[
                    "sif_affinity_score"
                ],
            })

            summary["records"].append(result)

        except Exception as exc:

            summary["errors"] += 1

            result.update({
                "status": "ERROR",
                "error": str(exc),
            })

            summary["records"].append(result)

    return summary


def ingest_file(path: str | Path) -> dict[str, Any]:

    path = Path(path)

    records = load_records(path)

    return ingest_records(
        records,
        source_name=path.name,
    )
