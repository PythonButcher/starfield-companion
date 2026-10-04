"""Application factory; python main.py remains the desktop entry point."""
import sqlite3
from pathlib import Path
import click
from flask import Flask, jsonify, send_from_directory
from sqlalchemy import event
from sqlalchemy.engine import Engine
from werkzeug.exceptions import HTTPException
from config import Config
from models import db, ExpeditionLog, SeedMarker
from validation import ApiError


@event.listens_for(Engine, 'connect')
def enable_foreign_keys(connection, _):
    if isinstance(connection, sqlite3.Connection):
        connection.execute('PRAGMA foreign_keys=ON')


def create_app(config=None):
    app = Flask(__name__)
    app.config.from_object(Config)
    if config:
        app.config.update(config)
    Path(app.instance_path).mkdir(parents=True, exist_ok=True)
    Path(app.config['UPLOAD_FOLDER']).mkdir(parents=True, exist_ok=True)
    db.init_app(app)

    from routes import logs, reference, ai, planets, crew, media, catalogs, outposts, crafting, missions, operations, starter
    for blueprint in (logs.bp, reference.bp, ai.bp, planets.bp, crew.bp, media.bp, catalogs.bp, outposts.bp, crafting.bp, missions.bp, operations.bp, starter.bp):
        app.register_blueprint(blueprint)

    @app.errorhandler(ApiError)
    def api_error(error):
        db.session.rollback()
        return jsonify(error={'code': error.code, 'message': error.message}), error.status

    @app.errorhandler(HTTPException)
    def http_error(error):
        return jsonify(error={'code': error.name.lower().replace(' ', '_'), 'message': error.description}), error.code

    @app.errorhandler(Exception)
    def unexpected_error(error):
        db.session.rollback()
        app.logger.exception('Unhandled request failure')
        return jsonify(error={'code': 'internal_error', 'message': 'The ship computer could not complete this request.'}), 500

    @app.after_request
    def headers(response):
        response.headers['X-Content-Type-Options'] = 'nosniff'
        return response

    frontend = Path(app.root_path).parent / 'frontend' / 'dist'

    @app.get('/')
    @app.get('/<path:path>')
    def frontend_file(path=''):
        if path.startswith(('api/', 'media/')) or not (frontend / 'index.html').exists():
            raise ApiError('Route not found.', 404, 'not_found')
        if path and (frontend / path).is_file():
            return send_from_directory(frontend, path)
        return send_from_directory(frontend, 'index.html')

    with app.app_context():
        db.create_all()
        if app.config['SEED_ON_STARTUP']:
            from services.starter import initialize_starter, is_fresh_profile
            fresh = is_fresh_profile()
            from seed import seed_reference
            seed_reference(commit=False)
            if app.config['SEED_STARTER_STATE']:
                initialize_starter(fresh)
            db.session.commit()

    @app.cli.command('reset-db')
    @click.option('--yes', is_flag=True, help='Confirm deletion of this configured database schema.')
    def reset_db(yes):
        if not yes:
            raise click.ClickException('Back up your database first. Pass --yes to confirm reset.')
        db.drop_all()
        db.create_all()
        from seed import seed_reference
        seed_reference()
        click.echo('Database reset; upload files retained for manual reconciliation.')

    @app.cli.command('import-legacy')
    @click.argument('path', type=click.Path(exists=True, dir_okay=False, path_type=Path))
    def import_legacy(path):
        marker = 'legacy-import:' + str(path.resolve())
        if db.session.get(SeedMarker, marker):
            click.echo('This legacy file has already been imported.')
            return
        # Read-only connection makes the original file a recoverable backup.
        with sqlite3.connect(path.resolve().as_uri() + '?mode=ro', uri=True) as source:
            source.row_factory = sqlite3.Row
            rows = source.execute('SELECT title, planet_name, raw_notes, ai_narrative, date FROM expedition_log').fetchall()
        from datetime import datetime, timezone
        for row in rows:
            values = dict(row)
            date = values.pop('date')
            values = {key: value or '' for key, value in values.items()}
            if not values['title']:
                values['title'] = 'Imported expedition'
            if date:
                values['date'] = datetime.fromisoformat(date).replace(tzinfo=timezone.utc)
            db.session.add(ExpeditionLog(**values))
        db.session.add(SeedMarker(name=marker))
        db.session.commit()
        click.echo(f'Imported {len(rows)} logs; source untouched.')

    return app


if __name__ == '__main__':
    create_app().run(host='127.0.0.1', port=5000, debug=False)
