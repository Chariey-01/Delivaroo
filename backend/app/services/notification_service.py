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
