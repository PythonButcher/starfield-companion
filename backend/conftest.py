import pytest
from main import create_app
from models import db


@pytest.fixture
def app(tmp_path):
    application = create_app({
        'TESTING': True, 'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
        'UPLOAD_FOLDER': str(tmp_path / 'uploads'), 'AI_MODE': 'mock',
        'OPENAI_API_KEY': '', 'SEED_ON_STARTUP': True,
    })
    yield application
    with application.app_context():
        db.session.remove()
        db.engine.dispose()


@pytest.fixture
def client(app):
    return app.test_client()
