Starfield Companion App - Project Context

Core Vision

A "Nasapunk" styled companion web application for Starfield players. It focuses on immersion, narrative enhancement via AI, and strategic logistical assistance. The app mimics the in-game UI aesthetic: dark, minimal, clean typography, and holographic elements.

Architecture

Frontend: React (Vite) + Tailwind CSS (styled for high-contrast sci-fi look).

Backend: Flask (Python).

Database: SQLite (initially), scalable to Postgres.

AI Layer: OpenAI API (or similar) for narrative generation and strategy.

Domain Entities

ExpeditionLog: User entries with ID, Title, Planet, Date, Raw Notes, AI Narrative, Tags.

PlanetProfile: Static data + user notes on Hazards, Resources, Fauna.

CrewMember: Roster with Skills and Traits.

MediaItem: Screenshots/Videos attached to logs.

Core Modules (The "Big 5")

Explorer’s Hub: Dashboard. Star map visualization, recent logs, AI Briefing panel.

Quantum Journal: The core writing interface. Log creation, "Generate Narrative" AI trigger.

PlanetPulse: Planet database. Hazard analysis, resource cataloging.

Crew Command: Roster management and optimization algorithms.

CosmoDrag: Drag-and-drop media manager for organizing screenshots.

Key API Endpoints

POST /api/generate_narrative: Transforms raw notes into a Captain's Log.

GET/POST /api/logs: CRUD for ExpeditionLogs.

POST /api/strategize: AI analysis of current loadout vs. planet hazards.

POST /api/resourcehunt: Logic to find planets with specific resources.