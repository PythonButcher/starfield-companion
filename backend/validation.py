"""Small explicit validators shared across blueprint boundaries."""
import math
from flask import jsonify, request
from models import db


class ApiError(Exception):
    def __init__(self, message, status=400, code='validation_error'):
        super().__init__(message)
        self.message, self.status, self.code = message, status, code


def body(allowed):
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise ApiError('Expected a JSON object.')
    unknown = set(data) - set(allowed)
    if unknown:
        raise ApiError(f'Unknown fields: {", ".join(sorted(unknown))}')
    return data


def string(value, name, max_length=100, required=False):
    if not isinstance(value, str) or len(value) > max_length or (required and not value.strip()):
        raise ApiError(f'{name} must be {"a non-empty " if required else "a "}string of at most {max_length} characters.')
    return value.strip()


def strings(value, name):
    if not isinstance(value, list) or len(value) > 50:
        raise ApiError(f'{name} must be a list of at most 50 strings.')
    return list(dict.fromkeys(string(item, name, 100, True) for item in value))


def number(value, name, minimum=0, maximum=100, integer=False):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
        raise ApiError(f'{name} must be a finite number.')
    if not minimum <= value <= maximum or (integer and not isinstance(value, int)):
        raise ApiError(f'{name} must be {"an integer " if integer else ""}between {minimum} and {maximum}.')
    return value


def boolean(value, name):
    if not isinstance(value, bool):
        raise ApiError(f'{name} must be a boolean.')
    return value


def record(model, identifier):
    result = db.session.get(model, identifier)
    if result is None:
        raise ApiError('Record not found.', 404, 'not_found')
    return result


def foreign_key(value, name, model):
    if value is None:
        return None
    number(value, name, 1, 2147483647, integer=True)
    if db.session.get(model, value) is None:
        raise ApiError(f'{name} references a missing record.')
    return value


def page(items):
    try:
        limit = int(request.args.get('limit', 100))
        offset = int(request.args.get('offset', 0))
    except ValueError as exc:
        raise ApiError('limit and offset must be integers.') from exc
    if not 1 <= limit <= 200 or offset < 0:
        raise ApiError('limit must be 1–200 and offset must be non-negative.')
    response = jsonify(items[offset:offset + limit])
    response.headers['X-Total-Count'] = str(len(items))
    return response


def text_filter(items, fields):
    q = request.args.get('q', '').casefold().strip()
    tag = request.args.get('tag', '').casefold().strip()
    return [item for item in items
            if (not q or any(q in str(item.get(field, '')).casefold() for field in fields))
            and (not tag or tag in [entry.casefold() for entry in item.get('tags', [])])]
