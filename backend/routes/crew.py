from urllib.parse import urlsplit
from flask import Blueprint, jsonify, request
from models import db, CrewMember
from validation import ApiError, body, boolean, number, page, record, string, strings, text_filter

bp = Blueprint('crew', __name__, url_prefix='/api/crew')
FIELDS = {'name', 'role', 'faction', 'is_companion', 'skills', 'traits', 'assigned_ship', 'assigned_outpost', 'affinity', 'notes', 'portrait_url'}
WEIGHTS = {
    'ship': {'Piloting': 3, 'Starship Engineering': 3, 'Aneutronic Fusion': 4, 'Shield Systems': 3, 'Astrodynamics': 2, 'Payloads': 2, 'Particle Beam Weapon Systems': 2, 'Energy Weapon Systems': 2, 'Ballistic Weapon Systems': 2, 'Missile Weapon Systems': 2, 'EM Weapon Systems': 2, 'Leadership': 1},
    'outpost': {'Outpost Engineering': 4, 'Outpost Management': 4, 'Geology': 2, 'Botany': 2, 'Robotics': 1},
    'combat': {'Lasers': 3, 'Rifle Certification': 3, 'Shotgun Certification': 3, 'Particle Beams': 3, 'Ballistics': 3, 'Stealth': 2, 'Demolitions': 2, 'Pain Tolerance': 2},
}


def validate_crew(data, creating=False, existing=None):
    if creating and 'name' not in data:
        raise ApiError('name is required.')
    result = {}
    for key, value in data.items():
        if key == 'is_companion':
            result[key] = boolean(value, key)
        elif key == 'traits':
            result[key] = strings(value, key)
        elif key == 'skills':
            if not isinstance(value, list) or len(value) > 30:
                raise ApiError('skills must contain at most 30 skill objects.')
            skills, seen = [], set()
            for skill in value:
                if not isinstance(skill, dict) or set(skill) != {'name', 'rank'}:
                    raise ApiError('Each skill needs exactly name and rank.')
                name = string(skill['name'], 'skill name', 100, True)
                rank = number(skill['rank'], 'skill rank', 1, 4, True)
                if name.casefold() in seen:
                    raise ApiError('Duplicate skill names are not allowed.')
                seen.add(name.casefold())
                skills.append({'name': name, 'rank': rank})
            result[key] = skills
        else:
            result[key] = string(value, key, 30000 if key == 'notes' else 500 if key == 'portrait_url' else 100, key == 'name')
    if result.get('portrait_url'):
        url = urlsplit(result['portrait_url'])
        if url.scheme not in ('http', 'https') or not url.netloc:
            raise ApiError('portrait_url must be an HTTP(S) URL or empty.')
    ship = result.get('assigned_ship', existing.assigned_ship if existing else '')
    outpost = result.get('assigned_outpost', existing.assigned_outpost if existing else '')
    if ship and outpost:
        raise ApiError('A crew member can be assigned to one ship or one outpost, not both.')
    return result


@bp.get('')
def list_crew():
    items = text_filter([item.to_dict() for item in db.session.scalars(db.select(CrewMember).order_by(CrewMember.name, CrewMember.id))], ('name', 'role', 'faction', 'notes'))
    assignment = request.args.get('assignment', '')
    if assignment not in ('', 'ship', 'outpost', 'unassigned'):
        raise ApiError('assignment must be ship, outpost, or unassigned.')
    if assignment == 'unassigned':
        items = [item for item in items if not item['assigned_ship'] and not item['assigned_outpost']]
    elif assignment:
        items = [item for item in items if item['assigned_' + assignment]]
    skill = request.args.get('skill', '').casefold()
    if skill:
        items = [item for item in items if any(skill in value['name'].casefold() for value in item['skills'])]
    return page(items)


@bp.post('')
def create_crew():
    item = CrewMember(**validate_crew(body(FIELDS), True))
    db.session.add(item)
    db.session.commit()
    return jsonify(item.to_dict()), 201


@bp.get('/<int:identifier>')
def get_crew(identifier):
    return jsonify(record(CrewMember, identifier).to_dict())


@bp.route('/<int:identifier>', methods=['PATCH', 'PUT'])
def update_crew(identifier):
    item = record(CrewMember, identifier)
    for key, value in validate_crew(body(FIELDS), existing=item).items():
        setattr(item, key, value)
    db.session.commit()
    return jsonify(item.to_dict())


@bp.delete('/<int:identifier>')
def delete_crew(identifier):
    db.session.delete(record(CrewMember, identifier))
    db.session.commit()
    return jsonify(deleted=identifier)


@bp.get('/optimize')
def optimize():
    goal = request.args.get('goal', 'ship')
    if goal not in WEIGHTS:
        raise ApiError('goal must be ship, outpost, or combat.')
    try:
        slots = int(request.args.get('slots', 3))
    except ValueError as exc:
        raise ApiError('slots must be an integer.') from exc
    number(slots, 'slots', 1, 20, True)
    weights = {name.casefold(): weight for name, weight in WEIGHTS[goal].items()}
    scored = []
    for member in db.session.scalars(db.select(CrewMember)):
        reasons = [{'skill': skill['name'], 'rank': skill['rank'], 'weight': weights[skill['name'].casefold()], 'points': skill['rank'] * weights[skill['name'].casefold()]}
                   for skill in member.skills if skill['name'].casefold() in weights]
        score = sum(reason['points'] for reason in reasons)
        if score:
            scored.append({'member': member.to_dict(), 'score': score, 'reasons': reasons})
    scored.sort(key=lambda row: (-row['score'], row['member']['name'].casefold(), row['member']['id']))
    selected = scored[:slots]
    return jsonify(goal=goal, slots=slots, selected=selected, total_score=sum(row['score'] for row in selected),
                   method='Highest total additive rank × goal weight. Ties: name, then ID. All roster members are eligible; assignments are unchanged.',
                   limitations='Planning heuristic: ignores in-game stacking, skill-specific effects, recruitment state and Leadership slot exceptions. Slots are your chosen planning budget.',
                   weights=WEIGHTS[goal])
