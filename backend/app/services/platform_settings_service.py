from app.extensions import db
from app.models import PlatformSetting


DEFAULT_SETTINGS = {
    "acceptingOrders": True,
    "noticeToStaff": "",
    "supportEmail": "support@deliveroo.co",
    "supportPhone": "+254 700 000 000",
}

SETTINGS_KEY = "platform"


def get_settings():
    row = db.session.get(PlatformSetting, SETTINGS_KEY)
    return {**DEFAULT_SETTINGS, **(row.value if row else {})}


def update_settings(patch):
    allowed = set(DEFAULT_SETTINGS)
    next_settings = get_settings()

    for key, value in patch.items():
        if key in allowed:
            next_settings[key] = value

    row = db.session.get(PlatformSetting, SETTINGS_KEY)
    if row is None:
        row = PlatformSetting(key=SETTINGS_KEY, value=next_settings)
        db.session.add(row)
    else:
        row.value = next_settings

    db.session.commit()
    return next_settings
