"""Cross-module summaries derived from persistent player records."""
from collections import defaultdict
from models import db, PlanetProfile, PlanetReference, SurveyProgress, OutpostPlan, PlayerObjective, ExpeditionLog, CrewMember, MediaItem, Ship, iso
from services.catalogs import catalog
from services.outposts import evaluate


def coverage():
    resources = [r for r in catalog('resources') if r['type'] == 'inorganic']
    master = {r['name'].casefold(): r['name'] for r in resources}
    covered, occupied, inactive = set(), set(), 0
    for plan in db.session.scalars(db.select(OutpostPlan)):
        analysis = evaluate(plan.modules, plan.planet_id, plan.environment, plan.stored_mass)
        if plan.planet_id:
            occupied.add(plan.planet_id)
        if analysis['net_power'] < 0:
            inactive += 1
            continue
        covered.update(name.casefold() for name in analysis['extracted_resources'] if name.casefold() in master)
    missing = set(master) - covered
    candidates = [(p, {r.name.casefold() for r in p.resources} & set(master))
                  for p in db.session.scalars(db.select(PlanetProfile)) if p.id not in occupied]
    remaining, recommendations = set(missing), []
    for _ in range(3):
        ordered = sorted(candidates, key=lambda pair: (-len(pair[1] & remaining), pair[0].name.casefold(), pair[0].id))
        if not ordered or not (ordered[0][1] & remaining):
            break
        planet, available = ordered[0]
        added = available & remaining
        recommendations.append({'planet': planet.to_dict(), 'new_resources': sorted(master[n] for n in added),
                                'gain': len(added), 'rank': len(recommendations) + 1})
        remaining -= added
        candidates = [pair for pair in candidates if pair[0].id != planet.id]
    return {'coverage_percent': round(100 * len(covered) / len(master), 1) if master else 0,
            'covered_count': len(covered), 'catalog_count': len(master), 'inactive_plans': inactive,
            'resources': [{**r, 'covered': r['name'].casefold() in covered} for r in resources],
            'missing': sorted(master[n] for n in missing), 'recommendations': recommendations,
            'method': 'Optimal Resource Prospecting Model: each proposed site adds deposits still missing from the preceding choices. This is a greedy heuristic, not a guarantee of a global optimum. Only selected extractors on powered plans count. Verify deposits at your landing site.'}


def survey_entry(planet):
    progress = db.session.get(SurveyProgress, planet.id)
    reference = db.session.get(PlanetReference, f'{planet.system_name}:{planet.name}'.casefold())
    fields = {'flora': ('scanned_flora', planet.flora), 'fauna': ('scanned_fauna', planet.fauna),
              'traits': ('discovered_traits', len(planet.planetary_traits) if planet.planetary_traits or reference else None),
              'resources': ('scanned_resources', len(planet.resources) if planet.resources or reference else None)}
    counters = {}
    for name, (key, total) in fields.items():
        scanned = getattr(progress, key) if progress else None
        counters[name] = {'field': key, 'scanned': scanned, 'total': total,
                          'remaining': max(0, total - scanned) if total is not None and scanned is not None else None}
    return {'planet': planet.to_dict(), 'counters': counters,
            'updated_at': iso(progress.updated_at) if progress else None,
            'hint': 'Check coastal and ocean biomes.' if counters['fauna']['remaining'] and any('ocean' in b.lower() for b in planet.biomes) else ''}


def survey_gaps():
    entries, systems = [], defaultdict(lambda: {'total': 0, 'complete': 0})
    for planet in db.session.scalars(db.select(PlanetProfile).order_by(PlanetProfile.name)):
        system = systems[planet.system_name or 'Unknown']
        system['total'] += 1
        system['complete'] += int(planet.surveyed_percent == 100)
        if 0 < planet.surveyed_percent < 100:
            entries.append(survey_entry(planet))
    return {'planets': entries, 'systems': [{'name': name, **counts,
            'completion_percent': round(counts['complete'] / counts['total'] * 100, 1)} for name, counts in sorted(systems.items())],
            'method': 'Counts and completion are player-entered. Unknown totals and unentered counters stay unknown. System denominators include catalogued worlds only.'}


def handover():
    logs = list(db.session.scalars(db.select(ExpeditionLog).order_by(ExpeditionLog.date.desc(), ExpeditionLog.id.desc()).limit(3)))
    surveys = list(db.session.scalars(db.select(SurveyProgress).order_by(SurveyProgress.updated_at.desc()).limit(1)))
    position = {'planet': '', 'system': '', 'source': 'Unknown', 'at': None}
    if logs:
        latest = logs[0]
        position = {'planet': latest.planet_name, 'system': latest.system_name, 'source': 'Journal', 'at': iso(latest.date)}
    if surveys and (not position['at'] or iso(surveys[0].updated_at) > position['at']):
        world = db.session.get(PlanetProfile, surveys[0].planet_id)
        if world:
            position = {'planet': world.name, 'system': world.system_name, 'source': 'Survey update', 'at': iso(surveys[0].updated_at)}
    missions = list(db.session.scalars(db.select(PlayerObjective).where(
        PlayerObjective.status == 'Active', PlayerObjective.priority == 'High').order_by(PlayerObjective.created_at, PlayerObjective.id)))
    alerts = []
    outposts = list(db.session.scalars(db.select(OutpostPlan)))
    for outpost in outposts:
        analysis = evaluate(outpost.modules, outpost.planet_id, outpost.environment, outpost.stored_mass)
        if analysis['net_power'] < 0 or analysis['storage_overflow']:
            alerts.append({'id': outpost.id, 'name': outpost.name, 'net_power': analysis['net_power'],
                           'storage_overflow': analysis['storage_overflow']})
    gaps = survey_gaps()
    portfolio = coverage()
    crew = list(db.session.scalars(db.select(CrewMember)))
    favorites = list(db.session.scalars(db.select(PlanetProfile).where(PlanetProfile.favorite.is_(True)).order_by(PlanetProfile.name)))
    milestones = list(db.session.scalars(db.select(PlanetProfile).where(PlanetProfile.surveyed_percent == 100).order_by(PlanetProfile.name)))
    home_ship = db.session.scalar(db.select(Ship).where(Ship.home_ship.is_(True)).order_by(Ship.id))
    return {'position': position, 'home_ship': home_ship.to_dict() if home_ship else None,
            'missions': [m.to_dict() for m in missions], 'outpost_alerts': alerts,
            'survey_targets': [p for p in gaps['planets'] if position['system'] and p['planet']['system_name'] == position['system']],
            'recent_logs': [log.to_dict() for log in logs], 'narrative': logs[0].ai_narrative[:600] if logs else '',
            'favorites': [p.to_dict() for p in favorites], 'milestones': [p.to_dict() for p in milestones],
            'stats': {'assigned_crew': sum(bool(c.assigned_ship or c.assigned_outpost) for c in crew),
                      'outposts': len(outposts), 'coverage_percent': portfolio['coverage_percent'],
                      'media': db.session.scalar(db.select(db.func.count(MediaItem.id)))},
            'limitations': 'Local player records only. Same-system survey targets; schematic map positions are not used as physical distances. Unknown storage limits cannot trigger overflow alerts.'}
