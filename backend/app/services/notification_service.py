import threading

from app.services.email_service import _send_email


def _build_status_change_email(tracking_number, new_status):
    subject = f"Delivaroo: parcel {tracking_number} status update"
    body = (
        f"Your parcel {tracking_number} status has changed to: {new_status}.\n\n"
        f"You can track your parcel using this tracking number in the Delivaroo app."
    )
    return subject, body


def send_status_change_email(recipient_email, tracking_number, new_status):
    """
    Sends a status-change notification email. Synchronous - raises on
    failure (missing config, SMTP errors). Callers requiring
    non-blocking behavior should use notify_status_change_async instead.
    """
    subject, body = _build_status_change_email(tracking_number, new_status)
    _send_email(recipient_email, subject, body)


def _send_status_change_email_worker(app, recipient_email, tracking_number, new_status):
    with app.app_context():
        try:
            send_status_change_email(recipient_email, tracking_number, new_status)
        except Exception:
            app.logger.exception("Status change email delivery failed")


def notify_status_change_async(app, recipient_email, tracking_number, new_status):
    """
    Triggers a status-change email in a background thread. Never
    raises and never blocks the caller - failures are logged inside
    the worker thread and never surface to the API response.
    """
    thread = threading.Thread(
        target=_send_status_change_email_worker,
        args=(app, recipient_email, tracking_number, new_status),
        daemon=True,
    )
    thread.start()


def _build_location_change_email(tracking_number, latitude, longitude, address=None):
    location_desc = address if address else f"{latitude}, {longitude}"
    subject = f"Delivaroo: parcel {tracking_number} location update"
    body = (
        f"Your parcel {tracking_number} has a new tracked location: {location_desc}.\n\n"
        f"You can track your parcel using this tracking number in the Delivaroo app."
    )
    return subject, body


def send_location_change_email(recipient_email, tracking_number, latitude, longitude, address=None):
    """
    Sends a location-change notification email. Synchronous - raises on
    failure (missing config, SMTP errors). Callers requiring
    non-blocking behavior should use notify_location_change_async instead.
    """
    subject, body = _build_location_change_email(tracking_number, latitude, longitude, address)
    _send_email(recipient_email, subject, body)


def _send_location_change_email_worker(app, recipient_email, tracking_number, latitude, longitude, address):
    with app.app_context():
        try:
            send_location_change_email(recipient_email, tracking_number, latitude, longitude, address)
        except Exception:
            app.logger.exception("Location change email delivery failed")


def notify_location_change_async(app, recipient_email, tracking_number, latitude, longitude, address=None):
    """
    Triggers a location-change email in a background thread. Never
    raises and never blocks the caller - failures are logged inside
    the worker thread and never surface to the API response.
    """
    thread = threading.Thread(
        target=_send_location_change_email_worker,
        args=(app, recipient_email, tracking_number, latitude, longitude, address),
        daemon=True,
    )
    thread.start()
