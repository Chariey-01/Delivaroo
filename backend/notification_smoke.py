import argparse
import os
import sys

from app.services.email_service import _send_email


def mask_email(value):
    local, separator, domain = value.partition("@")
    if not separator:
        return "***"
    return f"{local[:1]}***@{domain}"


def send_test_email(*, confirmed=False):
    if os.getenv("ALLOW_REAL_NOTIFICATION_TESTS", "false").lower() != "true":
        raise RuntimeError("Real notification tests are disabled")

    recipient = os.getenv("TEST_NOTIFICATION_EMAIL", "").strip()
    if not recipient:
        raise RuntimeError("TEST_NOTIFICATION_EMAIL is required")
    if not confirmed:
        raise RuntimeError("Pass --confirm to send one real test email")

    print(f"Email: {mask_email(recipient)}")
    refused = _send_email(
        recipient,
        "Delivaroo transactional email test",
        "This is a single explicitly authorized Delivaroo transactional email test.",
    )
    if refused:
        raise RuntimeError("SMTP provider refused the test recipient")

    print("Provider response: accepted")


def main(argv=None):
    parser = argparse.ArgumentParser(description="Send one authorized notification smoke test")
    parser.add_argument("--confirm", action="store_true", help="Confirm sending one real email")
    args = parser.parse_args(argv)

    try:
        send_test_email(confirmed=args.confirm)
    except RuntimeError as error:
        print(str(error), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
