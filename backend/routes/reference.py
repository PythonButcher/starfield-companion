from flask import Blueprint, jsonify
from models import db, ReferenceRecord
from validation import page, text_filter

bp = Blueprint('reference', __name__, url_prefix='/api')


@bp.get('/health')
def health():
    return jsonify(status='systems_nominal')


def catalog(name, fields):
    items = [item.payload for item in db.session.scalars(db.select(ReferenceRecord).where(ReferenceRecord.catalog == name).order_by(ReferenceRecord.id))]
    return page(text_filter(items, fields))


@bp.get('/systems')
def systems():
    return catalog('systems', ('name', 'faction'))


@bp.get('/systems/<int:identifier>')
def system_detail(identifier):
    from models import PlanetProfile, OutpostPlan, PlayerObjective
    from services.catalogs import catalog as records
    from routes.outposts import serialize
    from validation import ApiError
    system = next((s for s in records('systems') if s['id'] == identifier), None)
    if not system:
        raise ApiError('System not found.', 404, 'not_found')
    worlds = list(db.session.scalars(db.select(PlanetProfile).where(
        db.func.lower(PlanetProfile.system_name) == system['name'].lower()).order_by(PlanetProfile.name)))
    ids = {p.id for p in worlds}
    outposts = [serialize(p) for p in db.session.scalars(db.select(OutpostPlan)) if p.planet_id in ids]
    missions = []
    for mission in db.session.scalars(db.select(PlayerObjective).where(PlayerObjective.status == 'Active')):
        # An explicit system takes precedence, just as it does in map activity.
        if (mission.target_system.casefold() == system['name'].casefold() if mission.target_system
                else mission.target_planet_id in ids):
            missions.append(mission.to_dict())
    return jsonify(system=system, planets=[p.to_dict() for p in worlds], outposts=outposts, missions=missions)


@bp.get('/research')
def research():
    return catalog('research', ('research Project', 'required Materials'))
