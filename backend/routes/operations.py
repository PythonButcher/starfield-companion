from flask import Blueprint, jsonify, request
from models import db, PlanetProfile, SurveyProgress, utcnow
from services.operations import coverage, survey_gaps, survey_entry, handover
from validation import ApiError, body, number, record

bp = Blueprint('operations', __name__, url_prefix='/api')


@bp.get('/portfolio/coverage')
def portfolio():
    return jsonify(coverage())


@bp.get('/surveys/gaps')
def gaps():
    data = survey_gaps()
    system = request.args.get('system', '').casefold()
    tier = request.args.get('tier', '')
    if tier not in ('', 'nearly'):
        raise ApiError('tier must be nearly or empty.')
    data['planets'] = [row for row in data['planets']
                       if (not system or row['planet']['system_name'].casefold() == system)
                       and (tier != 'nearly' or row['planet']['surveyed_percent'] > 75)]
    return jsonify(data)


@bp.patch('/surveys/<int:identifier>/counters')
def counters(identifier):
    planet = record(PlanetProfile, identifier)
    data = body({'scanned_flora', 'scanned_fauna', 'discovered_traits', 'scanned_resources', 'surveyed_percent'})
    entry = survey_entry(planet)
    totals = {v['field']: v['total'] for v in entry['counters'].values()}
    progress = db.session.get(SurveyProgress, identifier)
    if not progress:
        progress = SurveyProgress(planet_id=identifier)
        db.session.add(progress)
    for key, value in data.items():
        if key == 'surveyed_percent':
            planet.surveyed_percent = number(value, key, 0, 100, True)
        else:
            maximum = totals[key] if totals[key] is not None else 10000
            setattr(progress, key, None if value is None else number(value, key, 0, maximum, True))
    progress.updated_at = utcnow()
    db.session.commit()
    return jsonify(survey_entry(planet))


@bp.get('/surveys/<int:identifier>')
def survey_detail(identifier):
    return jsonify(survey_entry(record(PlanetProfile, identifier)))


@bp.get('/radar/session_handover')
def radar():
    return jsonify(handover())


@bp.get('/hub/map_activity')
def map_activity():
    from models import OutpostPlan, PlayerObjective
    outposts = set()
    for plan in db.session.scalars(db.select(OutpostPlan)):
        if plan.planet_id:
            world = db.session.get(PlanetProfile, plan.planet_id)
            if world:
                outposts.add(world.system_name)
    missions = set()
    for objective in db.session.scalars(db.select(PlayerObjective).where(PlayerObjective.status == 'Active')):
        world = db.session.get(PlanetProfile, objective.target_planet_id) if objective.target_planet_id else None
        system = objective.target_system or (world.system_name if world else '')
        if system:
            missions.add(system)
    return jsonify(outposts=sorted(outposts), missions=sorted(missions))
