# Starfield Companion App - Project Context

## Core Vision
A Nasapunk-inspired companion web application for Starfield players that leans into immersion, narrative enhancement via AI, and strategic assistance. The UI should feel like an in-game console: dark, minimal, clean typography, and holographic accents.

## Architecture (Current)
- **Framework**: Monolithic Next.js 14+ (App Router)
- **Styling**: Tailwind CSS with custom space-ready palette
- **APIs**: App Router route handlers (serverless-style) backed by lightweight in-memory data today; ready to swap to a persistent store later
- **Data**: Local JSON/JS seeds in `lib/data` for crew, systems, and initial logs

## Domain Entities
- **ExpeditionLog**: ID, title, planet, date, raw notes/content, optional AI narrative, tags
- **PlanetProfile**: Static data + user notes for hazards, resources, fauna
- **CrewMember**: Roster with skills and traits
- **MediaItem**: Screenshots or videos attached to logs

## Core Modules (The "Big 5")
- **Explorer’s Hub**: Dashboard with star map visualization and highlights
- **Quantum Journal**: Log list + writing interface and "Generate Narrative" trigger
- **PlanetPulse**: Planet database and hazard/resource intel
- **Crew Command**: Roster management
- **CosmoDrag**: Drag-and-drop media manager for organizing screenshots

## Key API Endpoints (Next.js Routes)
- `POST /api/generate_narrative`: Transform raw notes into a captain's log (placeholder mock)
- `GET/POST /api/logs`: CRUD for expedition logs (in-memory seed with IDs)
- `GET /api/health`: Simple health check for uptime verification
