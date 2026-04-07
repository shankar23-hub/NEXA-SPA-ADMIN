from datetime import datetime
from pymongo import MongoClient, ASCENDING, ReturnDocument
import os

_client = None
_db = None


def get_db():
    """Return MongoDB database safely (Vercel compatible)"""
    global _client, _db

    if _db is None:
        mongo_uri = os.getenv("MONGO_URI")
        db_name = os.getenv("MONGO_DB_NAME", "nexa_db")

        if not mongo_uri:
            raise ValueError("❌ MONGO_URI not set in environment variables")

        _client = MongoClient(mongo_uri)
        _db = _client[db_name]   # ✅ FIXED (NO get_default_database)

    return _db