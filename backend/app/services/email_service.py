import os
import smtplib
from email.message import EmailMessage


def send_password_reset_email(
    recipient_email: str,
    reset_token: str,
) -> None:
    """Send a password reset email."""

    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_username = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")
    sender_email = os.getenv("SMTP_SENDER_EMAIL")

    if not all(
        [
            smtp_host,
            smtp_username,
            smtp_password,
            sender_email,
        ]
    ):
        raise RuntimeError("Email service is not configured")

    message = EmailMessage()
    message["Subject"] = "Delivaroo password reset"
    message["From"] = sender_email
    message["To"] = recipient_email

    message.set_content(
        f"""
You requested a password reset for your Delivaroo account.

Your password reset token is:

{reset_token}

This token expires in 30 minutes.

If you did not request a password reset, you can safely ignore this email.
"""
    )

    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()
        server.login(smtp_username, smtp_password)
        server.send_message(message)
