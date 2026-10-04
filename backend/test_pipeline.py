from data_pipeline.parsers import ingredients, parse_recipe, parse_system, tables
from services.catalogs import catalog
from seed import seed_reference
from models import db, PlanetProfile


def page(text):
    return dict(wikitext=text, title='Starfield:Test', source_url='https://starfieldwiki.net/wiki/Starfield:Test',
                revision=1, timestamp='2026-10-04T00:00:00Z', fetched_at='2026-10-04T00:00:00Z', license='CC-BY-SA-4.0')


def test_parser_links_nested_cells_and_recipe_boundary():
    assert ingredients('2 [[SF:Iron|Iron]]<br>3 [[SF:Iron|Iron]]') == {'Iron': 5}
    rows = list(tables('==Power==\n{|\n! Name !! Power\n|-\n| [[SF:Test|Test]] || 6\n|}'))
    assert rows == [('Power', {'Name': '[[SF:Test|Test]]', 'Power': '6'})]
    recipe = parse_recipe(page('==Crafting Components==\n* 2 [[SF:Iron|Iron]]\n==Products==\n* 99 [[SF:Lead|Lead]]'))
    assert recipe['ingredients'] == {'Iron': 2}
    assert parse_system(page('{{System Infobox|name=Sol|class=G2|level=1}}'))['layout_only']


def test_seed_catalog_and_user_records_survive_refresh(app):
    with app.app_context():
        counts = {name: len(catalog(name)) for name in ('recipes', 'systems', 'outpost_modules', 'resources')}
        assert counts['recipes'] >= 100 and counts['systems'] >= 100
        assert next(r for r in catalog('recipes') if r['name'] == 'Adaptive Frame')['ingredients'] == {'Aluminum': 1, 'Iron': 1}
        world = db.session.scalar(db.select(PlanetProfile))
        world.user_notes = 'Keep my notes'
        db.session.commit()
        seed_reference()
        assert world.user_notes == 'Keep my notes'
        assert counts == {name: len(catalog(name)) for name in counts}
