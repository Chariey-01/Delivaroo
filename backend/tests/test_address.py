import uuid
import pytest

from app.models.address import Address
from app.services.address_service import (
    create_address,
    list_addresses,
    update_address,
    delete_address,
    set_default_address,
    get_address_for_user,
    AddressNotFoundError,
    NotAddressOwnerError,
    InvalidAddressError,
)


@pytest.fixture
def other_user(db_session):
    from app.models import User

    user = User(
        email=f"other_{uuid.uuid4().hex[:8]}@example.com",
        password_hash="hashed_password_placeholder",
        role="user",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    return user


def test_create_address(db_session, sample_user):
    address = create_address(
        user_id=sample_user.id,
        address_line="123 Main St",
        city="Nairobi",
        label="Home",
    )
    assert address.address_line == "123 Main St"
    assert address.city == "Nairobi"
    assert address.user_id == sample_user.id


def test_create_address_rejects_missing_address_line(db_session, sample_user):
    with pytest.raises(InvalidAddressError):
        create_address(user_id=sample_user.id, address_line="", city="Nairobi")


def test_create_address_rejects_missing_city(db_session, sample_user):
    with pytest.raises(InvalidAddressError):
        create_address(user_id=sample_user.id, address_line="123 Main St", city="")


def test_create_address_rejects_invalid_latitude(db_session, sample_user):
    with pytest.raises(InvalidAddressError):
        create_address(
            user_id=sample_user.id,
            address_line="123 Main St",
            city="Nairobi",
            latitude=999,
            longitude=36.8,
        )


def test_creating_default_address_unsets_previous_default(db_session, sample_user):
    first = create_address(
        user_id=sample_user.id, address_line="First St", city="Nairobi", is_default=True
    )
    second = create_address(
        user_id=sample_user.id, address_line="Second St", city="Nairobi", is_default=True
    )

    db_session.refresh(first)
    assert first.is_default is False
    assert second.is_default is True


def test_list_addresses_returns_only_own_addresses(db_session, sample_user, other_user):
    create_address(user_id=sample_user.id, address_line="Mine", city="Nairobi")
    create_address(user_id=other_user.id, address_line="Not Mine", city="Nairobi")

    results = list_addresses(sample_user.id)
    assert len(results) == 1
    assert results[0].address_line == "Mine"


def test_get_address_for_user_rejects_non_owner(db_session, sample_user, other_user):
    address = create_address(user_id=sample_user.id, address_line="Mine", city="Nairobi")

    with pytest.raises(NotAddressOwnerError):
        get_address_for_user(address.id, other_user.id)


def test_get_address_for_user_raises_not_found_for_missing_id(db_session, sample_user):
    with pytest.raises(AddressNotFoundError):
        get_address_for_user(uuid.uuid4(), sample_user.id)


def test_update_address(db_session, sample_user):
    address = create_address(user_id=sample_user.id, address_line="Old St", city="Nairobi")

    updated = update_address(address.id, sample_user.id, address_line="New St")
    assert updated.address_line == "New St"


def test_non_owner_cannot_update_address(db_session, sample_user, other_user):
    address = create_address(user_id=sample_user.id, address_line="Mine", city="Nairobi")

    with pytest.raises(NotAddressOwnerError):
        update_address(address.id, other_user.id, address_line="Hijacked")


def test_update_rejects_empty_address_line(db_session, sample_user):
    address = create_address(user_id=sample_user.id, address_line="Valid St", city="Nairobi")

    with pytest.raises(InvalidAddressError):
        update_address(address.id, sample_user.id, address_line="")


def test_delete_address(db_session, sample_user):
    address = create_address(user_id=sample_user.id, address_line="Temp St", city="Nairobi")

    delete_address(address.id, sample_user.id)

    assert db_session.get(Address, address.id) is None


def test_non_owner_cannot_delete_address(db_session, sample_user, other_user):
    address = create_address(user_id=sample_user.id, address_line="Mine", city="Nairobi")

    with pytest.raises(NotAddressOwnerError):
        delete_address(address.id, other_user.id)

    assert db_session.get(Address, address.id) is not None


def test_set_default_address(db_session, sample_user):
    first = create_address(user_id=sample_user.id, address_line="First St", city="Nairobi")
    second = create_address(user_id=sample_user.id, address_line="Second St", city="Nairobi")

    set_default_address(second.id, sample_user.id)

    db_session.refresh(first)
    db_session.refresh(second)
    assert first.is_default is False
    assert second.is_default is True


def test_non_owner_cannot_set_default(db_session, sample_user, other_user):
    address = create_address(user_id=sample_user.id, address_line="Mine", city="Nairobi")

    with pytest.raises(NotAddressOwnerError):
        set_default_address(address.id, other_user.id)
