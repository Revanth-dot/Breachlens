from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

# --- Auth Schemas ---
class UserRegister(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# --- Scan Schemas ---
class ScanRequest(BaseModel):
    url: str

class Vulnerability(BaseModel):
    type: str
    severity: str
    description: str
    recommendation: str
    risk_score: Optional[float] = None
    breach_probability: Optional[str] = None
    financial_loss: Optional[str] = None
    fix_cost: Optional[str] = None

class ScanResult(BaseModel):
    id: str
    user_id: str
    url: str
    status: str  # completed, scanning, failed
    timestamp: str
    vulnerabilities: List[Vulnerability]
    overall_risk_score: Optional[float] = None
    overall_breach_probability: Optional[str] = None
    total_financial_loss: Optional[str] = None
    total_fix_cost: Optional[str] = None
    executive_summary: Optional[str] = None
    security_score: Optional[float] = None
    business_impact_score: Optional[float] = None

class DashboardStats(BaseModel):
    total_scans: int
    vulnerabilities_found: int
    risk_score: float
    estimated_financial_loss: str
    scans: List[ScanResult]
    vulnerability_distribution: Dict[str, int]
    severity_breakdown: Dict[str, int]
    risk_trend: List[Dict[str, Any]]

class ScanSummary(BaseModel):
    id: str
    url: str
    status: str
    timestamp: str
    vulnerability_count: int
    overall_risk_score: float

class ExecutiveSummary(BaseModel):
    security_score: float
    business_impact_score: float
    financial_risk: str
    remediation_budget: str
    executive_summary: str
    top_vulnerabilities: List[Vulnerability]
