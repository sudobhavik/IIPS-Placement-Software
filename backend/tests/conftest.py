import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.db import Base, get_db
from app.main import app
from app.models.master import Batch, Course
from app.models.user import User


@pytest.fixture(scope="session")
def db_engine():
    engine = create_engine(settings.database_url, pool_pre_ping=True)
    # Drop and recreate all tables to ensure clean schema
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    yield engine
    Base.metadata.drop_all(engine)


@pytest.fixture
def db(db_engine):
    connection = db_engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def master_data(db: Session):
    """Create master data (Course, Batch) for tests."""
    course_mca = Course(
        code="MCA",
        name="Master of Computer Applications",
        level="PG",
        duration_years=2,
        is_active=True,
    )
    course_mtech = Course(
        code="MTECH_IT", name="M.Tech IT", level="PG", duration_years=2, is_active=True
    )
    db.add_all([course_mca, course_mtech])
    db.flush()

    batch = Batch(label="2024-26", passing_year=2026, is_active=True)
    db.add(batch)
    db.commit()

    return {"mca_id": course_mca.id, "mtech_id": course_mtech.id, "batch_id": batch.id}


@pytest.fixture
def admin_user(db: Session, master_data):
    user = User(
        email="admin@test.com",
        full_name="Admin User",
        phone="9876543210",
        password_hash="hashed",
        role="admin",
        is_active=True,
        must_change_password=False,
    )
    db.add(user)
    db.commit()
    return user


@pytest.fixture
def client(db):
    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    from fastapi.testclient import TestClient

    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
