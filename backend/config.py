import os
from urllib.parse import urlparse


def _as_bool(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "nexa-spa-secret-key-2026")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "nexa-jwt-secret-2026")
    MONGO_URI = (os.environ.get("MONGO_URI") or "").strip()
    MONGO_DB_NAME = (os.environ.get("MONGO_DB_NAME") or "").strip()
    DEBUG = _as_bool(os.environ.get("DEBUG"), default=True)

    # Default admin (used when no users are registered yet)
    ADMIN_EMAIL = "admin@nexa.com"
    ADMIN_PASSWORD = "admin123"

    @classmethod
    def has_valid_mongo_uri(cls) -> bool:
        uri = cls.MONGO_URI
        return bool(uri) and "<db_password>" not in uri and "replace-with" not in uri

    @classmethod
    def resolved_db_name(cls) -> str:
        if cls.MONGO_DB_NAME:
            return cls.MONGO_DB_NAME
        if not cls.MONGO_URI:
            return ""
        parsed = urlparse(cls.MONGO_URI)
        path = (parsed.path or "").lstrip("/")
        return path.split("/")[0] if path else ""
