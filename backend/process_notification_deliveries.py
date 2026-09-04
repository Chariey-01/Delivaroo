from app import create_app
from app.services.notification_service import process_pending_email_deliveries


def main():
    app = create_app()
    processed = process_pending_email_deliveries(app)
    print(f"Processed {processed} pending email deliveries.")


if __name__ == "__main__":
    main()
