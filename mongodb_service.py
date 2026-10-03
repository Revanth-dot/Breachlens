"""
MongoDB Atlas Connection Service
Provides a reusable connection to MongoDB Atlas for the BreachLens platform.
"""

import os
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

# Read environment variables
MONGODB_URL = os.environ.get("MONGODB_URL", "")
DATABASE_NAME = os.environ.get("DATABASE_NAME", "breachlens")

# Global state
_client = None
_db = None


def connect_mongodb():
    """
    Establish connection to MongoDB Atlas.
    Returns the database object on success, None on failure.
    """
    global _client, _db

    if not MONGODB_URL:
        print("ERROR: MONGODB_URL environment variable is not set")
        return None

    try:
        _client = MongoClient(MONGODB_URL, serverSelectionTimeoutMS=5000)
        # Force a connection attempt to verify the URI is valid
        _client.admin.command("ping")
        _db = _client[DATABASE_NAME]
        print(f"Connected to MongoDB Atlas — database: {DATABASE_NAME}")
        return _db
    except (ConnectionFailure, ServerSelectionTimeoutError) as e:
        print(f"ERROR: Could not connect to MongoDB Atlas: {e}")
        _client = None
        _db = None
        return None


def get_db():
    """Return the active MongoDB database instance."""
    global _db
    return _db


def close_mongodb():
    """Close the MongoDB connection."""
    global _client, _db
    if _client:
        _client.close()
    _client = None
    _db = None


def is_connected() -> bool:
    """Check if MongoDB is connected and responsive."""
    global _client
    if _client is None:
        return False
    try:
        _client.admin.command("ping")
        return True
    except (ConnectionFailure, ServerSelectionTimeoutError):
        return False


def get_collection_names():
    """Return list of collection names in the database."""
    global _db
    if _db is None:
        return []
    return _db.list_collection_names()
