// Starfield Star Map Command Blocks
// These commands are designed to integrate with the InteractiveMap and backend API

export const getContextMenuCommands = {
  plot: {
    id: "cmd-plot",
    command: "/plot",
    display: "Plot Course",
    description: "Sets a navigational waypoint and centers the map on the target system.",
    action: "plot_course", // Expected to call selectSystem(system) in InteractiveMap.jsx
    params: ["systemId"],
    icon: "FaCompass", // Placeholder for navigational icon
  },
  log: {
    id: "cmd-log",
    command: "/log",
    display: "Add Log Entry",
    description: "Opens the Quantum Journal to create a new entry for this planet.",
    action: "navigate_to_journal", // Should route to /journal/new?planet=name
    params: ["planetName"],
    icon: "FaEdit", // Placeholder for writing/journal icon
  },
  profile: {
    id: "cmd-profile",
    command: "/profile",
    display: "View System Profile",
    description: "Accesses PlanetPulse data for detailed hazard and resource analysis.",
    action: "fetch_system_detail", // Calls GET /api/systems or /api/research
    params: ["systemId"],
    icon: "FaDatabase", // Placeholder for data/info icon
  },
  scan: {
    id: "cmd-scan",
    command: "/scan",
    display: "Analyze Resources",
    description: "Runs a strategic scan to identify high-value resources and resourcehunt logic.",
    action: "fetch_resource_scan", // Backend: POST /api/resourcehunt
    params: ["systemId", "resourceType"],
    icon: "FaSatelliteDish", // Placeholder for scanning/satellite icon
  },
  strategize: {
    id: "cmd-strategize",
    command: "/strategize",
    display: "AI Strategy Brief",
    description: "Generates an AI analysis of current loadout vs. planet hazards.",
    action: "fetch_ai_strategy", // Backend: POST /api/strategize
    params: ["systemId", "crewRoster"],
    icon: "FaBrain", // Placeholder for AI/Strategy icon
  }
};