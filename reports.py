"""
Reports Router — Generate and Download PDF Reports
"""

import os
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
from fastapi.security import HTTPAuthorizationCredentials
from models import ReportResponse
from database import MockDB
from services.report_generator import generate_report
from routers.auth import security, get_current_user

router = APIRouter()


@router.post("/reports/generate/{scan_id}", response_model=ReportResponse)
def generate_scan_report(
    scan_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """Generate a PDF report for a completed scan."""
    current_user = get_current_user(credentials)

    # Verify scan exists and belongs to user
    scan = MockDB.get_scan_by_id(scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    if scan["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    # Check if report already exists
    existing_reports = MockDB.get_reports_by_user(current_user["id"])
    for r in existing_reports:
        if r["scan_id"] == scan_id and os.path.exists(r.get("file_path", "")):
            return ReportResponse(
                id=r["id"],
                user_id=r["user_id"],
                scan_id=r["scan_id"],
                file_path=r["file_path"],
                summary=r.get("summary", {}),
                created_at=r["created_at"],
            )

    # Generate PDF
    filepath = generate_report(scan, current_user)

    # Build summary
    stats = scan.get("stats", {})
    summary = {
        "total_vulnerabilities": stats.get("total_vulnerabilities", 0),
        "average_risk_score": stats.get("average_risk_score", 0),
        "total_financial_loss": stats.get("total_financial_loss", "₹0"),
        "total_fix_cost": stats.get("total_fix_cost", "₹0"),
        "critical_count": stats.get("critical_count", 0),
        "high_count": stats.get("high_count", 0),
        "medium_count": stats.get("medium_count", 0),
        "low_count": stats.get("low_count", 0),
    }

    # Store report in database
    report = MockDB.create_report(
        user_id=current_user["id"],
        scan_id=scan_id,
        file_path=filepath,
        summary=summary,
    )

    return ReportResponse(
        id=report["id"],
        user_id=report["user_id"],
        scan_id=report["scan_id"],
        file_path=report["file_path"],
        summary=summary,
        created_at=report["created_at"],
    )


@router.get("/reports")
def get_user_reports(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get all reports for the current user."""
    current_user = get_current_user(credentials)
    reports = MockDB.get_reports_by_user(current_user["id"])

    # Attach scan URL to each report
    result = []
    for r in reports:
        scan = MockDB.get_scan_by_id(r["scan_id"])
        result.append({
            "id": r["id"],
            "scan_id": r["scan_id"],
            "scan_url": scan["url"] if scan else "Unknown",
            "file_path": r["file_path"],
            "summary": r.get("summary", {}),
            "created_at": r["created_at"],
        })

    result.sort(key=lambda r: r.get("created_at", ""), reverse=True)
    return result


@router.get("/reports/{report_id}/download")
def download_report(
    report_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """Download a generated PDF report."""
    current_user = get_current_user(credentials)
    report = MockDB.get_report_by_id(report_id)

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if report["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    filepath = report.get("file_path", "")
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Report file not found on disk")

    return FileResponse(
        path=filepath,
        media_type="application/pdf",
        filename=os.path.basename(filepath),
    )
