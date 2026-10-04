"""Database-backed, read-only reference records."""
from models import db, ReferenceRecord


def catalog(name):
    return [row.payload for row in db.session.scalars(
        db.select(ReferenceRecord).where(ReferenceRecord.catalog == name).order_by(ReferenceRecord.id))]
