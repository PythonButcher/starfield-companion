from flask import Flask, jsonify, request
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

@app.route('/api/systems', methods=['GET'])
def get_systems_data():
    """
    Reads the static JSON file and serves it as an API response.
    """
    try:
        # We need to find the file relative to where main.py is located.
        # os.path.dirname(__file__) gets the folder this script is in (backend/).
        current_directory = os.path.dirname(__file__)
        file_path = os.path.join(current_directory, 'starfield_universe.json')

        # Open the file in 'read' mode ('r')
        with open(file_path, 'r') as file:
            # json.load() converts the text file into a Python list of dictionaries
            data = json.load(file)
            
        # jsonify converts that Python list back into a standard JSON HTTP response
        return jsonify(data)

    except FileNotFoundError:
        # It's good practice to handle errors in case the file goes missing
        return jsonify({"error": "System data not found"}), 404

if __name__ == '__main__':
    app.run(debug=True)
