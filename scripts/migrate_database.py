"""Stop local servers, then run with the repository virtual environment."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'backend'))
from storage_migration import copy_checkpoint

if __name__ == '__main__':
    root = Path(__file__).resolve().parents[1]
    backup = copy_checkpoint(root / 'backend/instance/companion.db', root / 'backend/starfield.db')
    print('Checkpoint copied to backend/starfield.db; source retained.')
    print('Legacy backup:', backup or 'No prior destination')
