"""
PDF Report Generator using ReportLab
Generates professional executive security reports with all enhanced sections.
"""

import os
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, black, white, grey
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, Image
)
from reportlab.graphics.shapes import Drawing, Rect, String, Circle, Line
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.charts.piecharts import Pie
from reportlab.graphics import renderPDF

from services.risk_engine import (
    calculate_total_financial_loss,
    calculate_security_posture,
    calculate_compliance,
    generate_breach_scenarios,
    generate_executive_summary,
    _parse_rupees,
)

REPORTS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "reports")

# Brand colors
PRIMARY = HexColor("#1a1a2e")
SECONDARY = HexColor("#16213e")
ACCENT = HexColor("#0f3460")
HIGHLIGHT = HexColor("#e94560")
SUCCESS = HexColor("#00b894")
WARNING = HexColor("#fdcb6e")
DANGER = HexColor("#e17055")
INFO = HexColor("#74b9ff")
BG_LIGHT = HexColor("#f8f9fa")

SEVERITY_COLORS = {
    "Critical": HexColor("#e94560"),
    "High": HexColor("#f39c12"),
    "Medium": HexColor("#fdcb6e"),
    "Low": HexColor("#00b894"),
}


def generate_report(scan: dict, user: dict) -> str:
    """Generate a PDF report for a scan with all enhanced sections."""
    os.makedirs(REPORTS_DIR, exist_ok=True)

    filename = f"breachlens_report_{scan['id'][:8]}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    filepath = os.path.join(REPORTS_DIR, filename)

    doc = SimpleDocTemplate(
        filepath,
        pagesize=A4,
        topMargin=20*mm,
        bottomMargin=20*mm,
        leftMargin=20*mm,
        rightMargin=20*mm,
    )

    styles = getSampleStyleSheet()
    elements = []

    # ── Custom Styles ──
    title_style = ParagraphStyle("Title2", parent=styles["Title"],
        fontSize=24, textColor=PRIMARY, spaceAfter=6, leading=30)
    subtitle_style = ParagraphStyle("Subtitle2", parent=styles["Normal"],
        fontSize=12, textColor=HexColor("#636e72"), spaceAfter=20)
    heading1 = ParagraphStyle("H1", parent=styles["Heading1"],
        fontSize=16, textColor=PRIMARY, spaceAfter=10, spaceBefore=20)
    heading2 = ParagraphStyle("H2", parent=styles["Heading2"],
        fontSize=13, textColor=SECONDARY, spaceAfter=8, spaceBefore=14)
    body = ParagraphStyle("Body2", parent=styles["Normal"],
        fontSize=10, leading=15, spaceAfter=6)
    small_text = ParagraphStyle("Small", parent=styles["Normal"],
        fontSize=8, textColor=grey)
    danger_text = ParagraphStyle("Danger", parent=body,
        textColor=DANGER, fontSize=10)
    success_text = ParagraphStyle("Success", parent=body,
        textColor=SUCCESS, fontSize=10)

    stats = scan.get("stats", {})
    results = scan.get("results", [])

    # Generate enhanced data
    exec_summary = generate_executive_summary(results, stats, scan["url"])
    posture = calculate_security_posture(results)
    compliance = calculate_compliance(results)
    breach_scenarios = generate_breach_scenarios(results)

    # ════════════════════════════════════════════════════
    # COVER PAGE
    # ════════════════════════════════════════════════════
    elements.append(Spacer(1, 60*mm))
    elements.append(Paragraph("BreachLens", title_style))
    elements.append(Paragraph("Security Vulnerability Assessment Report", subtitle_style))
    elements.append(HRFlowable(width="100%", thickness=2, color=ACCENT, spaceAfter=10))
    elements.append(Paragraph(f"<b>Target:</b> {scan['url']}", body))
    elements.append(Paragraph(f"<b>Scan Date:</b> {scan.get('created_at', 'N/A')[:10]}", body))
    elements.append(Paragraph(f"<b>Report Generated:</b> {datetime.now().strftime('%Y-%m-%d %H:%M')}", body))
    elements.append(Paragraph(f"<b>Prepared For:</b> {user.get('name', 'N/A')} ({user.get('email', 'N/A')})", body))
    elements.append(Spacer(1, 15*mm))

    # Risk level badge on cover
    risk_score = exec_summary.get("overall_risk_score", 0)
    risk_level = exec_summary.get("risk_level", "Moderate")
    rl_color = DANGER if risk_score >= 70 else (WARNING if risk_score >= 50 else SUCCESS)
    elements.append(Paragraph(
        f"<b>Overall Risk Score:</b> <font color='#{rl_color.hexval()}'>{risk_score:.1f}/100 — {risk_level}</font>",
        subtitle_style
    ))

    elements.append(Spacer(1, 20*mm))
    elements.append(Paragraph("<i>Confidential — For Authorized Recipients Only</i>", small_text))
    elements.append(PageBreak())

    # ════════════════════════════════════════════════════
    # EXECUTIVE SUMMARY
    # ════════════════════════════════════════════════════
    elements.append(Paragraph("1. Executive Summary", heading1))
    elements.append(HRFlowable(width="100%", thickness=1, color=ACCENT, spaceAfter=10))

    elements.append(Paragraph(
        f"BreachLens conducted a comprehensive security assessment of <b>{scan['url']}</b> on "
        f"{scan.get('created_at', 'N/A')[:10]}. The scan identified <b>{exec_summary['total_vulnerabilities']}</b> "
        f"security vulnerabilities with an overall risk score of <b>{exec_summary['overall_risk_score']:.1f}/100</b> "
        f"(<b>{exec_summary['risk_level']}</b>). The estimated total financial exposure is "
        f"<b>{exec_summary['estimated_financial_exposure']}</b>.", body))
    elements.append(Spacer(1, 4*mm))

    # Key metrics table
    elements.append(Paragraph("<b>Key Metrics</b>", heading2))
    metrics_data = [
        ["Metric", "Value"],
        ["Target URL", scan['url']],
        ["Total Vulnerabilities", str(exec_summary['total_vulnerabilities'])],
        ["Critical", str(exec_summary['critical_count'])],
        ["High", str(exec_summary['high_count'])],
        ["Medium", str(exec_summary['medium_count'])],
        ["Low", str(exec_summary['low_count'])],
        ["Overall Risk Score", f"{exec_summary['overall_risk_score']:.1f}/100"],
        ["Risk Level", exec_summary['risk_level']],
        ["Estimated Financial Exposure", exec_summary['estimated_financial_exposure']],
    ]
    mt = Table(metrics_data, colWidths=[100*mm, 80*mm])
    mt.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 10),
        ("BACKGROUND", (0, 1), (-1, -1), BG_LIGHT),
        ("TEXTCOLOR", (0, 1), (-1, -1), black),
        ("FONTSIZE", (0, 1), (-1, -1), 9),
        ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#dfe6e9")),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    elements.append(mt)
    elements.append(Spacer(1, 6*mm))

    elements.append(Paragraph(f"<b>Priority Action:</b> {exec_summary.get('priority_action', 'Review all findings.')}", body))
    elements.append(PageBreak())

    # ════════════════════════════════════════════════════
    # SECURITY POSTURE
    # ════════════════════════════════════════════════════
    elements.append(Paragraph("2. Security Posture Assessment", heading1))
    elements.append(HRFlowable(width="100%", thickness=1, color=ACCENT, spaceAfter=10))

    posture_score = posture.get("score", 0)
    posture_rating = posture.get("rating", "Moderate")
    p_color = DANGER if posture_score < 40 else (WARNING if posture_score < 70 else SUCCESS)

    # Visual score bar
    d = Drawing(460, 50)
    # Background bar
    d.add(Rect(0, 15, 460, 20, fillColor=HexColor("#dfe6e9"), strokeColor=None))
    # Score fill
    fill_w = max(4, int(460 * posture_score / 100))
    d.add(Rect(0, 15, fill_w, 20, fillColor=p_color, strokeColor=None))
    # Label
    d.add(String(230, 40, f"Security Posture Score: {posture_score:.0f}/100 — {posture_rating}",
                 textAnchor="middle", fontSize=11, fillColor=PRIMARY,
                 fontName="Helvetica-Bold"))
    elements.append(d)
    elements.append(Spacer(1, 6*mm))
    elements.append(Paragraph(f"<b>Reason:</b> {posture.get('reason', 'N/A')}", body))
    elements.append(Spacer(1, 8*mm))

    # ════════════════════════════════════════════════════
    # COMPLIANCE ASSESSMENT
    # ════════════════════════════════════════════════════
    elements.append(Paragraph("3. Compliance Assessment", heading1))
    elements.append(HRFlowable(width="100%", thickness=1, color=ACCENT, spaceAfter=10))

    compl_data = [
        ["Framework", "Compliance Score", "Status"],
        ["OWASP Top 10", f"{compliance.get('owasp', 0):.0f}%",
         "Compliant" if compliance.get('owasp', 0) >= 70 else "Partially Compliant" if compliance.get('owasp', 0) >= 40 else "Non-Compliant"],
        ["GDPR Readiness", f"{compliance.get('gdpr', 0):.0f}%",
         "Ready" if compliance.get('gdpr', 0) >= 70 else "Partially Ready" if compliance.get('gdpr', 0) >= 40 else "Not Ready"],
        ["ISO 27001 Readiness", f"{compliance.get('iso27001', 0):.0f}%",
         "Ready" if compliance.get('iso27001', 0) >= 70 else "Partially Ready" if compliance.get('iso27001', 0) >= 40 else "Not Ready"],
    ]
    ct = Table(compl_data, colWidths=[90*mm, 50*mm, 40*mm])
    ct.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 10),
        ("BACKGROUND", (0, 1), (-1, -1), BG_LIGHT),
        ("TEXTCOLOR", (0, 1), (-1, -1), black),
        ("FONTSIZE", (0, 1), (-1, -1), 9),
        ("ALIGN", (1, 0), (2, -1), "CENTER"),
        ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#dfe6e9")),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    elements.append(ct)
    elements.append(PageBreak())

    # ════════════════════════════════════════════════════
    # VULNERABILITY DETAILS
    # ════════════════════════════════════════════════════
    elements.append(Paragraph("4. Vulnerability Details", heading1))
    elements.append(HRFlowable(width="100%", thickness=1, color=ACCENT, spaceAfter=10))

    SEVERITY_HEX = {"Critical": "e94560", "High": "f39c12", "Medium": "fdcb6e", "Low": "00b894"}
    for i, vuln in enumerate(results, 1):
        sev = vuln.get("severity", "Medium")
        sev_hex = SEVERITY_HEX.get(sev, "636e72")
        risk_score = vuln.get("risk_score", 0)

        elements.append(Paragraph(
            f"<b>{i}. {vuln['type']}</b> &nbsp;&nbsp; "
            f"<font color='#{sev_hex}'><b>[{sev}]</b></font> &nbsp;"
            f"Risk: {risk_score}/100",
            heading2
        ))

        details = [
            f"<b>Description:</b> {vuln['description']}",
            f"<b>Recommendation:</b> {vuln['recommendation']}",
            f"<b>Breach Probability:</b> {vuln.get('breach_probability', 'N/A')}",
            f"<b>Estimated Financial Loss:</b> {vuln.get('financial_loss', 'N/A')}",
            f"<b>Estimated Fix Cost:</b> {vuln.get('fix_cost', 'N/A')}",
        ]
        for detail in details:
            elements.append(Paragraph(detail, body))
        elements.append(Spacer(1, 3*mm))

        if i < len(results):
            elements.append(HRFlowable(width="70%", thickness=0.5, color=HexColor("#dfe6e9"), spaceAfter=4))

    elements.append(PageBreak())

    # ════════════════════════════════════════════════════
    # BREACH SCENARIOS
    # ════════════════════════════════════════════════════
    elements.append(Paragraph("5. Breach Scenario Analysis", heading1))
    elements.append(HRFlowable(width="100%", thickness=1, color=ACCENT, spaceAfter=10))

    if breach_scenarios:
        for i, bs in enumerate(breach_scenarios, 1):
            sev = bs.get("severity", "Medium")
            s_color = SEVERITY_HEX.get(sev, "636e72")
            elements.append(Paragraph(
                f"<b>Scenario {i}: {bs.get('vulnerability', 'Unknown')}</b> "
                f"<font color='#{s_color}'><b>[{sev}]</b></font> — "
                f"Risk Score: {bs.get('risk_score', 0)}/100",
                heading2
            ))

            # Attack path
            attack_path = bs.get("attack_path", [])
            path_str = " → ".join(attack_path) if attack_path else "Direct exploitation"
            elements.append(Paragraph(f"<b>Attack Path:</b> {path_str}", body))
            elements.append(Paragraph(f"<b>Business Impact:</b> {bs.get('business_impact', 'N/A')}", body))
            elements.append(Paragraph(f"<b>Estimated Financial Impact:</b> {bs.get('estimated_financial_impact', 'N/A')}", body))

            risk_lvl = bs.get("risk_level", "Moderate")
            rl_color = DANGER if risk_lvl == "Critical" else (WARNING if risk_lvl in ("High", "Moderate") else SUCCESS)
            elements.append(Paragraph(
                f"<b>Risk Level:</b> <font color='#{rl_color.hexval()}'>{risk_lvl}</font>", body
            ))
            elements.append(Spacer(1, 4*mm))
            if i < len(breach_scenarios):
                elements.append(HRFlowable(width="80%", thickness=0.5, color=HexColor("#dfe6e9"), spaceAfter=4))
    else:
        elements.append(Paragraph("No significant breach scenarios identified.", body))

    elements.append(PageBreak())

    # ════════════════════════════════════════════════════
    # FINANCIAL RISK ANALYSIS
    # ════════════════════════════════════════════════════
    elements.append(Paragraph("6. Financial Risk Analysis", heading1))
    elements.append(HRFlowable(width="100%", thickness=1, color=ACCENT, spaceAfter=10))

    # Aggregate financial data
    total_loss = 0
    total_fix = 0
    max_loss = 0
    max_loss_vuln = ""
    for v in results:
        vl = _parse_rupees(v.get("financial_loss", "₹0"))
        fc = _parse_rupees(v.get("fix_cost", "₹0"))
        total_loss += vl
        total_fix += fc
        if vl > max_loss:
            max_loss = vl
            max_loss_vuln = v.get("type", "Unknown")

    def fmt(v):
        if v >= 10000000:
            return f"₹{v/10000000:.2f} Crore"
        elif v >= 100000:
            return f"₹{v/100000:.1f} Lakh"
        else:
            return f"₹{v:,.0f}"

    fin_data = [
        ["Category", "Amount"],
        ["Total Estimated Financial Exposure", fmt(total_loss)],
        ["Total Remediation Cost", fmt(total_fix)],
        ["Potential Savings (Loss - Fix)", fmt(total_loss - total_fix)],
        ["Highest Impact Vulnerability", f"{max_loss_vuln} ({fmt(max_loss)})"],
    ]
    ft = Table(fin_data, colWidths=[100*mm, 80*mm])
    ft.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 10),
        ("BACKGROUND", (0, 1), (-1, -1), BG_LIGHT),
        ("TEXTCOLOR", (0, 1), (-1, -1), black),
        ("FONTSIZE", (0, 1), (-1, -1), 9),
        ("ALIGN", (1, 0), (-1, -1), "CENTER"),
        ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#dfe6e9")),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    elements.append(ft)
    elements.append(Spacer(1, 8*mm))

    # ROI of remediation
    roi = ((total_loss - total_fix) / max(total_fix, 1)) * 100
    elements.append(Paragraph(
        f"<b>Return on Security Investment (ROSI):</b> For every ₹1 spent on remediation, "
        f"approximately <b>₹{roi:.1f}</b> in potential loss is mitigated. "
        f"Investing in security now can prevent significant financial impact.", body
    ))

    elements.append(PageBreak())

    # ════════════════════════════════════════════════════
    # RECOMMENDATIONS
    # ════════════════════════════════════════════════════
    elements.append(Paragraph("7. Security Recommendations", heading1))
    elements.append(HRFlowable(width="100%", thickness=1, color=ACCENT, spaceAfter=10))

    recommendations = [
        ("Immediate Actions (Critical/High Priority)", [
            "Apply security patches and updates for all identified critical vulnerabilities",
            "Implement parameterized queries to prevent SQL injection attacks",
            "Deploy Web Application Firewall (WAF) for immediate protection",
            "Enable multi-factor authentication for all administrative accounts",
            "Fix broken access control mechanisms (IDOR, privilege escalation)",
        ]),
        ("Short-term Actions (Medium Priority)", [
            "Configure comprehensive security headers (CSP, HSTS, X-Frame-Options)",
            "Implement proper input validation and output encoding",
            "Disable directory listing and sensitive information exposure",
            "Set up automated vulnerability scanning in CI/CD pipeline",
            "Implement rate limiting and DDoS protection",
        ]),
        ("Long-term Actions (Low Priority)", [
            "Establish a bug bounty program for continuous security testing",
            "Conduct regular security awareness training for development team",
            "Implement Security Development Lifecycle (SDL) practices",
            "Schedule periodic third-party penetration testing",
            "Develop and test an incident response plan",
        ]),
    ]
    for category, items in recommendations:
        elements.append(Paragraph(f"<b>{category}</b>", heading2))
        for item in items:
            elements.append(Paragraph(f"•  {item}", body))
        elements.append(Spacer(1, 3*mm))

    elements.append(PageBreak())

    # ════════════════════════════════════════════════════
    # CONCLUSION
    # ════════════════════════════════════════════════════
    elements.append(Paragraph("8. Conclusion", heading1))
    elements.append(HRFlowable(width="100%", thickness=1, color=ACCENT, spaceAfter=10))

    if posture_score >= 70:
        conclusion = (
            f"Overall, the security posture of <b>{scan['url']}</b> is <b>{posture_rating}</b>. "
            f"While the identified vulnerabilities do not pose an immediate critical threat, "
            f"addressing them will further strengthen the security posture. "
            f"Estimated financial exposure is <b>{fmt(total_loss)}</b> — proactive remediation "
            f"at an estimated cost of <b>{fmt(total_fix)}</b> is recommended."
        )
    elif posture_score >= 40:
        conclusion = (
            f"The security posture of <b>{scan['url']}</b> is rated <b>{posture_rating}</b>, "
            f"indicating several areas requiring attention. With <b>{exec_summary['total_vulnerabilities']}</b> "
            f"vulnerabilities identified including <b>{exec_summary['critical_count']}</b> critical and "
            f"<b>{exec_summary['high_count']}</b> high-severity issues, prompt remediation is advised. "
            f"Potential financial exposure is estimated at <b>{fmt(total_loss)}</b>, "
            f"while remediation would cost approximately <b>{fmt(total_fix)}</b>."
        )
    else:
        conclusion = (
            f"The security posture of <b>{scan['url']}</b> is rated <b>{posture_rating}</b>, "
            f"indicating significant security weaknesses that require immediate attention. "
            f"The presence of <b>{exec_summary['critical_count']}</b> critical and "
            f"<b>{exec_summary['high_count']}</b> high-severity vulnerabilities exposes the organization "
            f"to substantial risk. Estimated financial exposure is <b>{fmt(total_loss)}</b>. "
            f"We strongly recommend immediate remediation starting with the highest-risk findings."
        )
    elements.append(Paragraph(conclusion, body))
    elements.append(Spacer(1, 10*mm))

    elements.append(HRFlowable(width="100%", thickness=1, color=ACCENT, spaceAfter=6))
    elements.append(Paragraph(
        "<i>This report is generated automatically by BreachLens Security Assessment Platform. "
        "The findings are based on automated scanning and should be verified by a qualified security professional. "
        "Risk scores and financial estimates are indicative and may vary based on actual exploitation scenarios.</i>",
        small_text
    ))

    # Build PDF
    doc.build(elements)
    return filepath
