"""Create deterministic demo data for local admin-dashboard demonstrations."""

import argparse
import json
import os
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import or_, select

from app import create_app
from app.extensions import db
from app.models import Address, AuditLog, DeliveryAgent, Parcel, StatusHistory, User, WeightCategory
from app.services.parcel_service import calculate_parcel_price
from app.services.status_history_service import VALID_STATUSES
from app.utils.security import hash_password
from app.utils.geo import haversine_distance_km


DEMO_DOMAIN = "demo.delivaroo.test"
DEMO_ADMIN_EMAIL = f"admin@{DEMO_DOMAIN}"
DEMO_ADMIN_EMAIL_ENV = "DEMO_ADMIN_EMAIL"
DEMO_ADMIN_PASSWORD_ENV = "DEMO_ADMIN_PASSWORD"
DEMO_USER_PASSWORD_ENV = "DEMO_USER_PASSWORD"
DEMO_TRACKING_PREFIX = "DEMO-"
DEMO_REFERENCE_AT = datetime(2026, 8, 30, 12, 0, tzinfo=timezone.utc)

DEMO_USERS = (
    ("amani.kimani", "Amani Kimani"),
    ("baraka.otieno", "Baraka Otieno"),
    ("chiku.wanjiru", "Chiku Wanjiru"),
    ("david.kiptoo", "David Kiptoo"),
    ("esther.naliaka", "Esther Naliaka"),
    ("farah.abdi", "Farah Abdi"),
    ("grace.wambui", "Grace Wambui"),
    ("hassan.ali", "Hassan Ali"),
    ("imani.mutua", "Imani Mutua"),
    ("juma.owino", "Juma Owino"),
    ("kendi.mwende", "Kendi Mwende"),
    ("leila.noor", "Leila Noor"),
)

WEIGHT_CATEGORIES = (
    ("Light", Decimal("0.00"), Decimal("2.00"), Decimal("180.00"), Decimal("18.00")),
    ("Medium", Decimal("2.01"), Decimal("10.00"), Decimal("320.00"), Decimal("28.00")),
    ("Heavy", Decimal("10.01"), Decimal("25.00"), Decimal("540.00"), Decimal("42.00")),
    ("Freight", Decimal("25.01"), Decimal("100.00"), Decimal("900.00"), Decimal("65.00")),
)

DEMO_AGENTS = (
    ("Noah Kamau", "noah.kamau@demo.delivaroo.test", "+254700000101", "MOTORBIKE"),
    ("Wanjiku Muli", "wanjiku.muli@demo.delivaroo.test", "+254700000102", "MOTORBIKE"),
    ("Tobias Kiprono", "tobias.kiprono@demo.delivaroo.test", "+254700000201", "TRUCK"),
    ("Aisha Noor", "aisha.noor@demo.delivaroo.test", "+254700000202", "TRUCK"),
    ("Musa Bakari", "musa.bakari@demo.delivaroo.test", "+254700000301", "SHIP"),
    ("Zawadi Said", "zawadi.said@demo.delivaroo.test", "+254700000302", "SHIP"),
    ("Nia Wekesa", "nia.wekesa@demo.delivaroo.test", "+254700000401", "AIR"),
    ("Eli Mwangi", "eli.mwangi@demo.delivaroo.test", "+254700000402", "AIR"),
)

LOCATIONS = (
    ("Nairobi", "Kenyatta Avenue, Nairobi", Decimal("-1.2863890"), Decimal("36.8172230")),
    ("Nakuru", "Kenyatta Avenue, Nakuru", Decimal("-0.3030990"), Decimal("36.0800250")),
    ("Mombasa", "Moi Avenue, Mombasa", Decimal("-4.0434770"), Decimal("39.6682060")),
    ("Kisumu", "Oginga Odinga Street, Kisumu", Decimal("-0.1022060"), Decimal("34.7617120")),
    ("Eldoret", "Uganda Road, Eldoret", Decimal("0.5142770"), Decimal("35.2697800")),
    ("Naivasha", "Kenyatta Avenue, Naivasha", Decimal("-0.7172080"), Decimal("36.4310000")),
    ("Thika", "Kenyatta Highway, Thika", Decimal("-1.0395950"), Decimal("37.0900080")),
    ("Machakos", "Mwatu wa Ngoma Road, Machakos", Decimal("-1.5176830"), Decimal("37.2634140")),
    ("Zanzibar", "Stone Town, Zanzibar", Decimal("-6.1659170"), Decimal("39.2026410")),
)

STATUS_DISTRIBUTION = (
    ("PENDING", 18),
    ("ASSIGNED", 10),
    ("PICKED_UP", 15),
    ("IN_TRANSIT", 17),
    ("OUT_FOR_DELIVERY", 12),
    ("DELIVERED", 14),
    ("CANCELLED", 8),
)

STATUS_FLOWS = {
    "PENDING": ("PENDING",),
    "ASSIGNED": ("PENDING", "ASSIGNED"),
    "PICKED_UP": ("PENDING", "PICKED_UP"),
    "IN_TRANSIT": ("PENDING", "PICKED_UP", "IN_TRANSIT"),
    "OUT_FOR_DELIVERY": ("PENDING", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"),
    "DELIVERED": ("PENDING", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"),
    "CANCELLED": ("PENDING", "CANCELLED"),
}


def _demo_timestamp(index, hours=0, *, aware=False):
    value = DEMO_REFERENCE_AT - timedelta(days=1 + (index % 28), hours=hours)
    return value if aware else value.replace(tzinfo=None)


def demo_admin_email():
    """Return the configurable fictional administrator email."""
    return os.getenv(DEMO_ADMIN_EMAIL_ENV, DEMO_ADMIN_EMAIL).strip().lower()


def _status_sequence():
    return tuple(status for status, count in STATUS_DISTRIBUTION for _ in range(count))


def _upsert_user(email, role, password_hash, created_at):
    user = User.query.filter_by(email=email).one_or_none()
    if user is None:
        user = User(
            email=email,
            password_hash=password_hash,
            role=role,
            is_active=True,
            created_at=created_at,
            updated_at=created_at,
        )
        db.session.add(user)
    else:
        user.password_hash = password_hash
        user.role = role
        user.is_active = True
    return user


def _upsert_weight_category(spec):
    name, min_weight, max_weight, base_price, price_per_km = spec
    category = WeightCategory.query.filter_by(name=name).one_or_none()
    if category is None:
        category = WeightCategory(
            name=name,
            min_weight=min_weight,
            max_weight=max_weight,
            base_price=base_price,
            price_per_km=price_per_km,
        )
        db.session.add(category)
    else:
        category.min_weight = min_weight
        category.max_weight = max_weight
        category.base_price = base_price
        category.price_per_km = price_per_km
    return category


def _upsert_delivery_agent(spec):
    name, email, phone, transport_mode = spec
    agent = DeliveryAgent.query.filter_by(email=email).one_or_none()
    if agent is None:
        agent = DeliveryAgent(email=email)
        db.session.add(agent)
    agent.name = name
    agent.phone = phone
    agent.transport_mode = transport_mode
    agent.is_active = True
    return agent


def _upsert_address(user, label, location, is_default):
    city, address_line, latitude, longitude = location
    address = Address.query.filter_by(user_id=user.id, label=label).one_or_none()
    if address is None:
        address = Address(user_id=user.id, label=label)
        db.session.add(address)
    address.address_line = address_line
    address.city = city
    address.latitude = latitude
    address.longitude = longitude
    address.is_default = is_default


def _interpolate(start, end, numerator, denominator):
    return (start + ((end - start) * Decimal(numerator) / Decimal(denominator))).quantize(
        Decimal("0.0000001")
    )


def _upsert_history(parcel, status, actor_id, latitude, longitude, notes, created_at):
    entry = StatusHistory.query.filter_by(parcel_id=parcel.id, notes=notes).one_or_none()
    if entry is None:
        entry = StatusHistory(parcel_id=parcel.id, notes=notes)
        db.session.add(entry)
    entry.status = status
    entry.changed_by = actor_id
    entry.latitude = latitude
    entry.longitude = longitude
    entry.created_at = created_at


def _upsert_audit(parcel, actor_id, action, old_value, new_value, created_at):
    entry = AuditLog.query.filter_by(
        entity_type="parcel",
        entity_id=parcel.id,
        action=action,
        new_value=new_value,
    ).one_or_none()
    if entry is None:
        entry = AuditLog(
            user_id=actor_id,
            action=action,
            entity_type="parcel",
            entity_id=parcel.id,
            old_value=old_value,
            new_value=new_value,
            ip_address="127.0.0.1",
            created_at=created_at,
        )
        db.session.add(entry)
    else:
        entry.user_id = actor_id
        entry.old_value = old_value
        entry.ip_address = "127.0.0.1"
        entry.created_at = created_at


def _seed_parcel(index, status, users, categories, agents_by_mode, admin):
    owner = users[index % len(users)]
    category = categories[index % len(categories)]
    transport_mode = ("MOTORBIKE", "TRUCK", "SHIP", "AIR")[index % 4]
    if transport_mode == "SHIP":
        pickup, destination = LOCATIONS[2], LOCATIONS[8]
    elif transport_mode == "AIR":
        pickup, destination = LOCATIONS[0], LOCATIONS[2]
    else:
        pickup = LOCATIONS[index % 8]
        destination = LOCATIONS[(index + 3) % 8]
    agent = agents_by_mode[transport_mode][index % len(agents_by_mode[transport_mode])]
    created_at = _demo_timestamp(index)
    distance = Decimal(str(haversine_distance_km(pickup[2], pickup[3], destination[2], destination[3]))).quantize(Decimal("0.01"))
    duration = int(distance * Decimal("3.2")) + 12
    tracking_number = f"{DEMO_TRACKING_PREFIX}{index + 1:04d}"

    parcel = Parcel.query.filter_by(tracking_number=tracking_number).one_or_none()
    if parcel is None:
        parcel = Parcel(tracking_number=tracking_number)
        db.session.add(parcel)

    parcel.user_id = owner.id
    parcel.weight_category_id = category.id
    parcel.delivery_agent_id = agent.id
    parcel.transport_mode = transport_mode
    parcel.pickup_address = pickup[1]
    parcel.pickup_latitude = pickup[2]
    parcel.pickup_longitude = pickup[3]
    parcel.destination_address = destination[1]
    parcel.destination_latitude = destination[2]
    parcel.destination_longitude = destination[3]
    parcel.distance = distance
    parcel.duration = duration
    parcel.price = calculate_parcel_price(category, distance).quantize(Decimal("0.01"))
    parcel.status = status
    parcel.created_at = created_at
    parcel.updated_at = created_at + timedelta(hours=len(STATUS_FLOWS[status]) * 3)

    if status in {"PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"}:
        progress = {"PICKED_UP": 1, "IN_TRANSIT": 2, "OUT_FOR_DELIVERY": 3}[status]
        parcel.present_latitude = _interpolate(pickup[2], destination[2], progress, 4)
        parcel.present_longitude = _interpolate(pickup[3], destination[3], progress, 4)
    else:
        parcel.present_latitude = None
        parcel.present_longitude = None

    db.session.flush()

    flow = STATUS_FLOWS[status]
    for step, flow_status in enumerate(flow):
        is_created = step == 0
        if flow_status == "DELIVERED":
            latitude, longitude = destination[2], destination[3]
        elif is_created:
            latitude, longitude = pickup[2], pickup[3]
        else:
            latitude, longitude = parcel.present_latitude, parcel.present_longitude

        notes = "Seed demo: Parcel created" if is_created else f"Seed demo: Status changed to {flow_status}"
        actor_id = owner.id if is_created else admin.id
        event_at = created_at.replace(tzinfo=timezone.utc) + timedelta(hours=step * 3)
        _upsert_history(parcel, flow_status, actor_id, latitude, longitude, notes, event_at)
        _upsert_audit(
            parcel,
            actor_id,
            "parcel.created" if is_created else "parcel.status_changed",
            None if is_created else json.dumps({"status": flow[step - 1]}),
            json.dumps({"status": flow_status}),
            event_at.replace(tzinfo=None),
        )

    if parcel.present_latitude is not None:
        location_at = created_at.replace(tzinfo=timezone.utc) + timedelta(hours=len(flow) * 3)
        _upsert_history(
            parcel,
            status,
            admin.id,
            parcel.present_latitude,
            parcel.present_longitude,
            "Seed demo: Present location updated",
            location_at,
        )
        _upsert_audit(
            parcel,
            admin.id,
            "parcel.location_updated",
            None,
            json.dumps(
                {
                    "latitude": str(parcel.present_latitude),
                    "longitude": str(parcel.present_longitude),
                }
            ),
            location_at.replace(tzinfo=None),
        )


def reset_demo_data():
    """Remove only records owned by this seed dataset."""
    if os.getenv("FLASK_ENV", "development").lower() == "production":
        raise RuntimeError("Refusing to reset demo data while FLASK_ENV is production")

    parcel_ids = list(
        db.session.scalars(
            select(Parcel.id).where(Parcel.tracking_number.like(f"{DEMO_TRACKING_PREFIX}%"))
        )
    )
    demo_emails = [demo_admin_email(), *(f"{slug}@{DEMO_DOMAIN}" for slug, _ in DEMO_USERS)]
    agent_ids = list(db.session.scalars(select(DeliveryAgent.id).where(DeliveryAgent.email.like(f"%@{DEMO_DOMAIN}"))))
    user_ids = list(db.session.scalars(select(User.id).where(User.email.in_(demo_emails))))

    if parcel_ids or user_ids:
        db.session.query(AuditLog).filter(
            or_(AuditLog.entity_id.in_(parcel_ids), AuditLog.user_id.in_(user_ids))
        ).delete(synchronize_session=False)
    if parcel_ids:
        db.session.query(StatusHistory).filter(StatusHistory.parcel_id.in_(parcel_ids)).delete(
            synchronize_session=False
        )
        db.session.query(Parcel).filter(Parcel.id.in_(parcel_ids)).delete(synchronize_session=False)
    if user_ids:
        db.session.query(Address).filter(Address.user_id.in_(user_ids)).delete(synchronize_session=False)
        db.session.query(User).filter(User.id.in_(user_ids)).delete(synchronize_session=False)
    if agent_ids:
        db.session.query(DeliveryAgent).filter(DeliveryAgent.id.in_(agent_ids)).delete(synchronize_session=False)


def demo_counts():
    """Return the supported demo model counts for reporting and tests."""
    return {
        "users": User.query.filter(User.email.like(f"%@{DEMO_DOMAIN}")).count(),
        "delivery_agents": DeliveryAgent.query.filter(DeliveryAgent.email.like(f"%@{DEMO_DOMAIN}")).count(),
        "weight_categories": WeightCategory.query.filter(
            WeightCategory.name.in_([spec[0] for spec in WEIGHT_CATEGORIES])
        ).count(),
        "parcels": Parcel.query.filter(Parcel.tracking_number.like(f"{DEMO_TRACKING_PREFIX}%")).count(),
        "addresses": Address.query.join(User).filter(User.email.like(f"%@{DEMO_DOMAIN}")).count(),
        "status_history": StatusHistory.query.join(Parcel).filter(
            Parcel.tracking_number.like(f"{DEMO_TRACKING_PREFIX}%")
        ).count(),
        "audit_logs": AuditLog.query.filter(
            AuditLog.entity_type == "parcel",
            AuditLog.entity_id.in_(select(Parcel.id).where(Parcel.tracking_number.like(f"{DEMO_TRACKING_PREFIX}%"))),
        ).count(),
    }


def seed_demo_data(*, reset=False):
    """Upsert the complete local demo dataset without sending email."""
    if reset:
        reset_demo_data()

    try:
        admin_password_hash = hash_password(
            os.getenv(DEMO_ADMIN_PASSWORD_ENV, "DemoAdminPass123!")
        )
        user_password_hash = hash_password(
            os.getenv(DEMO_USER_PASSWORD_ENV, "DemoUserPass123!")
        )
        admin = _upsert_user(demo_admin_email(), "admin", admin_password_hash, _demo_timestamp(0))
        users = [
            _upsert_user(
                f"{slug}@{DEMO_DOMAIN}",
                "user",
                user_password_hash,
                _demo_timestamp(index + 1),
            )
            for index, (slug, _) in enumerate(DEMO_USERS)
        ]
        categories = [_upsert_weight_category(spec) for spec in WEIGHT_CATEGORIES]
        agents = [_upsert_delivery_agent(spec) for spec in DEMO_AGENTS]
        db.session.flush()
        agents_by_mode = {
            mode: [agent for agent in agents if agent.transport_mode == mode]
            for mode in {"MOTORBIKE", "TRUCK", "SHIP", "AIR"}
        }

        for index, user in enumerate(users):
            _upsert_address(user, "Home", LOCATIONS[index % len(LOCATIONS)], True)
            _upsert_address(user, "Office", LOCATIONS[(index + 2) % len(LOCATIONS)], False)

        for index, status in enumerate(_status_sequence()):
            _seed_parcel(index, status, users, categories, agents_by_mode, admin)

        db.session.commit()
    except Exception:
        db.session.rollback()
        raise

    return demo_counts()


def main():
    parser = argparse.ArgumentParser(description="Seed deterministic DELIVAROO demo data")
    parser.add_argument(
        "--reset-demo-data",
        action="store_true",
        help="replace only records generated by this demo seed; refused in production",
    )
    args = parser.parse_args()

    app = create_app()
    with app.app_context():
        counts = seed_demo_data(reset=args.reset_demo_data)

    print("Demo data seeded:", ", ".join(f"{name}={count}" for name, count in counts.items()))
    print(f"Demo admin email: {demo_admin_email()}")
    print(f"Set {DEMO_ADMIN_PASSWORD_ENV} to choose the demo admin password.")


if __name__ == "__main__":
    main()
