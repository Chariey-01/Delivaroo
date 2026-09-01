from app.services.email_service import send_password_reset_email


def test_password_reset_email_uses_configured_frontend_url(monkeypatch):
    delivered = {}
    monkeypatch.setenv("PASSWORD_RESET_URL", "https://app.example.test/reset-password?source=email")
    monkeypatch.setenv("SMTP_HOST", "smtp.example.test")
    monkeypatch.setenv("SMTP_USERNAME", "mailer")
    monkeypatch.setenv("SMTP_PASSWORD", "secret")
    monkeypatch.setenv("SMTP_SENDER_EMAIL", "no-reply@example.test")
    monkeypatch.setattr(
        "app.services.email_service._send_email",
        lambda recipient, subject, body: delivered.update(
            recipient=recipient,
            subject=subject,
            body=body,
        ),
    )

    send_password_reset_email("customer@example.test", "opaque token")

    assert delivered["recipient"] == "customer@example.test"
    assert "https://app.example.test/reset-password?source=email&token=opaque+token" in delivered["body"]
