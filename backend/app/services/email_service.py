import os
import smtplib
from email.message import EmailMessage
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit


def _send_email(recipient_email: str, subject: str, body: str) -> None:
    """
    Sends a plain-text email via SMTP using environment-configured
    credentials. Raises RuntimeError if the email service isn't
    configured, or an SMTP exception on delivery failure.
    """
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_username = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")
    sender_email = os.getenv("SMTP_SENDER_EMAIL")

    if not all([smtp_host, smtp_username, smtp_password, sender_email]):
        raise RuntimeError("Email service is not configured")

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = sender_email
    message["To"] = recipient_email
    message.set_content(body)

    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()
        server.login(smtp_username, smtp_password)
        server.send_message(message)


def password_reset_url(reset_token: str) -> str:
    """Build a frontend reset link from deployment configuration."""

    configured_url = os.getenv("PASSWORD_RESET_URL")
    if not configured_url:
        raise RuntimeError("Password reset URL is not configured")

    parts = urlsplit(configured_url)
    query = dict(parse_qsl(parts.query, keep_blank_values=True))
    query["token"] = reset_token
    return urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))


def send_password_reset_email(recipient_email: str, reset_token: str) -> None:
    """Send a password reset email."""
    subject = "Delivaroo password reset"
    reset_url = password_reset_url(reset_token)
    body = f"""
You requested a password reset for your Delivaroo account.

Set a new password using this link:

{reset_url}

This token expires in 30 minutes.

If you did not request a password reset, you can safely ignore this email.
"""
    _send_email(recipient_email, subject, body)
