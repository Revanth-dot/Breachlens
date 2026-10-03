"""
Risk Intelligence Engine v2.0
Calculates realistic risk scores, financial loss, breach probability,
security posture, compliance readiness, and breach scenarios.
All values use Indian Rupee (₹) notation.
"""

import random
import math
from datetime import datetime, timedelta
from typing import List, Optional

# ---------------------------------------------------------------------------
# 1. REALISTIC RISK SCORING
# ---------------------------------------------------------------------------

VULN_RISK_BASE = {
    "SQL Injection": 95,
    "Authentication Weakness": 90,
    "Cross-Site Scripting (XSS)": 82,
    "Insecure Direct Object Reference (IDOR)": 85,
    "Cross-Site Request Forgery (CSRF)": 72,
    "Missing Security Headers": 58,
    "Open Directory Listing": 52,
    "Server Information Disclosure": 25,
}

SEVERITY_RISK_MODIFIER = {
    "Critical": 1.0,
    "High": 0.75,
    "Medium": 0.50,
    "Low": 0.25,
}


def calculate_risk_scores(vulnerabilities: list) -> list:
    """
    Enrich vulnerabilities with realistic risk scores, financial loss,
    breach probability, and remediation cost.
    """
    enriched = []
    for vuln in vulnerabilities:
        vuln_type = vuln.get("type", "")
        severity = vuln.get("severity", "Medium")

        # Realistic base risk score per vulnerability type
        base_risk = VULN_RISK_BASE.get(vuln_type, 60)

        # Adjust for severity
        sev_mod = SEVERITY_RISK_MODIFIER.get(severity, 0.5)

        # Apply randomization for realism (±5 points)
        jitter = random.randint(-3, 3)

        risk_score = base_risk * sev_mod + jitter
        risk_score = max(5, min(99, round(risk_score, 1)))

        # Financial loss
        financial_loss = _get_financial_loss(vuln_type, severity)

        # Fix cost
        fix_cost = _get_fix_cost(severity)

        # Breach probability
        breach_prob = _get_breach_probability(vuln_type, severity, risk_score)

        enriched.append({
            **vuln,
            "risk_score": risk_score,
            "breach_probability": f"{breach_prob}%",
            "financial_loss": financial_loss,
            "fix_cost": fix_cost,
        })

    return enriched


def _get_financial_loss(vuln_type: str, severity: str) -> str:
    """Generate estimated financial loss in Indian Rupees."""
    loss_ranges = {
        "SQL Injection":                      (1500000, 5500000),
        "Cross-Site Scripting (XSS)":         (350000, 1800000),
        "Missing Security Headers":           (100000, 600000),
        "Insecure Direct Object Reference (IDOR)": (600000, 2800000),
        "Open Directory Listing":             (200000, 900000),
        "Authentication Weakness":            (1000000, 3500000),
        "Cross-Site Request Forgery (CSRF)":  (400000, 2200000),
        "Server Information Disclosure":      (50000, 250000),
    }

    lo, hi = loss_ranges.get(vuln_type, (200000, 1000000))
    sev_mult = {"Critical": 1.5, "High": 1.2, "Medium": 1.0, "Low": 0.7}
    mult = sev_mult.get(severity, 1.0)

    lo_adj = int(lo * mult)
    hi_adj = int(hi * mult)
    val = random.randint(lo_adj, hi_adj)

    return _fmt_rupees(val)


def _get_fix_cost(severity: str) -> str:
    """Generate estimated remediation cost."""
    costs = {
        "Critical": random.randint(70000, 150000),
        "High":     random.randint(30000, 80000),
        "Medium":   random.randint(10000, 35000),
        "Low":      random.randint(3000, 12000),
    }
    val = costs.get(severity, 20000)
    return _fmt_rupees(val)


def _get_breach_probability(vuln_type: str, severity: str, risk_score: float) -> int:
    """Calculate breach probability as percentage."""
    base_probs = {
        "SQL Injection": 85,
        "Cross-Site Scripting (XSS)": 65,
        "Missing Security Headers": 40,
        "Insecure Direct Object Reference (IDOR)": 75,
        "Open Directory Listing": 50,
        "Authentication Weakness": 80,
        "Cross-Site Request Forgery (CSRF)": 60,
        "Server Information Disclosure": 25,
    }

    base = base_probs.get(vuln_type, 50)
    sev_mod = {"Critical": 12, "High": 8, "Medium": 0, "Low": -10}
    mod = sev_mod.get(severity, 0)

    # Risk score also influences probability
    risk_factor = (risk_score - 50) / 50 * 5

    prob = base + mod + int(risk_factor) + random.randint(-3, 3)
    return max(5, min(99, prob))


# ---------------------------------------------------------------------------
# 2. AGGREGATE FINANCIAL LOSS
# ---------------------------------------------------------------------------

def calculate_total_financial_loss(vulnerabilities: list) -> dict:
    """
    Sum all individual vulnerability financial losses.
    Returns total, formatted string, and per-category breakdown.
    """
    total_loss_num = 0
    by_type = {}

    for v in vulnerabilities:
        loss_str = v.get("financial_loss", "₹0")
        try:
            loss_num = _parse_rupees(loss_str)
        except (ValueError, AttributeError):
            loss_num = 0

        total_loss_num += loss_num
        vtype = v.get("type", "Other")
        by_type[vtype] = by_type.get(vtype, 0) + loss_num

    return {
        "total_loss": _fmt_rupees(total_loss_num),
        "total_loss_numeric": total_loss_num,
        "breakdown_by_type": {k: _fmt_rupees(v) for k, v in sorted(by_type.items(), key=lambda x: -x[1])},
    }


def _parse_rupees(val_str: str) -> float:
    """Parse ₹ formatted string back to float."""
    s = val_str.replace("₹", "").replace(",", "").strip()
    if s.endswith("Cr"):
        return float(s.replace("Cr", "")) * 10000000
    elif s.endswith("L"):
        return float(s.replace("L", "")) * 100000
    else:
        return float(s) if s else 0


# ---------------------------------------------------------------------------
# 3. SECURITY POSTURE SCORE
# ---------------------------------------------------------------------------

def calculate_security_posture(vulnerabilities: list) -> dict:
    """
    Calculate overall security posture score (0-100) and rating.
    100 = perfect security, 0 = completely compromised.
    """
    if not vulnerabilities:
        return {"score": 100, "rating": "Excellent", "reason": "No vulnerabilities detected."}

    total_vulns = len(vulnerabilities)
    critical_count = sum(1 for v in vulnerabilities if v.get("severity") == "Critical")
    high_count = sum(1 for v in vulnerabilities if v.get("severity") == "High")
    medium_count = sum(1 for v in vulnerabilities if v.get("severity") == "Medium")
    low_count = sum(1 for v in vulnerabilities if v.get("severity") == "Low")

    avg_risk = sum(v.get("risk_score", 0) for v in vulnerabilities) / total_vulns

    # Base deduction from severity (less aggressive)
    deductions = critical_count * 15 + high_count * 8 + medium_count * 4 + low_count * 1

    # Additional deduction from average risk score
    risk_deduction = avg_risk * 0.2

    score = 100 - deductions - risk_deduction
    score = max(5, min(100, round(score)))

    # Rating
    if score >= 85:
        rating = "Excellent"
        reason = "Strong security posture with minimal vulnerabilities detected."
    elif score >= 65:
        rating = "Good"
        reason = "Moderate security posture. Address high-severity findings to improve."
    elif score >= 45:
        rating = "Moderate"
        reason = "Security posture needs improvement. Multiple vulnerabilities require attention."
    elif score >= 25:
        rating = "Poor"
        reason = "Weak security posture. Critical vulnerabilities detected that require immediate remediation."
    else:
        rating = "Critical"
        reason = "Severely compromised security posture. Urgent remediation required for all critical findings."

    return {
        "score": score,
        "rating": rating,
        "reason": reason,
        "critical_deduction": round(critical_count * 25, 1),
        "high_deduction": round(high_count * 12, 1),
        "medium_deduction": round(medium_count * 5, 1),
        "low_deduction": round(low_count * 2, 1),
        "risk_deduction": round(risk_deduction, 1),
    }


SECURITY_POSTURE_ICON = {
    "Excellent": "🟢",
    "Good": "🟡",
    "Moderate": "🟠",
    "Poor": "🔴",
    "Critical": "⛔",
}


# ---------------------------------------------------------------------------
# 4. COMPLIANCE ASSESSMENT
# ---------------------------------------------------------------------------

def calculate_compliance(vulnerabilities: list) -> dict:
    """
    Estimate compliance scores based on discovered vulnerabilities.
    Scores represent readiness for OWASP Top 10, GDPR, and ISO 27001.
    """
    if not vulnerabilities:
        return {
            "owasp": 100,
            "gdpr": 100,
            "iso27001": 100,
        }

    total_vulns = len(vulnerabilities)
    critical_count = sum(1 for v in vulnerabilities if v.get("severity") == "Critical")
    high_count = sum(1 for v in vulnerabilities if v.get("severity") == "High")
    medium_count = sum(1 for v in vulnerabilities if v.get("severity") == "Medium")

    # Map vulnerability types to compliance frameworks
    owasp_related = sum(1 for v in vulnerabilities if v.get("type") in [
        "SQL Injection", "Cross-Site Scripting (XSS)",
        "Insecure Direct Object Reference (IDOR)",
        "Authentication Weakness", "Missing Security Headers",
    ])
    gdpr_related = sum(1 for v in vulnerabilities if v.get("type") in [
        "SQL Injection", "Insecure Direct Object Reference (IDOR)",
        "Open Directory Listing", "Server Information Disclosure",
        "Authentication Weakness",
    ])
    iso_related = sum(1 for v in vulnerabilities if v.get("type") in [
        "Authentication Weakness", "Missing Security Headers",
        "Cross-Site Request Forgery (CSRF)",
        "SQL Injection", "Open Directory Listing",
    ])

    # OWASP: heavily penalized by critical findings
    owasp = 100 - (critical_count * 15 + high_count * 8 + medium_count * 4)
    owasp = max(10, min(100, owasp))

    # GDPR: focuses on data exposure vulnerabilities
    gdpr = 100 - (gdpr_related * 10 + critical_count * 5)
    gdpr = max(15, min(100, gdpr))

    # ISO 27001: balanced view
    iso = 100 - (critical_count * 8 + high_count * 5 + medium_count * 3)
    iso = max(10, min(100, iso))

    return {
        "owasp": owasp,
        "gdpr": gdpr,
        "iso27001": iso,
    }


# ---------------------------------------------------------------------------
# 5. BREACH SCENARIO GENERATOR
# ---------------------------------------------------------------------------

ATTACK_CHAINS = {
    "SQL Injection": {
        "steps": [
            "SQL Injection Vulnerability Detected",
            "Database Query Manipulation",
            "Unauthorized Data Extraction",
            "Sensitive Customer Data Exposure",
            "Credential Harvesting",
            "Full Database Compromise",
        ],
        "impact": "Complete database compromise leading to theft of customer PII, financial records, and authentication credentials.",
    },
    "Authentication Weakness": {
        "steps": [
            "Weak Authentication Mechanism Identified",
            "Brute Force Attack Execution",
            "Account Takeover",
            "Privilege Escalation",
            "Admin Panel Access",
            "Full System Compromise",
        ],
        "impact": "Unauthorized administrative access allowing complete system takeover, data manipulation, and service disruption.",
    },
    "Cross-Site Scripting (XSS)": {
        "steps": [
            "XSS Vulnerability Identified",
            "Malicious Script Injection",
            "User Session Hijacking",
            "Cookie Theft",
            "Phishing Attack Delivery",
            "Credential Theft",
        ],
        "impact": "Session hijacking and credential theft affecting multiple users, leading to account takeovers and data breaches.",
    },
    "Insecure Direct Object Reference (IDOR)": {
        "steps": [
            "IDOR Vulnerability Detected",
            "Parameter Manipulation",
            "Unauthorized Resource Access",
            "User Data Exposure",
            "Mass Data Scraping",
            "Privacy Violation",
        ],
        "impact": "Unauthorized access to sensitive user data enabling mass data scraping and severe privacy violations.",
    },
    "Cross-Site Request Forgery (CSRF)": {
        "steps": [
            "CSRF Vulnerability Identified",
            "Malicious Request Crafting",
            "Authenticated Action Execution",
            "Unauthorized Transactions",
            "Account Manipulation",
            "Financial Fraud",
        ],
        "impact": "Ability to execute unauthorized actions on behalf of authenticated users, enabling fraud and data manipulation.",
    },
    "Missing Security Headers": {
        "steps": [
            "Missing Security Headers Detected",
            "Clickjacking Attack Vector",
            "MIME-Type Confusion",
            "Code Injection",
            "Data Theft",
            "Reputational Damage",
        ],
        "impact": "Increased attack surface enabling clickjacking, code injection, and other client-side attacks.",
    },
    "Open Directory Listing": {
        "steps": [
            "Directory Listing Enabled",
            "Sensitive File Discovery",
            "Configuration File Exposure",
            "Backup File Download",
            "Source Code Theft",
            "Intellectual Property Loss",
        ],
        "impact": "Exposure of sensitive configuration files, backups, and source code enabling targeted attacks.",
    },
    "Server Information Disclosure": {
        "steps": [
            "Server Banner Grabbing",
            "Technology Stack Identification",
            "Vulnerability Research",
            "Targeted Exploit Selection",
            "Server Compromise",
            "Data Breach",
        ],
        "impact": "Information leakage aiding attackers in crafting targeted exploits against known server vulnerabilities.",
    },
}


def generate_breach_scenarios(vulnerabilities: list) -> list:
    """
    Generate business-oriented breach scenarios for each critical/high vulnerability.
    """
    scenarios = []
    for vuln in vulnerabilities:
        sev = vuln.get("severity", "")
        if sev not in ("Critical", "High"):
            continue

        vuln_type = vuln.get("type", "Unknown")
        chain = ATTACK_CHAINS.get(vuln_type, {
            "steps": [f"{vuln_type} Detected", "Exploitation", "System Compromise", "Data Breach"],
            "impact": "Potential security breach leading to data compromise and financial loss.",
        })

        risk_score = vuln.get("risk_score", 0)
        loss_str = vuln.get("financial_loss", "₹0")

        # Calculate estimated business impact
        try:
            loss_num = _parse_rupees(loss_str)
        except (ValueError, AttributeError):
            loss_num = 500000

        scenarios.append({
            "vulnerability": vuln_type,
            "severity": sev,
            "risk_score": risk_score,
            "attack_path": chain["steps"],
            "business_impact": chain["impact"],
            "estimated_financial_impact": loss_str,
            "estimated_financial_impact_numeric": loss_num,
            "risk_level": "Critical" if risk_score >= 80 else "High" if risk_score >= 60 else "Medium",
        })

    return scenarios


# ---------------------------------------------------------------------------
# 6. RISK TREND & COMPARISON
# ---------------------------------------------------------------------------

def calculate_risk_trend(all_scans: list) -> dict:
    """
    Calculate risk trends based on scan history.
    Returns aggregated stats for last 7, 30, 90 days.
    """
    now = datetime.utcnow()
    intervals = {
        "last_7_days": now - timedelta(days=7),
        "last_30_days": now - timedelta(days=30),
        "last_90_days": now - timedelta(days=90),
    }

    result = {}
    for label, since in intervals.items():
        relevant = []
        for scan in all_scans:
            try:
                scan_date = datetime.fromisoformat(scan.get("created_at", ""))
                if scan_date >= since:
                    relevant.append(scan)
            except (ValueError, TypeError):
                continue

        if relevant:
            avg_risk = sum(
                s.get("stats", {}).get("average_risk_score", 0) for s in relevant
            ) / len(relevant)

            total_vulns = sum(
                s.get("stats", {}).get("total_vulnerabilities", 0) for s in relevant
            )

            total_loss = 0
            for s in relevant:
                loss_str = s.get("stats", {}).get("total_financial_loss", "₹0")
                try:
                    total_loss += _parse_rupees(loss_str)
                except (ValueError, AttributeError):
                    pass
        else:
            avg_risk = 0
            total_vulns = 0
            total_loss = 0

        result[label] = {
            "scan_count": len(relevant),
            "average_risk_score": round(avg_risk, 1),
            "total_vulnerabilities": total_vulns,
            "total_financial_loss": _fmt_rupees(total_loss),
        }

    return result


def compare_scans(previous_scan: dict, current_scan: dict) -> dict:
    """
    Compare two scans and compute deltas.
    """
    prev_stats = previous_scan.get("stats", {})
    curr_stats = current_scan.get("stats", {})

    prev_risk = prev_stats.get("average_risk_score", 0)
    curr_risk = curr_stats.get("average_risk_score", 0)

    prev_vulns = prev_stats.get("total_vulnerabilities", 0)
    curr_vulns = curr_stats.get("total_vulnerabilities", 0)

    risk_change = curr_risk - prev_risk
    vuln_change = curr_vulns - prev_vulns

    prev_sev = {
        "critical": prev_stats.get("critical_count", 0),
        "high": prev_stats.get("high_count", 0),
        "medium": prev_stats.get("medium_count", 0),
        "low": prev_stats.get("low_count", 0),
    }
    curr_sev = {
        "critical": curr_stats.get("critical_count", 0),
        "high": curr_stats.get("high_count", 0),
        "medium": curr_stats.get("medium_count", 0),
        "low": curr_stats.get("low_count", 0),
    }

    return {
        "previous": {
            "url": previous_scan.get("url", ""),
            "date": previous_scan.get("created_at", "")[:10],
            "risk_score": prev_risk,
            "vulnerabilities": prev_vulns,
            "severity": prev_sev,
        },
        "current": {
            "url": current_scan.get("url", ""),
            "date": current_scan.get("created_at", "")[:10],
            "risk_score": curr_risk,
            "vulnerabilities": curr_vulns,
            "severity": curr_sev,
        },
        "delta": {
            "risk_change": round(risk_change, 1),
            "vulnerability_change": vuln_change,
            "risk_improvement": f"{abs(round(risk_change / prev_risk * 100, 1)) if prev_risk > 0 else 0}% {'decrease' if risk_change < 0 else 'increase'}",
            "vulnerability_improvement": f"{abs(vuln_change)} {'fewer' if vuln_change < 0 else 'more'} vulnerabilities",
            "severity_changes": {
                "critical": curr_sev["critical"] - prev_sev["critical"],
                "high": curr_sev["high"] - prev_sev["high"],
                "medium": curr_sev["medium"] - prev_sev["medium"],
                "low": curr_sev["low"] - prev_sev["low"],
            },
        },
        "overall": _get_overall_assessment(risk_change, vuln_change),
    }


def _get_overall_assessment(risk_change: float, vuln_change: int) -> str:
    """Generate human-readable assessment."""
    if risk_change <= -10 and vuln_change <= -2:
        return "Significant security improvement. Continue current remediation efforts."
    elif risk_change <= -3:
        return "Moderate security improvement. Further remediation recommended."
    elif risk_change >= 10 and vuln_change >= 2:
        return "Security posture deteriorating. Immediate action required."
    elif risk_change >= 3:
        return "Slight increase in risk. Review recent changes."
    else:
        return "Security posture relatively stable. Maintain regular scanning schedule."


# ---------------------------------------------------------------------------
# 7. EXECUTIVE SUMMARY GENERATOR
# ---------------------------------------------------------------------------

def generate_executive_summary(vulnerabilities: list, stats: dict, scan_url: str) -> dict:
    """
    Generate comprehensive executive summary for scan results.
    """
    if not vulnerabilities:
        return {
            "target_url": scan_url,
            "total_vulnerabilities": 0,
            "critical_count": 0,
            "high_count": 0,
            "medium_count": 0,
            "low_count": 0,
            "overall_risk_score": 0,
            "risk_level": "None",
            "estimated_financial_exposure": "₹0",
            "top_priority_risks": [],
            "priority_action": "No vulnerabilities found. Maintain current security practices.",
        }

    total = len(vulnerabilities)
    critical = sum(1 for v in vulnerabilities if v.get("severity") == "Critical")
    high = sum(1 for v in vulnerabilities if v.get("severity") == "High")
    medium = sum(1 for v in vulnerabilities if v.get("severity") == "Medium")
    low = sum(1 for v in vulnerabilities if v.get("severity") == "Low")

    avg_risk = sum(v.get("risk_score", 0) for v in vulnerabilities) / total

    # Determine risk level
    if avg_risk >= 70:
        risk_level = "Critical"
    elif avg_risk >= 50:
        risk_level = "High"
    elif avg_risk >= 30:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    # Calculate total financial exposure
    total_loss = calculate_total_financial_loss(vulnerabilities)

    # Top priority risks (sorted by risk score)
    sorted_vulns = sorted(vulnerabilities, key=lambda v: v.get("risk_score", 0), reverse=True)
    top_risks = []
    for v in sorted_vulns[:3]:
        top_risks.append({
            "type": v.get("type"),
            "severity": v.get("severity"),
            "risk_score": v.get("risk_score"),
            "financial_loss": v.get("financial_loss"),
        })

    # Priority action
    if critical > 0 or high > 0:
        critical_names = [v.get("type") for v in sorted_vulns if v.get("severity") == "Critical"]
        high_names = [v.get("type") for v in sorted_vulns if v.get("severity") == "High"]
        all_priority = critical_names + high_names[:2]
        priority_action = f"Immediately remediate {' and '.join(all_priority[:3])} vulnerabilities."
    elif medium > 0:
        priority_action = "Address medium-severity vulnerabilities within the next patch cycle."
    else:
        priority_action = "No immediate threats. Maintain regular security updates."

    return {
        "target_url": scan_url,
        "total_vulnerabilities": total,
        "critical_count": critical,
        "high_count": high,
        "medium_count": medium,
        "low_count": low,
        "overall_risk_score": round(avg_risk, 1),
        "risk_level": risk_level,
        "estimated_financial_exposure": total_loss["total_loss"],
        "financial_breakdown": total_loss["breakdown_by_type"],
        "top_priority_risks": top_risks,
        "priority_action": priority_action,
    }


# ---------------------------------------------------------------------------
# 8. UTILITY — Indian Rupee Formatting
# ---------------------------------------------------------------------------

def _fmt_rupees(val: int) -> str:
    """Format integer to Indian rupee string."""
    if val >= 10000000:
        return f"₹{val/10000000:.1f}Cr"
    elif val >= 100000:
        return f"₹{val/100000:.1f}L"
    else:
        s = str(val)
        if len(s) <= 3:
            return f"₹{s}"
        last3 = s[-3:]
        rest = s[:-3]
        groups = []
        while rest:
            groups.append(rest[-2:])
            rest = rest[:-2]
        groups.reverse()
        result = ",".join(groups) + "," + last3
        return f"₹{result}"
