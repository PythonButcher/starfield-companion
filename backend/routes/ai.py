from flask import Blueprint, jsonify
from models import db, ExpeditionLog
from services.ai import get_provider
from validation import ApiError, body, string, strings

bp = Blueprint('ai', __name__, url_prefix='/api')


@bp.post('/generate_narrative')
def generate_narrative():
    data = body({'raw_notes', 'title', 'planet_name', 'tone', 'length'})
    data['raw_notes'] = string(data.get('raw_notes'), 'raw_notes', 10000, True)
    for key in ('title', 'planet_name'):
        if key in data:
            data[key] = string(data[key], key)
    if data.get('tone', 'stoic') not in ('stoic', 'dramatic', 'noir', 'scientific'):
        raise ApiError('Unknown tone.')
    if data.get('length', 'medium') not in ('short', 'medium', 'long'):
        raise ApiError('Unknown length.')
    provider = get_provider()
    return jsonify(narrative=provider.narrative(data), model=provider.model, mode=provider.mode)


@bp.post('/strategize')
def strategize():
    data = body({'hazards', 'environment', 'loadout', 'skills', 'crew'})
    for key in ('hazards', 'loadout', 'skills', 'crew'):
        data[key] = strings(data.get(key, []), key)
    data['environment'] = string(data.get('environment', ''), 'environment', 1000)
    provider = get_provider()
    return jsonify(**provider.strategize(data), mode=provider.mode, model=provider.model)


@bp.get('/briefing')
def briefing():
    logs = list(db.session.scalars(db.select(ExpeditionLog).order_by(ExpeditionLog.date.desc(), ExpeditionLog.id.desc()).limit(5)))
    provider = get_provider()
    if not logs:
        return jsonify(briefing='Systems nominal. No expedition logs on file. Record your first observation, Captain.', mode=provider.mode, model=provider.model, log_count=0)
    notes = '\n'.join(f'{log.title} ({log.planet_name or "location unrecorded"}): {log.raw_notes[:700]}' for log in logs)
    return jsonify(briefing=provider.narrative({'raw_notes': notes, 'planet_name': logs[0].planet_name,
                                               'tone': 'stoic', 'length': 'short'}),
                   mode=provider.mode, model=provider.model, log_count=len(logs))
