"""Persistent user records and separately seeded reference catalogs."""
from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


def utcnow():
    return datetime.now(timezone.utc)


def iso(value):
    # SQLite returns naive datetimes; every timestamp stored here is UTC.
    return value.replace(tzinfo=timezone.utc).isoformat() if value else None


planet_resources = db.Table(
    'planet_resources',
    db.Column('planet_id', db.Integer, db.ForeignKey('planet_profile.id', ondelete='CASCADE'), primary_key=True),
    db.Column('resource_id', db.Integer, db.ForeignKey('resource.id'), primary_key=True),
)


class Resource(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    symbol = db.Column(db.String(30), default='')
    type = db.Column(db.String(20), default='inorganic')
    rarity = db.Column(db.String(30), default='unknown')

    def to_dict(self):
        return {key: getattr(self, key) for key in ('id', 'name', 'symbol', 'type', 'rarity')}


class PlanetProfile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    system_name = db.Column(db.String(100), default='')
    type = db.Column(db.String(50), default='Unknown')
    gravity = db.Column(db.Float, nullable=True)
    temperature = db.Column(db.String(100), default='Unknown')
    atmosphere = db.Column(db.String(100), default='Unknown')
    magnetosphere = db.Column(db.String(100), default='Unknown')
    water = db.Column(db.String(100), default='Unknown')
    biomes = db.Column(db.JSON, default=list)
    planetary_traits = db.Column(db.JSON, default=list)
    resources = db.relationship(Resource, secondary=planet_resources, lazy='selectin')
    flora = db.Column(db.Integer, nullable=True)
    fauna = db.Column(db.Integer, nullable=True)
    hazards = db.Column(db.JSON, default=list)
    user_notes = db.Column(db.Text, default='')
    surveyed_percent = db.Column(db.Integer, default=0)
    favorite = db.Column(db.Boolean, default=False)
    outpost_candidate = db.Column(db.Boolean, default=False)
    approximate = db.Column(db.Boolean, default=False)
    sources = db.Column(db.JSON, default=list)

    def to_dict(self):
        data = {column.name: getattr(self, column.name) for column in self.__table__.columns}
        data['_sources'] = data.pop('sources')
        data['resources'] = [resource.to_dict() for resource in self.resources]
        reference = db.session.get(PlanetReference, f'{self.system_name}:{self.name}'.casefold())
        data['_reference'] = reference.payload['_reference'] if reference else None
        return data


class ExpeditionLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    planet_name = db.Column(db.String(100), default='')
    system_name = db.Column(db.String(100), default='')
    location = db.Column(db.String(200), default='')
    mood = db.Column(db.String(100), default='')
    log_type = db.Column(db.String(30), default='Exploration')
    raw_notes = db.Column(db.Text, default='')
    ai_narrative = db.Column(db.Text, default='')
    tags = db.Column(db.JSON, default=list)
    date = db.Column(db.DateTime(timezone=True), default=utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    planet_id = db.Column(db.Integer, db.ForeignKey('planet_profile.id', ondelete='SET NULL'), nullable=True)

    def to_dict(self):
        data = {column.name: getattr(self, column.name) for column in self.__table__.columns}
        data.update(date=iso(self.date), updated_at=iso(self.updated_at))
        data['stardate'] = f'{self.date.year + 304}.{self.date.timetuple().tm_yday:03d}'
        return data


class CrewMember(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(100), default='Crew')
    faction = db.Column(db.String(100), default='Independent')
    is_companion = db.Column(db.Boolean, default=False)
    skills = db.Column(db.JSON, default=list)
    traits = db.Column(db.JSON, default=list)
    assigned_ship = db.Column(db.String(100), default='')
    assigned_outpost = db.Column(db.String(100), default='')
    affinity = db.Column(db.String(100), default='Unknown')
    notes = db.Column(db.Text, default='')
    portrait_url = db.Column(db.String(500), default='')
    sources = db.Column(db.JSON, default=list)

    def to_dict(self):
        data = {column.name: getattr(self, column.name) for column in self.__table__.columns}
        data['_sources'] = data.pop('sources')
        return data


class MediaItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(200), unique=True, nullable=False)
    original_name = db.Column(db.String(200), nullable=False)
    mime_type = db.Column(db.String(100), nullable=False)
    size = db.Column(db.Integer, nullable=False)
    caption = db.Column(db.Text, default='')
    tags = db.Column(db.JSON, default=list)
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow)
    log_id = db.Column(db.Integer, db.ForeignKey('expedition_log.id', ondelete='SET NULL'), nullable=True)
    planet_id = db.Column(db.Integer, db.ForeignKey('planet_profile.id', ondelete='SET NULL'), nullable=True)

    def to_dict(self):
        data = {column.name: getattr(self, column.name) for column in self.__table__.columns}
        data['created_at'] = iso(self.created_at)
        data['url'] = f'/media/{self.filename}'
        return data


class ReferenceRecord(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    catalog = db.Column(db.String(30), nullable=False, index=True)
    payload = db.Column(db.JSON, nullable=False)


class SeedMarker(db.Model):
    name = db.Column(db.String(100), primary_key=True)


class PlanetReference(db.Model):
    """Refreshable source facts; player profiles remain editable and independent."""
    key = db.Column(db.String(220), primary_key=True)
    payload = db.Column(db.JSON, nullable=False)


class Ship(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    home_ship = db.Column(db.Boolean, default=False)
    notes = db.Column(db.Text, default='')

    def to_dict(self):
        return {column.name: getattr(self, column.name) for column in self.__table__.columns}


class StarterState(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    status = db.Column(db.String(30), nullable=False)
    manifest = db.Column(db.JSON, default=list)

class OutpostPlan(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    planet_id = db.Column(db.Integer, db.ForeignKey('planet_profile.id', ondelete='SET NULL'))
    planet_name = db.Column(db.String(100), default='')
    modules = db.Column(db.JSON, default=list)
    environment = db.Column(db.JSON, default=dict)
    stored_mass = db.Column(db.Float, default=0)
    notes = db.Column(db.Text, default='')
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), default=utcnow, onupdate=utcnow)


class PlayerObjective(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    faction = db.Column(db.String(50), default='Independent')
    category = db.Column(db.String(30), default='Personal')
    status = db.Column(db.String(20), default='Active')
    priority = db.Column(db.String(20), default='Medium')
    target_planet_id = db.Column(db.Integer, db.ForeignKey('planet_profile.id', ondelete='SET NULL'))
    target_system = db.Column(db.String(100), default='')
    notes = db.Column(db.Text, default='')
    checklist = db.Column(db.JSON, default=list)
    linked_log_ids = db.Column(db.JSON, default=list)
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow)
    completed_at = db.Column(db.DateTime(timezone=True))

    def to_dict(self):
        data = {c.name: getattr(self, c.name) for c in self.__table__.columns}
        data.update(created_at=iso(self.created_at), completed_at=iso(self.completed_at))
        planet = db.session.get(PlanetProfile, self.target_planet_id) if self.target_planet_id else None
        data['target_planet_name'] = planet.name if planet else ''
        return data


class SurveyProgress(db.Model):
    planet_id = db.Column(db.Integer, db.ForeignKey('planet_profile.id', ondelete='CASCADE'), primary_key=True)
    scanned_flora = db.Column(db.Integer, nullable=True)
    scanned_fauna = db.Column(db.Integer, nullable=True)
    discovered_traits = db.Column(db.Integer, nullable=True)
    scanned_resources = db.Column(db.Integer, nullable=True)
    updated_at = db.Column(db.DateTime(timezone=True), default=utcnow, onupdate=utcnow)


class SupplyNetwork(db.Model):
    """JSON graph references survive deleted outposts so broken links stay visible."""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    notes = db.Column(db.Text, default='')
    nodes = db.Column(db.JSON, default=list)
    links = db.Column(db.JSON, default=list)
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), default=utcnow, onupdate=utcnow)


class ShipBlueprint(db.Model):
    """Module snapshots preserve a player's design across reference refreshes."""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    notes = db.Column(db.Text, default='')
    modules = db.Column(db.JSON, default=list)
    crew_limit = db.Column(db.Integer, default=3)
    jump_bonus = db.Column(db.Float, default=0)
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), default=utcnow, onupdate=utcnow)
