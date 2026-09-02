from app.extensions import db


class PlatformSetting(db.Model):
    __tablename__ = "platform_settings"

    key = db.Column(db.String(80), primary_key=True)
    value = db.Column(db.JSON, nullable=False)
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=db.func.now(),
        onupdate=db.func.now(),
    )
