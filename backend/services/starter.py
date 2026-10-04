"""One-time illustrative playthrough with conservative removal of unchanged samples."""
from datetime import datetime, timedelta, timezone

from models import (db, CrewMember, ExpeditionLog, MediaItem, OutpostPlan, PlanetProfile,
                    PlayerObjective, SeedMarker, Ship, StarterState, SurveyProgress, SupplyNetwork, ShipBlueprint, iso)
from services.catalogs import catalog

MODELS = {model.__name__: model for model in (
    CrewMember, ExpeditionLog, OutpostPlan, PlanetProfile, PlayerObjective, Ship, SurveyProgress)}


def is_fresh_profile():
    """Decide before reference seeding; an existing save is never opted in."""
    return not any(db.session.scalar(db.select(db.func.count()).select_from(model))
                   for model in (*MODELS.values(), MediaItem, SeedMarker, StarterState, SupplyNetwork, ShipBlueprint))


def snapshot(item):
    values = {c.name: getattr(item, c.name) for c in item.__table__.columns}
    return {key: iso(value) if isinstance(value, datetime) else value for key, value in values.items()}


def initialize_starter(fresh):
    if db.session.get(StarterState, 1):
        return
    state = StarterState(id=1, status='active' if fresh else 'existing_profile', manifest=[])
    db.session.add(state)
    if not fresh:
        db.session.commit()
        return
    manifest = []

    def remember(item, before=None):
        db.session.add(item)
        db.session.flush()
        identifier = item.planet_id if isinstance(item, SurveyProgress) else item.id
        manifest.append({'model': type(item).__name__, 'id': identifier, 'snapshot': snapshot(item), 'before': before})

    worlds = {p.name: p for p in db.session.scalars(db.select(PlanetProfile))}
    remember(Ship(name='The Frontier', home_ship=True, notes='Constellation starter vessel. Editable crew assignments are recorded below.'))
    for member in db.session.scalars(db.select(CrewMember).where(CrewMember.name.in_(['Barrett', 'VASCO']))):
        before = {'assigned_ship': member.assigned_ship, 'assigned_outpost': member.assigned_outpost}
        member.assigned_ship, member.assigned_outpost = 'The Frontier', ''
        remember(member, before)
    # Fixed sample event time maps to the requested cosmetic stardate 2330.134.
    now = datetime(2026, 5, 14, 12, tzinfo=timezone.utc)
    log = ExpeditionLog(title='Vectera Excavation: Artifact Discovery', planet_id=worlds['Vectera'].id,
                        planet_name='Vectera', system_name='Narion', location='Argos Extractors mining site',
                        raw_notes='Stardate 2330.134. Artifact recovered. Crimson Fleet raid repelled. Set course for the Lodge.',
                        ai_narrative='Stardate 2330.134 — Vectera. The cutter exposed a mineral anomaly unlike the surrounding rock. '
                        'Contact brought a flash of light and a sound I cannot place. Barrett believes Constellation can explain it. '
                        'Crimson Fleet raiders interrupted the excavation; the landing zone is secure again. '
                        'VASCO has prepared the Frontier for departure. Next stop: the Lodge on Jemison.',
                        tags=['Constellation', 'starter'], date=now, updated_at=now)
    remember(log)
    remember(PlayerObjective(title='One Small Step', faction='Constellation', category='Main', priority='High',
                             target_planet_id=worlds['Jemison'].id, target_system='Alpha Centauri',
                             notes='Illustrative starter checklist. Continue with your own playthrough.', linked_log_ids=[log.id],
                             checklist=[{'id': 'artifact', 'text': 'Extract artifact', 'done': True},
                                        {'id': 'raiders', 'text': 'Defeat Crimson Fleet raiders', 'done': True},
                                        {'id': 'lodge', 'text': 'Deliver artifact to the Lodge on Jemison', 'done': False}]))
    remember(PlayerObjective(title='Survey the Narion System', faction='Constellation', category='Survey', priority='High',
                             target_system='Narion', target_planet_id=worlds['Kreet'].id,
                             checklist=[{'id': 'vectera', 'text': 'Complete the Vectera survey', 'done': True},
                                        {'id': 'kreet', 'text': 'Catalogue Kreet deposits', 'done': False},
                                        {'id': 'niira', 'text': 'Survey Niira', 'done': False}]))
    modules = {m['name']: m['id'] for m in catalog('outpost_modules')}
    remember(OutpostPlan(name='Luna Extraction Post', planet_id=worlds['Luna'].id, planet_name='Luna',
                         modules=[{'module_id': modules['Extractor - Solid'], 'count': 1, 'resource': 'Iron'},
                                  {'module_id': modules['Solar Array'], 'count': 2},
                                  {'module_id': modules['Storage - Solid'], 'count': 1}],
                         environment={'solar_factor': 2 / 3, 'wind_factor': 1, 'fuel_available': False},
                         notes='Illustrative starter plan: each solar array is calibrated to 4 power (2/3 of the 6-power reference). '
                         '8 generated minus 5 required gives +3. Replace this assumed calibration with your readings.'))
    for name, percent, flora, fauna, traits, resources in (
        ('Vectera', 100, 0, 0, 0, len(worlds['Vectera'].resources)),
        ('Jemison', 65, 3, 2, 1, 3), ('Kreet', 25, 0, 0, 0, 2),
    ):
        world = worlds[name]
        before = {'surveyed_percent': world.surveyed_percent, 'favorite': world.favorite}
        world.surveyed_percent, world.favorite = percent, name == 'Vectera'
        remember(world, before)
        remember(SurveyProgress(planet_id=world.id, scanned_flora=flora, scanned_fauna=fauna,
                                discovered_traits=traits, scanned_resources=resources, updated_at=now - timedelta(seconds=1)))
    state.manifest = manifest
    db.session.commit()


def clear_starter():
    state = db.session.get(StarterState, 1)
    if not state or state.status != 'active':
        return {'removed': 0, 'preserved': 0, 'status': state.status if state else 'disabled'}
    removed = preserved = 0
    # Dependencies are inspected after missions, before logs, ships and worlds.
    order = {'PlayerObjective': 0, 'SurveyProgress': 1, 'ExpeditionLog': 2,
             'CrewMember': 3, 'Ship': 4, 'OutpostPlan': 5, 'PlanetProfile': 6}
    for entry in sorted(state.manifest, key=lambda row: order[row['model']]):
        item = db.session.get(MODELS[entry['model']], entry['id'])
        if item is None:
            continue
        keep = snapshot(item) != entry['snapshot']
        if isinstance(item, ExpeditionLog):
            keep |= bool(db.session.scalar(db.select(MediaItem.id).where(MediaItem.log_id == item.id).limit(1)))
            keep |= any(item.id in m.linked_log_ids for m in db.session.scalars(db.select(PlayerObjective)))
        if isinstance(item, (Ship, OutpostPlan)):
            field = CrewMember.assigned_ship if isinstance(item, Ship) else CrewMember.assigned_outpost
            keep |= bool(db.session.scalar(db.select(CrewMember.id).where(field == item.name).limit(1)))
        if isinstance(item, OutpostPlan):
            keep |= any(node.get('outpost_id') == item.id
                        for network in db.session.scalars(db.select(SupplyNetwork)) for node in network.nodes)
        if isinstance(item, PlanetProfile):
            keep |= db.session.get(SurveyProgress, item.id) is not None
        if keep:
            preserved += 1
            continue
        if entry['before'] is not None:
            for key, value in entry['before'].items():
                setattr(item, key, value)
        else:
            db.session.delete(item)
        db.session.flush()
        removed += 1
    state.status, state.manifest = 'cleared', []
    db.session.commit()
    return {'removed': removed, 'preserved': preserved, 'status': 'cleared'}
