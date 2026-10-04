from flask import current_app
from .providers import MockProvider, OpenAIProvider


def get_provider():
    config = current_app.config
    if config['AI_MODE'] == 'live' and config['OPENAI_API_KEY']:
        return OpenAIProvider(config['OPENAI_API_KEY'], config['OPENAI_MODEL'])
    return MockProvider()
