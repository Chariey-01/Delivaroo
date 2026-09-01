from unittest.mock import MagicMock

from notification_smoke import main, mask_email


def test_smoke_command_refuses_to_send_without_explicit_enable(monkeypatch):
    monkeypatch.delenv("ALLOW_REAL_NOTIFICATION_TESTS", raising=False)
    send_email = MagicMock()
    monkeypatch.setattr("notification_smoke._send_email", send_email)

    assert main(["--confirm"]) == 1
    send_email.assert_not_called()


def test_smoke_command_masks_recipient_and_requires_confirmation(monkeypatch, capsys):
    recipient = "customer@example.test"
    monkeypatch.setenv("ALLOW_REAL_NOTIFICATION_TESTS", "true")
    monkeypatch.setenv("TEST_NOTIFICATION_EMAIL", recipient)
    delivered = []
    monkeypatch.setattr(
        "notification_smoke._send_email",
        lambda *args: delivered.append(args) or {},
    )

    assert main([]) == 1
    assert delivered == []
    capsys.readouterr()

    assert main(["--confirm"]) == 0
    output = capsys.readouterr().out
    assert mask_email(recipient) in output
    assert recipient not in output
    assert "Provider response: accepted" in output
    assert len(delivered) == 1
