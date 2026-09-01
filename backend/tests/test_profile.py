import pytest

from app.services.profile_service import get_profile, upsert_profile, InvalidProfileError


def test_get_profile_returns_none_when_not_created(db_session, sample_user):
    profile = get_profile(sample_user.id)
    assert profile is None


def test_upsert_creates_profile_when_none_exists(db_session, sample_user):
    profile = upsert_profile(
        user_id=sample_user.id,
        full_name="Jane Doe",
        phone="+254712345678",
    )
    assert profile.full_name == "Jane Doe"
    assert profile.phone == "+254712345678"
    assert profile.user_id == sample_user.id


def test_get_profile_returns_created_profile(db_session, sample_user):
    upsert_profile(user_id=sample_user.id, full_name="Jane Doe")

    profile = get_profile(sample_user.id)
    assert profile is not None
    assert profile.full_name == "Jane Doe"


def test_upsert_updates_existing_profile(db_session, sample_user):
    upsert_profile(user_id=sample_user.id, full_name="Jane Doe")
    updated = upsert_profile(user_id=sample_user.id, full_name="Jane Smith")

    assert updated.full_name == "Jane Smith"

    profile = get_profile(sample_user.id)
    assert profile.full_name == "Jane Smith"


def test_upsert_only_changes_provided_fields(db_session, sample_user):
    upsert_profile(user_id=sample_user.id, full_name="Jane Doe", phone="+254712345678")
    updated = upsert_profile(user_id=sample_user.id, full_name="Jane Smith")

    assert updated.full_name == "Jane Smith"
    assert updated.phone == "+254712345678"


def test_upsert_accepts_string_user_id(db_session, sample_user):
    profile = upsert_profile(user_id=str(sample_user.id), full_name="Jane Doe")
    assert profile.full_name == "Jane Doe"


def test_upsert_rejects_invalid_phone(db_session, sample_user):
    with pytest.raises(InvalidProfileError):
        upsert_profile(user_id=sample_user.id, phone="not-a-phone-number!!")


def test_upsert_only_creates_one_profile_per_user(db_session, sample_user):
    upsert_profile(user_id=sample_user.id, full_name="First Call")
    upsert_profile(user_id=sample_user.id, full_name="Second Call")

    from app.models.profile import Profile
    profiles = Profile.query.filter_by(user_id=sample_user.id).all()
    assert len(profiles) == 1
