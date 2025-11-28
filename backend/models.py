from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class ExpeditionLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    planet_name = db.Column(db.String(100), nullable=False)
    raw_notes = db.Column(db.Text, nullable=True)
    ai_narrative = db.Column(db.Text, nullable=True)
    date = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'planet_name': self.planet_name,
            'raw_notes': self.raw_notes,
            'ai_narrative': self.ai_narrative,
            'date': self.date.isoformat()
        }

class PlanetProfile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    resources = db.Column(db.String(200), nullable=True) # Storing as string for now, could be JSON
    hazards = db.Column(db.String(200), nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'resources': self.resources,
            'hazards': self.hazards
        }
