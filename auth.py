"""
Authentication Router — Register, Login, Profile
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.hash import bcrypt
from models import RegisterRequest, LoginRequest, AuthResponse, UserProfile
from database import MockDB
from utils.jwt_handler import create_access_token, decode_access_token

router = APIRouter()
security = HTTPBearer()


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Dependency to extract and validate current user from JWT."""
    payload = decode_access_token(credentials.credentials)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = MockDB.get_user_by_id(payload.get("sub"))
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user


@router.post("/register", response_model=AuthResponse)
def register(req: RegisterRequest):
    """Register a new user."""
    # Check if email already exists
    existing = MockDB.get_user_by_email(req.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash password
    hashed = bcrypt.hash(req.password)

    # Create user
    user = MockDB.create_user(req.name, req.email, hashed)

    # Generate token
    token = create_access_token({"sub": user["id"], "email": user["email"]})

    return AuthResponse(
        token=token,
        user={"id": user["id"], "name": user["name"], "email": user["email"]},
    )


@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest):
    """Login with email and password."""
    user = MockDB.get_user_by_email(req.email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not bcrypt.verify(req.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": user["id"], "email": user["email"]})

    return AuthResponse(
        token=token,
        user={"id": user["id"], "name": user["name"], "email": user["email"]},
    )


@router.get("/profile", response_model=UserProfile)
def get_profile(current_user: dict = Depends(get_current_user)):
    """Get current user profile."""
    return UserProfile(
        id=current_user["id"],
        name=current_user["name"],
        email=current_user["email"],
        created_at=current_user["created_at"],
    )
