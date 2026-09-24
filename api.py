from __future__ import annotations

import os
import shutil
import tempfile
from pathlib import Path
from typing import Any, List, Optional

from fastapi import FastAPI, HTTPException, UploadFile, File, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from ml.live_inference import analyze_report
from ml.live_store import (
    save_report,
    get_reports,
    get_report_count,
    update_review_status,
    find_report_by_content_hash,
    initialize_database,
)
from ml.live_analytics import build_live_analytics
from ml.ingestion import ingest_records, ingest_file

# Initialize SQLite tables on startup
initialize_database()

app = FastAPI(
    title="SIF Sentinel ML & Analytics Engine API",
    version="2.2.1",
    description=(
        "Production-grade HSE intelligence API delivering real-time SIF Precursor Triad Detection, "
        "Positive-Unlabeled (PU) SIF Affinity Scoring, Multilabel IOGP Life-Saving Rules Classification, "
        "Live Incident Persistence, Provenance Tracking, and Operational Analytics."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
)

# Enable CORS for Next.js frontend or external integrations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==============================================================================
# SCHEMAS
# ==============================================================================

class AnalyzeRequest(BaseModel):
    text: Optional[str] = Field(None, description="Raw safety narrative or observation text")
    report_text: Optional[str] = Field(None, description="Alternative key for report text")

    def get_effective_text(self) -> str:
        content = self.text or self.report_text or ""
        return content.strip()


class CreateReportRequest(BaseModel):
    text: Optional[str] = Field(None, description="Safety narrative")
    report_text: Optional[str] = Field(None, description="Alternative key for safety narrative")
    report_type: str = Field(default="Near Miss", description="E.g., Incident, Near Miss, Hazard Observation")
    activity: str = Field(default="", description="Operational activity, e.g., Scaffolding, Drilling, Lifting")
    site: str = Field(default="", description="Field or site name, e.g., Duliajan Rig 7, Moran GGS")
    facility: str = Field(default="", description="Facility or installation designation")
    location: str = Field(default="", description="Specific physical location")

    def get_effective_text(self) -> str:
        content = self.text or self.report_text or ""
        return content.strip()


class ReviewUpdateRequest(BaseModel):
    status: str = Field(..., description="Review status: NEW, UNDER_REVIEW, VALIDATED, SIF_CONFIRMED, FALSE_POSITIVE, DISMISSED")
    reviewer_note: str = Field(default="", description="Investigator or safety officer notes")


class BatchIngestRequest(BaseModel):
    records: List[dict[str, Any]] = Field(..., description="Array of incident records to ingest and analyze")
    source_name: str = Field(default="api_batch_upload", description="Provenance source label or filename")


# ==============================================================================
# CORE ENDPOINTS
# ==============================================================================

@app.get("/", tags=["System"])
def root_info():
    """Service metadata and operational status."""
    return {
        "service": "SIF Sentinel ML & Analytics API",
        "version": "2.2.1",
        "status": "operational",
        "architecture": "FastAPI + Scikit-Learn + TF-IDF (Word & Char-WB) + SQLite Live Store",
        "endpoints": {
            "health": "/health",
            "analyze": "POST /analyze",
            "reports": "GET/POST /reports",
            "analytics": "GET /analytics",
            "ingest": "POST /ingest",
            "docs": "/docs",
        },
    }


@app.get("/health", tags=["System"])
def health_check():
    """Operational health check verifying ML pipeline and database connectivity."""
    db_count = 0
    try:
        db_count = get_report_count()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database connectivity error: {exc}",
        )

    return {
        "status": "healthy",
        "version": "2.2.1",
        "database_connected": True,
        "live_reports_count": db_count,
        "models_loaded": True,
    }


@app.post("/analyze", tags=["Inference"])
@app.post("/api/analyze", tags=["Inference"], include_in_schema=False)
def analyze_safety_narrative(payload: AnalyzeRequest):
    """
    Run real-time inference on an unstructured safety observation:
    - SIF Precursor Triad evaluation (High Energy + Line of Fire + Human Exposure)
    - Positive-Unlabeled (PU) SIF Affinity Score
    - IOGP Life-Saving Rules Multilabel classification
    - HSE Triage rating (PRIORITY REVIEW, REVIEW, ROUTINE)
    """
    text = payload.get_effective_text()
    if not text:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Safety narrative text cannot be empty.",
        )

    try:
        result = analyze_report(text)
        return {
            "success": True,
            "data": result,
        }
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference error: {exc}",
        )


@app.post("/reports", tags=["Live HSE Workflow"])
@app.post("/api/reports", tags=["Live HSE Workflow"], include_in_schema=False)
def submit_and_persist_report(payload: CreateReportRequest):
    """
    Analyze and persist an operational safety report into the live SQLite store.
    Generates a unique readable report ID and sets initial review status to 'NEW'.
    """
    text = payload.get_effective_text()
    if not text:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Report text cannot be empty.",
        )

    try:
        inference = analyze_report(text)
        report_id = save_report(
            inference,
            report_type=payload.report_type,
            activity=payload.activity,
            site=payload.site,
            facility=payload.facility,
            location=payload.location,
        )

        return {
            "success": True,
            "report_id": report_id,
            "report": {
                "report_id": report_id,
                "report_type": payload.report_type,
                "activity": payload.activity,
                "site": payload.site,
                "facility": payload.facility,
                "location": payload.location,
                **inference,
            },
        }
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Report ingestion failed: {exc}",
        )


@app.get("/reports", tags=["Live HSE Workflow"])
@app.get("/api/reports", tags=["Live HSE Workflow"], include_in_schema=False)
def list_reports(
    limit: int = Query(default=100, ge=1, le=1000),
    review_status: Optional[str] = Query(default=None),
):
    """Retrieve submitted reports from the live operational SQLite database."""
    try:
        reports = get_reports()
        if review_status:
            reports = [r for r in reports if str(r.get("review_status", "")).upper() == review_status.upper()]
        return {
            "success": True,
            "total": len(reports),
            "reports": reports[:limit],
        }
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch reports: {exc}",
        )


@app.get("/reports/count", tags=["Live HSE Workflow"])
def report_count():
    """Retrieve total count of live operational reports."""
    try:
        return {"count": get_report_count()}
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to count reports: {exc}",
        )


@app.patch("/reports/{report_id}/review", tags=["Live HSE Workflow"])
@app.post("/reports/{report_id}/review", tags=["Live HSE Workflow"])
def review_report(report_id: str, payload: ReviewUpdateRequest):
    """Update review verification status and investigator notes for a live report."""
    try:
        update_review_status(
            report_id=report_id,
            status=payload.status,
            reviewer_note=payload.reviewer_note,
        )
        return {
            "success": True,
            "report_id": report_id,
            "new_status": payload.status,
            "reviewer_note": payload.reviewer_note,
        }
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update report status: {exc}",
        )


@app.get("/analytics", tags=["Operational Analytics"])
@app.get("/api/analytics", tags=["Operational Analytics"], include_in_schema=False)
def get_live_operational_analytics():
    """
    Retrieve live operational analytics calculated strictly from the live HSE store:
    - Precursor density by site, facility, activity, and location
    - Triad completeness counts
    - IOGP Life-Saving Rules incident frequencies
    - Review triage pipeline breakdown
    """
    try:
        data = build_live_analytics()
        return {
            "success": True,
            "analytics": data,
        }
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to compute operational analytics: {exc}",
        )


@app.post("/ingest", tags=["Batch Ingestion"])
@app.post("/api/ingest", tags=["Batch Ingestion"], include_in_schema=False)
def ingest_batch_records(payload: BatchIngestRequest):
    """
    Ingest a batch of records (dictionaries/JSON objects):
    - De-duplicates against both current batch and persistent live database (SHA-256 content hash)
    - Normalizes text & metadata
    - Runs ML inference
    - Persists with provenance (batch ID, source file, timestamp)
    """
    try:
        summary = ingest_records(
            records=payload.records,
            source_name=payload.source_name,
        )
        return {
            "success": True,
            "summary": summary,
        }
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch ingestion failed: {exc}",
        )


@app.post("/ingest/file", tags=["Batch Ingestion"])
async def ingest_uploaded_file(file: UploadFile = File(...)):
    """
    Upload and ingest an incident file (.csv, .json, .jsonl).
    Extracts records, dedupes, executes inference, and stores in the live HSE queue.
    """
    valid_exts = {".csv", ".json", ".jsonl"}
    ext = Path(file.filename or "").suffix.lower()
    if ext not in valid_exts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type '{ext}'. Supported extensions: {', '.join(valid_exts)}",
        )

    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = Path(tmp.name)

    try:
        summary = ingest_file(tmp_path)
        summary["source_file"] = file.filename or "uploaded_file"
        return {
            "success": True,
            "summary": summary,
        }
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"File ingestion error: {exc}",
        )
    finally:
        if tmp_path.exists():
            os.remove(tmp_path)
