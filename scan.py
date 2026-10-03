"""
Scanner Router — Start Scan, Get Scans, Get Dashboard Stats, Executive Summary, Comparison
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPAuthorizationCredentials
from typing import Optional
from models import (
    ScanRequest, ScanResponse, Vulnerability, ScanStats, DashboardStats,
    SecurityPosture, ComplianceAssessment, ExecutiveSummary,
    BreachScenarioItem, ScanComparison, ScanDetailResponse,
)
from database import MockDB
from services.scanner import scan_website
from services.risk_engine import (
    calculate_total_financial_loss,
    calculate_security_posture,
    calculate_compliance,
    generate_breach_scenarios,
    generate_executive_summary,
    calculate_risk_trend,
    compare_scans,
)
from routers.auth import security, get_current_user

router = APIRouter()


@router.post("/scan", response_model=ScanResponse)
def start_scan(req: ScanRequest, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Start a security scan on a target URL."""
    current_user = get_current_user(credentials)

    url = req.url.strip()
    if not url.startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="URL must start with http:// or https://")

    # Perform scan
    scan_data = scan_website(url)

    # Store in database
    scan = MockDB.create_scan(
        user_id=current_user["id"],
        url=url,
        results=scan_data["results"],
        stats=scan_data["stats"],
    )

    return ScanResponse(
        id=scan["id"],
        user_id=scan["user_id"],
        url=scan["url"],
        status=scan["status"],
        results=[Vulnerability(**r) for r in scan["results"]],
        stats=ScanStats(**scan["stats"]),
        created_at=scan["created_at"],
    )


@router.get("/scans", response_model=list)
def get_user_scans(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get all scans for the current user."""
    current_user = get_current_user(credentials)
    scans = MockDB.get_scans_by_user(current_user["id"])
    scans.sort(key=lambda s: s.get("created_at", ""), reverse=True)
    return scans


@router.get("/scans/{scan_id}", response_model=ScanResponse)
def get_scan_detail(scan_id: str, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get detailed results for a specific scan."""
    current_user = get_current_user(credentials)
    scan = MockDB.get_scan_by_id(scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    if scan["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    return ScanResponse(
        id=scan["id"],
        user_id=scan["user_id"],
        url=scan["url"],
        status=scan["status"],
        results=[Vulnerability(**r) for r in scan["results"]],
        stats=ScanStats(**scan["stats"]),
        created_at=scan["created_at"],
    )


@router.get("/scans/{scan_id}/enhanced", response_model=ScanDetailResponse)
def get_scan_enhanced(scan_id: str, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get scan with executive summary, posture, compliance, and breach scenarios."""
    current_user = get_current_user(credentials)
    scan = MockDB.get_scan_by_id(scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    if scan["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    results = scan.get("results", [])
    stats = scan.get("stats", {})

    return ScanDetailResponse(
        scan=ScanResponse(
            id=scan["id"],
            user_id=scan["user_id"],
            url=scan["url"],
            status=scan["status"],
            results=[Vulnerability(**r) for r in results],
            stats=ScanStats(**stats),
            created_at=scan["created_at"],
        ),
        executive_summary=ExecutiveSummary(
            **generate_executive_summary(results, stats, scan["url"])
        ),
        security_posture=SecurityPosture(
            **calculate_security_posture(results)
        ),
        compliance=ComplianceAssessment(
            **calculate_compliance(results)
        ),
        breach_scenarios=[
            BreachScenarioItem(**s)
            for s in generate_breach_scenarios(results)
        ],
    )


@router.get("/scans/{scan_id}/executive-summary", response_model=ExecutiveSummary)
def get_executive_summary(scan_id: str, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get executive summary for a scan."""
    current_user = get_current_user(credentials)
    scan = MockDB.get_scan_by_id(scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    if scan["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    return ExecutiveSummary(
        **generate_executive_summary(
            scan.get("results", []), scan.get("stats", {}), scan["url"]
        )
    )


@router.get("/scans/{scan_id}/breach-scenarios", response_model=list)
def get_breach_scenarios(scan_id: str, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get breach scenarios for a scan."""
    current_user = get_current_user(credentials)
    scan = MockDB.get_scan_by_id(scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    if scan["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    return generate_breach_scenarios(scan.get("results", []))


@router.get("/scans/{scan_id}/compare", response_model=ScanComparison)
def compare_scan_with_previous(
    scan_id: str,
    previous_scan_id: Optional[str] = None,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """Compare a scan with a previous scan."""
    current_user = get_current_user(credentials)
    current = MockDB.get_scan_by_id(scan_id)
    if not current:
        raise HTTPException(status_code=404, detail="Scan not found")
    if current["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    if previous_scan_id:
        previous = MockDB.get_scan_by_id(previous_scan_id)
        if not previous:
            raise HTTPException(status_code=404, detail="Previous scan not found")
        if previous["user_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Access denied")
    else:
        # Auto-find previous scan for same user
        scans = MockDB.get_scans_by_user(current_user["id"])
        scans.sort(key=lambda s: s.get("created_at", ""), reverse=True)
        # Find the most recent scan before current
        current_created = current.get("created_at", "")
        previous = None
        for s in scans:
            if s["id"] != scan_id and s.get("created_at", "") < current_created:
                previous = s
                break
        if not previous:
            raise HTTPException(
                status_code=404,
                detail="No previous scan found for comparison. Complete at least two scans.",
            )

    return ScanComparison(**compare_scans(previous, current))


@router.get("/dashboard/stats", response_model=DashboardStats)
def get_dashboard_stats(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get aggregated dashboard statistics with enhanced intelligence."""
    current_user = get_current_user(credentials)
    scans = MockDB.get_scans_by_user(current_user["id"])

    total_scans = len(scans)
    total_vulns = 0
    total_risk = 0
    total_loss_num = 0

    vuln_type_count = {}
    severity_breakdown = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}
    recent_scans = []
    risk_trend = []

    # Collect all vulnerabilities for aggregate calculations
    all_vulns = []

    for scan in scans:
        results = scan.get("results", [])
        stats = scan.get("stats", {})
        total_vulns += stats.get("total_vulnerabilities", 0)
        total_risk += stats.get("average_risk_score", 0) * stats.get("total_vulnerabilities", 0)

        # Parse financial loss from stats
        loss_str = stats.get("total_financial_loss", "₹0")
        try:
            from services.risk_engine import _parse_rupees
            total_loss_num += _parse_rupees(loss_str)
        except (ValueError, AttributeError):
            pass

        # Count by type and severity
        for r in results:
            vtype = r.get("type", "Other")
            vuln_type_count[vtype] = vuln_type_count.get(vtype, 0) + 1
            sev = r.get("severity", "Low")
            if sev in severity_breakdown:
                severity_breakdown[sev] += 1
            all_vulns.append(r)

        # Recent scans
        recent_scans.append({
            "id": scan["id"],
            "url": scan["url"],
            "status": scan["status"],
            "vulnerabilities": stats.get("total_vulnerabilities", 0),
            "risk_score": stats.get("average_risk_score", 0),
            "created_at": scan.get("created_at", ""),
        })

        risk_trend.append({
            "date": scan.get("created_at", "")[:10],
            "risk_score": stats.get("average_risk_score", 0),
            "vulnerabilities": stats.get("total_vulnerabilities", 0),
        })

    recent_scans.sort(key=lambda s: s.get("created_at", ""), reverse=True)
    recent_scans = recent_scans[:10]
    risk_trend.sort(key=lambda t: t.get("date", ""))

    # Format total loss
    def _fmt_loss(val):
        if val >= 10000000:
            return f"₹{val/10000000:.1f}Cr"
        elif val >= 100000:
            return f"₹{val/100000:.1f}L"
        else:
            return f"₹{val:,.0f}"

    # Calculate security posture from ALL vulnerabilities
    posture = calculate_security_posture(all_vulns)
    compliance = calculate_compliance(all_vulns)

    return DashboardStats(
        total_scans=total_scans,
        total_vulnerabilities=total_vulns,
        average_risk_score=round(total_risk / total_vulns, 1) if total_vulns > 0 else 0,
        total_financial_loss=_fmt_loss(total_loss_num),
        vulnerability_distribution=vuln_type_count,
        severity_breakdown=severity_breakdown,
        recent_scans=recent_scans,
        risk_trend=risk_trend,
        security_posture=SecurityPosture(**posture),
        compliance=ComplianceAssessment(**compliance),
    )
