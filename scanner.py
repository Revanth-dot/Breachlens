"""
Website Scanner Service (Simulated for MVP)
In production, replaces with real crawling (requests + BeautifulSoup + playwright).
"""

import random
import re
from typing import List
from services.vulnerability_detector import detect_vulnerabilities
from services.risk_engine import calculate_risk_scores, _parse_rupees


def scan_website(url: str) -> dict:
    """
    Simulate a full website security scan.
    Returns scan results with vulnerabilities and statistics.
    """
    # Step 1: Simulate crawling
    crawled_data = _simulate_crawl(url)

    # Step 2: Detect vulnerabilities
    vulnerabilities = detect_vulnerabilities(url, crawled_data)

    # Step 3: Calculate risk scores
    vulnerabilities = calculate_risk_scores(vulnerabilities)

    # Step 4: Compute stats
    stats = _compute_stats(vulnerabilities, url)

    return {
        "results": vulnerabilities,
        "stats": stats,
    }


def _simulate_crawl(url: str) -> dict:
    """Simulate website crawling — discover pages, endpoints, forms."""
    domain = re.sub(r"https?://", "", url).split("/")[0]

    pages = [
        {"path": "/", "status": 200, "forms": 2, "title": "Home"},
        {"path": "/login", "status": 200, "forms": 1, "title": "Login"},
        {"path": "/about", "status": 200, "forms": 0, "title": "About"},
        {"path": "/contact", "status": 200, "forms": 1, "title": "Contact"},
        {"path": "/api/users", "status": 200, "forms": 0, "title": "API Users"},
        {"path": "/admin", "status": 403, "forms": 1, "title": "Admin Panel"},
        {"path": "/search", "status": 200, "forms": 1, "title": "Search"},
        {"path": "/products", "status": 200, "forms": 0, "title": "Products"},
    ]

    endpoints = [
        "/api/users",
        "/api/products",
        "/api/orders",
        "/admin/config",
        "/backup",
        "/.env",
        "/wp-admin",
        "/phpmyadmin",
    ]

    forms = [
        {"path": "/login", "method": "POST", "fields": ["username", "password"]},
        {"path": "/contact", "method": "POST", "fields": ["name", "email", "message"]},
        {"path": "/search", "method": "GET", "fields": ["q"]},
        {"path": "/", "method": "POST", "fields": ["email", "subscribe"]},
    ]

    return {
        "url": url,
        "domain": domain,
        "pages": pages,
        "endpoints": endpoints,
        "forms": forms,
        "total_pages": len(pages),
        "total_endpoints": len(endpoints),
        "total_forms": len(forms),
    }


def _compute_stats(vulnerabilities: list, url: str) -> dict:
    """Compute aggregate statistics from scan results."""
    severity_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    total_risk = 0
    total_loss = 0
    total_fix = 0

    for v in vulnerabilities:
        sev = v.get("severity", "").lower()
        if sev in severity_counts:
            severity_counts[sev] += 1
        total_risk += v.get("risk_score", 0)

        # Parse financial loss (using risk_engine parser for Cr/L notation)
        loss_str = v.get("financial_loss", "₹0")
        try:
            loss_num = _parse_rupees(loss_str)
            total_loss += loss_num
        except (ValueError, AttributeError):
            pass

        # Parse fix cost
        fix_str = v.get("fix_cost", "₹0")
        try:
            fix_num = _parse_rupees(fix_str)
            total_fix += fix_num
        except (ValueError, AttributeError):
            pass

    total_vulns = len(vulnerabilities)

    def _fmt_rupees(val):
        """Format number to Indian rupee notation."""
        if val >= 10000000:
            return f"₹{val/10000000:.1f}Cr"
        elif val >= 100000:
            return f"₹{val/100000:.1f}L"
        else:
            return f"₹{val:,.0f}"

    return {
        "total_vulnerabilities": total_vulns,
        "critical_count": severity_counts["critical"],
        "high_count": severity_counts["high"],
        "medium_count": severity_counts["medium"],
        "low_count": severity_counts["low"],
        "average_risk_score": round(total_risk / total_vulns, 1) if total_vulns > 0 else 0,
        "total_financial_loss": _fmt_rupees(total_loss),
        "total_fix_cost": _fmt_rupees(total_fix),
    }
