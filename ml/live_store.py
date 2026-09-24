from pathlib import Path
import json
import sqlite3
import hashlib
from datetime import datetime, timezone


BASE = Path(__file__).resolve().parents[1]
DB_DIR = BASE / "ml" / "data"
DB_PATH = DB_DIR / "sif_sentinel_live.db"


def get_connection():
    DB_DIR.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(
        DB_PATH,
        check_same_thread=False,
    )

    conn.row_factory = sqlite3.Row

    return conn


def initialize_database():
    DB_DIR.mkdir(parents=True, exist_ok=True)
    conn = get_connection()
    try:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                report_id TEXT UNIQUE NOT NULL,
                created_at TEXT NOT NULL,
                report_type TEXT,
                activity TEXT,
                site TEXT,
                facility TEXT,
                location TEXT,
                report_text TEXT NOT NULL,
                precursor_state TEXT,
                confidence_band TEXT,
                energy TEXT,
                high_energy INTEGER,
                human_present INTEGER,
                line_of_fire INTEGER,
                complete_triad INTEGER,
                sif_affinity REAL,
                hse_triage TEXT,
                iogp_predictions TEXT,
                explanation TEXT,
                review_status TEXT NOT NULL DEFAULT 'NEW',
                reviewer_note TEXT DEFAULT '',
                ingestion_batch_id TEXT DEFAULT '',
                source_file TEXT DEFAULT '',
                source_record_id TEXT DEFAULT '',
                content_hash TEXT DEFAULT '',
                ingested_at TEXT DEFAULT ''
            )
            """
        )

        # Backward-compatible migration for older live databases.
        existing = {row[1] for row in conn.execute("PRAGMA table_info(reports)").fetchall()}
        migrations = {
            "ingestion_batch_id": "TEXT DEFAULT ''",
            "source_file": "TEXT DEFAULT ''",
            "source_record_id": "TEXT DEFAULT ''",
            "content_hash": "TEXT DEFAULT ''",
            "ingested_at": "TEXT DEFAULT ''",
        }
        for column, definition in migrations.items():
            if column not in existing:
                conn.execute(f"ALTER TABLE reports ADD COLUMN {column} {definition}")

        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_reports_ingestion_batch ON reports(ingestion_batch_id)"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_reports_source_record ON reports(source_record_id)"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at)"
        )
        conn.execute(
            "CREATE UNIQUE INDEX IF NOT EXISTS idx_reports_content_hash ON reports(content_hash) WHERE content_hash <> ''"
        )
        conn.commit()
    finally:
        conn.close()



def content_hash(report_text: str) -> str:
    return hashlib.sha256(
        report_text.strip().encode("utf-8")
    ).hexdigest()


def find_report_by_content_hash(content_hash_value: str):
    conn = get_connection()
    try:
        row = conn.execute(
            """
            SELECT report_id, ingestion_batch_id, source_file, source_record_id
            FROM reports
            WHERE content_hash = ?
            LIMIT 1
            """,
            (content_hash_value,),
        ).fetchone()

        if row is None:
            return None

        return {
            "report_id": row[0],
            "ingestion_batch_id": row[1],
            "source_file": row[2],
            "source_record_id": row[3],
        }
    finally:
        conn.close()


def save_report(
    result,
    report_type="Near Miss",
    activity="",
    site="",
    facility="",
    location="",
):
    initialize_database()

    precursor = result["precursor"]

    timestamp = datetime.now(
        timezone.utc
    ).isoformat()

    conn = get_connection()

    # Generate a readable unique ID.
    cursor = conn.execute(
        "SELECT COUNT(*) AS n FROM reports"
    )

    count = cursor.fetchone()["n"] + 1

    report_id = (
        f"SIF-LIVE-{datetime.now(timezone.utc):%Y%m%d}-"
        f"{count:04d}"
    )

    conn.execute(
        """
        INSERT INTO reports (
            report_id,
            created_at,
            report_type,
            activity,
            site,
            facility,
            location,
            report_text,
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
            explanation,
            review_status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            report_id,
            timestamp,
            report_type,
            activity,
            site,
            facility,
            location,
            result["report_text"],
            precursor["state"],
            precursor["confidence_band"],
            precursor["energy"],
            int(precursor["high_energy"]),
            int(precursor["human_present"]),
            int(precursor["line_of_fire"]),
            int(precursor["complete"]),
            float(result["sif_affinity_score"]),
            result["triage"],
            json.dumps(
                result["iogp_predictions"],
                ensure_ascii=False,
            ),
            json.dumps(
                result["explanation"],
                ensure_ascii=False,
            ),
            "NEW",
        ),
    )

    conn.commit()
    conn.close()

    return report_id


def get_reports():
    initialize_database()

    conn = get_connection()

    rows = conn.execute(
        """
        SELECT *
        FROM reports
        ORDER BY id DESC
        """
    ).fetchall()

    conn.close()

    return [dict(row) for row in rows]


def get_report_count():
    initialize_database()

    conn = get_connection()

    count = conn.execute(
        "SELECT COUNT(*) AS n FROM reports"
    ).fetchone()["n"]

    conn.close()

    return int(count)


def update_review_status(
    report_id,
    status,
    reviewer_note="",
):
    initialize_database()

    conn = get_connection()

    conn.execute(
        """
        UPDATE reports
        SET review_status = ?,
            reviewer_note = ?
        WHERE report_id = ?
        """,
        (
            status,
            reviewer_note,
            report_id,
        ),
    )

    conn.commit()
    conn.close()
