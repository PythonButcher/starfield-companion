"""Isolated browser-test server: never touches the user's database or uploads."""
import sys
import tempfile
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from main import create_app

if __name__ == '__main__':
    with tempfile.TemporaryDirectory(prefix='starfield-smoke-') as folder:
        app = create_app({'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:', 'UPLOAD_FOLDER': folder, 'AI_MODE': 'mock', 'OPENAI_API_KEY': ''})
        app.run(host='127.0.0.1', port=5001, debug=False, use_reloader=False)
