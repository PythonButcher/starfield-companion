"""Environment configuration. Defaults are local and require no API key."""
import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR.parent / '.env')
load_dotenv(BASE_DIR / '.env')


class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL') or f'sqlite:///{(BASE_DIR / "starfield.db").as_posix()}'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    AI_MODE = os.getenv('AI_MODE', 'mock')
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')
    OPENAI_MODEL = os.getenv('OPENAI_MODEL') or 'gpt-4.1-mini'
    UPLOAD_FOLDER = str(BASE_DIR / 'uploads')
    MAX_CONTENT_LENGTH = 11 * 1024 * 1024
    MAX_FILE_SIZE = 10 * 1024 * 1024
    SEED_ON_STARTUP = True
    SEED_STARTER_STATE = True
