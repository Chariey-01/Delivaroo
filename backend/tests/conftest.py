import os
import uuid
import pytest
from dotenv import load_dotenv

load_dotenv()

from app import create_app
from app.config import Config
from app.extensions import db as _db
from app.models import User, WeightCategory, Parcel


class TestConfig(Config):
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "TEST_DATABASE_URL",
        "postgresql://deliveroo_user:deliveroo_pass@localhost:5432/deliveroo_test",
    )
    TESTING = True


@pytest.fixture(scope="session")
def app():
    application = create_app(config_class=TestConfig)
    return application


@pytest.fixture(scope="function")
def db_session(app):
    with app.app_context():
        _db.create_all()
        yield _db.session
        _db.session.rollback()
        _db.session.remove()
        _db.drop_all()


@pytest.fixture
def sample_user(db_session):
    user = User(
        email=f"user_{uuid.uuid4().hex[:8]}@example.com",
        password_hash="hashed_password_placeholder",
        role="user",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    return user


@pytest.fixture
def sample_admin(db_session):
    admin = User(
        email=f"admin_{uuid.uuid4().hex[:8]}@example.com",
        password_hash="hashed_password_placeholder",
        role="admin",
        is_active=True,
    )
    db_session.add(admin)
    db_session.commit()
    return admin


@pytest.fixture
def sample_weight_category(db_session):
    category = WeightCategory(
        name=f"category_{uuid.uuid4().hex[:8]}",
        min_weight=0,
        max_weight=5,
        base_price=100,
        price_per_km=10,
    )
    db_session.add(category)
    db_session.commit()
    return category


@pytest.fixture
def sample_parcel(db_session, sample_user, sample_weight_category):
    parcel = Parcel(
        tracking_number=f"TRK{uuid.uuid4().hex[:10].upper()}",
        user_id=sample_user.id,
        weight_category_id=sample_weight_category.id,
        pickup_address="123 Pickup St",
        destination_address="456 Destination Ave",
        status="PENDING",
        price=500,
    )
    db_session.add(parcel)
    db_session.commit()
    return parcel