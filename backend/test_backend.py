import unittest
import json
import os
from main import app, db, ExpeditionLog

class BackendTestCase(unittest.TestCase):
    def setUp(self):
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.app = app.test_client()
        with app.app_context():
            db.create_all()

    def tearDown(self):
        with app.app_context():
            db.session.remove()
            db.drop_all()

    def test_health_check(self):
        response = self.app.get('/api/health')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json, {"status": "systems_nominal"})

    def test_create_and_get_log(self):
        # Create a log
        log_data = {
            "title": "Test Log",
            "planet_name": "Jemison",
            "raw_notes": "Landed safely.",
            "ai_narrative": "The ship touched down..."
        }
        response = self.app.post('/api/logs', data=json.dumps(log_data), content_type='application/json')
        self.assertEqual(response.status_code, 201)
        
        # Get logs
        response = self.app.get('/api/logs')
        self.assertEqual(response.status_code, 200)
        data = response.json
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['title'], "Test Log")

    def test_generate_narrative(self):
        response = self.app.post('/api/generate_narrative')
        self.assertEqual(response.status_code, 200)
        self.assertIn("narrative", response.json)

    def test_get_research_data(self):
        response = self.app.get('/api/research')
        # Since the file exists in the real fs, but we are mocking things - wait, 
        # flask test client will use the real file system for file operations unless mocked.
        # The prompt implies we want to read the real file.
        # Let's verify status code is 200.
        self.assertEqual(response.status_code, 200)
        data = response.json
        self.assertIsInstance(data, (list, dict))

if __name__ == '__main__':
    unittest.main()
