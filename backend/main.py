from flask import Flask, jsonify, request
import json
import os
from flask_cors import CORS
from config import Config
from models import db, ExpeditionLog, PlanetProfile

app = Flask(__name__)
app.config.from_object(Config)
CORS(app)

db.init_app(app)

with app.app_context():
    db.create_all()

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "systems_nominal"})

@app.route('/api/logs', methods=['POST'])
def create_log():
    data = request.get_json()
    new_log = ExpeditionLog(
        title=data.get('title'),
        planet_name=data.get('planet_name'),
        raw_notes=data.get('raw_notes'),
        ai_narrative=data.get('ai_narrative')
    )
    db.session.add(new_log)
    db.session.commit()
    return jsonify(new_log.to_dict()), 201

@app.route('/api/logs', methods=['GET'])
def get_logs():
    logs = ExpeditionLog.query.order_by(ExpeditionLog.date.desc()).all()
    return jsonify([log.to_dict() for log in logs])

@app.route('/api/generate_narrative', methods=['POST'])
def generate_narrative():
    # Placeholder for AI integration
    return jsonify({"narrative": "AI processing... [MOCK RESPONSE]"})

@app.route('/api/research', methods=['GET'])
def get_research_data():
    try:
        # readable_path for clean data
        data_path = os.path.join(app.root_path, 'data', 'research_clean.json')
        
        # Fallback to raw data if clean doesn't exist
        if not os.path.exists(data_path):
            data_path = os.path.join(app.root_path, 'data', 'research_laboratory.json')
            
        if not os.path.exists(data_path):
            return jsonify({"error": "Research data file not found"}), 500

        with open(data_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": f"Failed to load research data: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True)
