"""
Mock Database Layer - In-memory storage with JSON file persistence.
Easily replaceable with MongoDB later.
"""
import json
import os
from datetime import datetime
from typing import List, Optional, Dict, Any
from models.schemas import Vulnerability, ScanResult, UserResponse

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
USERS_FILE = os.path.join(DATA_DIR, "users.json")
SCANS_FILE = os.path.join(DATA_DIR, "scans.json")


def _ensure_data_dir():
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR, exist_ok=True)


def _load_json(filepath: str) -> list:
    _ensure_data_dir()
    if not os.path.exists(filepath):
        return []
    try:
        with open(filepath, "r") as f:
            content = f.read()
            if not content.strip():
                return []
            return json.loads(content)
    except (json.JSONDecodeError, FileNotFoundError):
        return []


def _save_json(filepath: str, data: list):
    _ensure_data_dir()
    with open(filepath, "w") as f:
        json.dump(data, f, indent=2)


class MockDB:
    """In-memory database with JSON file persistence."""

    def __init__(self):
        _ensure_data_dir()
        self._users = _load_json(USERS_FILE)
        self._scans = _load_json(SCANS_FILE)

    def _persist(self):
        _save_json(USERS_FILE, self._users)
        _save_json(SCANS_FILE, self._scans)

    # --- User Operations ---
    def find_user_by_email(self, email: str) -> Optional[dict]:
        for user in self._users:
            if user["email"] == email:
                return user
        return None

    def find_user_by_id(self, user_id: str) -> Optional[dict]:
        for user in self._users:
            if user["id"] == user_id:
                return user
        return None

    def create_user(self, name: str, email: str, hashed_password: str) -> dict:
        import uuid
        user = {
            "id": str(uuid.uuid4()),
            "name": name,
            "email": email,
            "password": hashed_password,
            "created_at": datetime.utcnow().isoformat(),
        }
        self._users.append(user)
        self._persist()
        return user

    def get_all_users(self) -> list:
        return self._users

    # --- Scan Operations ---
    def create_scan(self, scan_data: dict) -> dict:
        import uuid
        scan = {
            "id": str(uuid.uuid4()),
            **scan_data,
            "timestamp": datetime.utcnow().isoformat(),
        }
        self._scans.append(scan)
        self._persist()
        return scan

    def get_scans_by_user(self, user_id: str) -> list:
        return [s for s in self._scans if s.get("user_id") == user_id]

    def get_scan_by_id(self, scan_id: str) -> Optional[dict]:
        for s in self._scans:
            if s["id"] == scan_id:
                return s
        return None

    def get_all_scans(self) -> list:
        return self._scans

    def update_scan(self, scan_id: str, updates: dict) -> Optional[dict]:
        for i, s in enumerate(self._scans):
            if s["id"] == scan_id:
                self._scans[i].update(updates)
                self._persist()
                return self._scans[i]
        return None


# Singleton instance
db = MockDB()
