"""
Website Scanner Service - Simulated scanning with realistic findings.
For MVP, uses mock scanning logic. Ready for real integration later.
"""
import random
import re
from datetime import datetime
from typing import List, Dict, Any
from models.schemas import Vulnerability

# Common security headers to check
SECURITY_HEADERS = [
    "Strict-Transport-Security",
    "X-Content-Type-Options",
    "X-Frame-Options",
    "X-XSS-Protection",
    "Content-Security-Policy",
    "Referrer-Policy",
    "Permissions-Policy",
]

VULNERABILITY_TEMPLATES = [
    {
        "type": "SQL Injection",
        "severity": "Critical",
        "description": "SQL injection vulnerability detected in the login form parameter 'username'. The application directly concatenates user input into SQL queries without proper sanitization.",
        "recommendation": "Use parameterized queries or prepared statements. Implement input validation and use an ORM framework.",
        "risk_score_base": 95,
        "exploitability": 9.5,
        "data_sensitivity": 9.0,
    },
    {
        "type": "Cross-Site Scripting (XSS)",
        "severity": "High",
        "description": "Reflected XSS vulnerability found in the search functionality. User input is reflected without proper encoding in the response.",
        "recommendation": "Implement proper output encoding. Use Content-Security-Policy headers and sanitize all user inputs.",
        "risk_score_base": 82,
        "exploitability": 8.5,
        "data_sensitivity": 7.5,
    },
    {
        "type": "Insecure Direct Object Reference (IDOR)",
        "severity": "High",
        "description": "IDOR vulnerability in /api/users/{id} endpoint. User IDs are sequential and no access control checks are performed.",
        "recommendation": "Implement proper access control checks. Use UUIDs instead of sequential IDs. Validate user ownership.",
        "risk_score_base": 78,
        "exploitability": 8.0,
        "data_sensitivity": 8.5,
    },
    {
        "type": "Missing Security Headers",
        "severity": "Medium",
        "description": "Multiple security headers are missing. The application does not set HSTS, X-Frame-Options, or Content-Security-Policy.",
        "recommendation": "Add all security headers: Strict-Transport-Security, X-Frame-Options, X-Content-Type-Options, Content-Security-Policy.",
        "risk_score_base": 55,
        "exploitability": 5.0,
        "data_sensitivity": 5.0,
    },
    {
        "type": "Open Directory Listing",
        "severity": "Medium",
        "description": "Directory listing is enabled on /assets/ and /backup/ directories, exposing sensitive files and directory structure.",
        "recommendation": "Disable directory listing in web server configuration. Place sensitive files outside the web root.",
        "risk_score_base": 50,
        "exploitability": 6.0,
        "data_sensitivity": 6.0,
    },
    {
        "type": "Authentication Weakness",
        "severity": "Critical",
        "description": "No rate limiting on login endpoint. Weak password policy detected. No multi-factor authentication available.",
        "recommendation": "Implement rate limiting, enforce strong password policies, add MFA support, and implement account lockout.",
        "risk_score_base": 90,
        "exploitability": 9.0,
        "data_sensitivity": 8.5,
    },
    {
        "type": "Cross-Site Request Forgery (CSRF)",
        "severity": "Medium",
        "description": "Forms lack CSRF tokens. State-changing requests can be forged by attackers.",
        "recommendation": "Implement CSRF tokens for all state-changing requests. Use SameSite cookies.",
        "risk_score_base": 60,
        "exploitability": 7.0,
        "data_sensitivity": 5.5,
    },
    {
        "type": "Server Information Disclosure",
        "severity": "Low",
        "description": "Server headers reveal detailed version information: Apache/2.4.41 (Ubuntu) and PHP/7.4.3.",
        "recommendation": "Hide server version information in HTTP headers. Use a reverse proxy to strip sensitive headers.",
        "risk_score_base": 30,
        "exploitability": 3.0,
        "data_sensitivity": 3.0,
    },
    {
        "type": "Insecure Cookie Configuration",
        "severity": "Medium",
        "description": "Session cookies missing Secure and HttpOnly flags. Cookies transmitted over unencrypted connections.",
        "recommendation": "Set Secure, HttpOnly, and SameSite flags on all cookies. Use secure session management.",
        "risk_score_base": 58,
        "exploitability": 6.5,
        "data_sensitivity": 6.0,
    },
    {
        "type": "Broken Access Control",
        "severity": "High",
        "description": "Admin endpoints accessible without proper authorization. Regular users can access /admin/* endpoints.",
        "recommendation": "Implement role-based access control (RBAC). Validate user permissions on every request.",
        "risk_score_base": 85,
        "exploitability": 8.0,
        "data_sensitivity": 9.0,
    },
]


class ScannerService:
    """Simulated website scanner that returns realistic vulnerabilities."""

    def _detect_technologies(self, url: str) -> Dict[str, Any]:
        """Simulate technology detection."""
        tech_stack = random.sample(
            [
                "React.js",
                "Angular",
                "Vue.js",
                "jQuery",
                "Bootstrap",
                "Node.js",
                "Express",
                "Django",
                "Flask",
                "PHP",
                "ASP.NET",
                "Java Spring",
                "Apache",
                "Nginx",
                "MySQL",
                "PostgreSQL",
                "MongoDB",
            ],
            k=random.randint(3, 6),
        )
        return {"technologies": tech_stack, "server": random.choice(["Apache/2.4.41", "Nginx/1.18.0", "IIS/10.0"])}

    def _discover_endpoints(self, url: str) -> List[str]:
        """Simulate endpoint discovery."""
        endpoints = [
            "/api/users",
            "/api/login",
            "/api/data",
            "/admin",
            "/assets",
            "/backup",
            "/.env",
            "/wp-admin",
            "/api/v1/products",
            "/search",
            "/contact",
            "/api/config",
        ]
        return random.sample(endpoints, k=random.randint(4, 8))

    def _discover_forms(self, url: str) -> List[Dict]:
        """Simulate form discovery."""
        form_templates = [
            {"action": "/login", "method": "POST", "fields": ["username", "password"]},
            {"action": "/search", "method": "GET", "fields": ["q"]},
            {"action": "/contact", "method": "POST", "fields": ["name", "email", "message"]},
            {"action": "/register", "method": "POST", "fields": ["name", "email", "password"]},
            {"action": "/api/users", "method": "POST", "fields": ["name", "email"]},
        ]
        return random.sample(form_templates, k=random.randint(2, 4))

    def scan(self, url: str) -> Dict[str, Any]:
        """
        Perform a simulated scan of the given URL.
        Returns crawl info + list of vulnerabilities.
        """
        # Discover technologies
        tech_info = self._detect_technologies(url)
        endpoints = self._discover_endpoints(url)
        forms = self._discover_forms(url)

        # Determine number of vulnerabilities based on "findings"
        num_vulnerabilities = random.randint(4, 8)
        selected_vulns = random.sample(VULNERABILITY_TEMPLATES, k=num_vulnerabilities)

        vulnerabilities = []
        for vuln_template in selected_vulns:
            v = Vulnerability(
                type=vuln_template["type"],
                severity=vuln_template["severity"],
                description=vuln_template["description"],
                recommendation=vuln_template["recommendation"],
            )
            vulnerabilities.append(v)

        return {
            "crawl_info": {
                "url": url,
                "technologies": tech_info["technologies"],
                "server": tech_info["server"],
                "endpoints_discovered": endpoints,
                "forms_discovered": forms,
                "pages_scanned": random.randint(15, 50),
                "duration_seconds": random.randint(5, 30),
                "timestamp": datetime.utcnow().isoformat(),
            },
            "vulnerabilities": vulnerabilities,
        }


scanner = ScannerService()
