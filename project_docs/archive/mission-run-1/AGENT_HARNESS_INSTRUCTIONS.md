> Historical harness proposal. Current instructions are in AGENTS.md and the active gate.

# Starfield Companion App - Agent Harness Instructions

This document provides instructions on how to set up an advanced AI execution harness for the Starfield Companion App. This structure ensures that AI agents working on this project have strict boundaries, clear ownership, and do not make destructive mistakes during execution. The setup is based on the mature harness architectures used in similar projects (like AI Tool and Context Ledger).

## Why an Agent Harness?

A good harness ensures an AI agent can answer six questions within its first read of the repository:
1. What is the project?
2. What is the current goal?
3. Who owns the next action?
4. Which contracts constrain the work?
5. How is completion verified?
6. Where does control return once the work is done?

## Recommended Repository Structure

To build a robust agent execution harness, add the following directory structure to the root of the Starfield project:

```text
.codex/
  hooks/
    README.md
    pre_tool_use_policy.py      # Hook to deny dangerous operations (e.g., git checkout, overwriting source blindly)
project_docs/
  INDEX.md                      # The shortest route to current truth. Points to active gate.
  active/
    README.md                   # Explains the current project direction
    active_gate/
      README.md                 # The ONLY executable current-work plan. Must start with "Goal:"
    status/
      project_execution_status.md # Explicit execution status, phase, slice, and readiness.
    architecture/
      README.md                 # Preserved durable decisions (Database, Backend, Frontend).
    agent_harness/
      README.md
      templates/
        SPECIALIST_HANDOFF_TEMPLATE.md # Template for handing off specific tasks (e.g. Frontend to Backend)
  archive/
    README.md                   # Completed or superseded plans. Agents must not use this for active execution.
```

## Step-by-Step Setup Guide

### 1. Establish the Authority Chain
Create `project_docs/INDEX.md` as the entry point for any AI agent entering the repository.
It should explicitly instruct the agent to read `project_docs/active/active_gate/README.md` to understand the *current* objective.

### 2. Define the Active Gate
The `active_gate/README.md` should be the only file authorizing work. It must contain:
- **Goal:** The exact feature being built (e.g., "Implement the /api/generate_narrative endpoint").
- **Scope:** What is and isn't included.
- **Verification:** How the agent proves it finished the work (e.g., "Run pytest and provide the output").

### 3. Implement Specialist Handoffs
If one AI agent is building the Flask backend and another is doing the React frontend, they shouldn't guess what the other did. Use handoffs.
A specialist handoff (`project_docs/active/ai_hand_off/FRONTEND_HANDOFF.md`) should include:
- Exact JSON fixtures of the API.
- TypeScript interfaces to map the API.
- Loading/Empty/Error states for the UI.

### 4. Create Safety Hooks (The Catastrophic Guard)
Add a `.codex/hooks/pre_tool_use_policy.py` script. This script intercepts bash commands run by the agent.
It should be programmed to block:
- `git restore` or `git checkout` on specialist-owned source code.
- Blind shell redirection (`echo ... > file`).
- Dynamic python path writes (`Path(f).write_text(...)`).

### 5. Documentation Lifecycle
Never delete old plans if they provide context, but **always** move them to `project_docs/archive/`.
Do not let agents treat historical roadmaps as active execution plans.

## Moving Forward
Once you build this skeleton, your AI model will follow strict execution rules. It won't hallucinate old plans, it won't overwrite core infrastructure blindly, and it will communicate its progress through verifiable execution states.
