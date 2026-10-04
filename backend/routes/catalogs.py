import json
from pathlib import Path
from flask import Blueprint, jsonify
from services.catalogs import catalog
from validation import page, text_filter

bp = Blueprint('catalogs', __name__, url_prefix='/api')


@bp.get('/reference/meta')
def meta():
    return jsonify(json.loads((Path(__file__).resolve().parents[1] / 'data/reference/manifest.json').read_text(encoding='utf-8')))


@bp.get('/outposts/modules')
def modules():
    return page(text_filter(catalog('outpost_modules'), ('name', 'category')))


@bp.get('/crafting/recipes')
def recipes():
    return page(text_filter(catalog('recipes'), ('name', 'kind')))
