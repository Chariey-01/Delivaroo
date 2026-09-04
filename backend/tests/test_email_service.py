from unittest.mock import MagicMock

from app.services.email_service import _send_email, send_password_reset_email


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


def test_smtp_delivery_uses_timeout_tls_and_delivaroo_sender(monkeypatch):
    monkeypatch.setenv("SMTP_HOST", "smtp.example.test")
    monkeypatch.setenv("SMTP_PORT", "2525")
    monkeypatch.setenv("SMTP_USE_TLS", "true")
    monkeypatch.setenv("SMTP_TIMEOUT_SECONDS", "4.5")
    monkeypatch.setenv("SMTP_USERNAME", "mailer")
    monkeypatch.setenv("SMTP_PASSWORD", "provider-credential")
    monkeypatch.setenv("SMTP_SENDER_NAME", "Delivaroo Operations")
    monkeypatch.setenv("SMTP_SENDER_EMAIL", "no-reply@example.test")
    smtp = MagicMock()
    server = smtp.return_value.__enter__.return_value
    server.send_message.return_value = {}
    monkeypatch.setattr("app.services.email_service.smtplib.SMTP", smtp)

    result = _send_email("customer@example.test", "Delivery update", "Your parcel is moving.")

    smtp.assert_called_once_with("smtp.example.test", 2525, timeout=4.5)
    server.starttls.assert_called_once_with()
    server.login.assert_called_once_with("mailer", "provider-credential")
    message = server.send_message.call_args.args[0]
    assert message["From"] == "Delivaroo Operations <no-reply@example.test>"
    assert message["To"] == "customer@example.test"
    assert result == {}
