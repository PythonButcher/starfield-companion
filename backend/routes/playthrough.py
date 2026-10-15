"""Read-only playthrough connection; paths come from local configuration only."""

from flask import Blueprint, current_app, jsonify

bp = Blueprint('playthrough', __name__, url_prefix='/api/playthrough')


@bp.get('')
def latest():
    connection = current_app.extensions['playthrough']
    response = jsonify(connection.read(current_app.config['SAVE_COPY_FOLDER']))
    response.headers['Cache-Control'] = 'no-store'
    return response
