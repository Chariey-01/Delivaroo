import os

from dotenv import load_dotenv


load_dotenv()


class Config:
    """Base application configuration."""

    SECRET_KEY = os.getenv("SECRET_KEY")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")

    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    CORS_ORIGINS = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173",
        ).split(",")
        if origin.strip()
    ]
    CORS_SUPPORTS_CREDENTIALS = (
        os.getenv("CORS_SUPPORTS_CREDENTIALS", "false").lower() == "true"
    )
    CORS_ALLOW_HEADERS = ["Authorization", "Content-Type"]
    CORS_METHODS = ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"]
    GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
    GOOGLE_MAPS_TIMEOUT_SECONDS = float(os.getenv("GOOGLE_MAPS_TIMEOUT_SECONDS", "5"))
    GOOGLE_MAPS_DEFAULT_REGION = os.getenv("GOOGLE_MAPS_DEFAULT_REGION", "KE")

    @classmethod
    def validate(cls):
        """Validate required environment variables."""

        required = {
            "SECRET_KEY": cls.SECRET_KEY,
            "JWT_SECRET_KEY": cls.JWT_SECRET_KEY,
            "SQLALCHEMY_DATABASE_URI": cls.SQLALCHEMY_DATABASE_URI,
        }

        missing = [
            name for name, value in required.items()
            if not value
        ]

        if missing:
            raise RuntimeError(
                f"Missing required environment variables: {', '.join(missing)}"
            )
