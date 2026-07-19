# Aether Interactive Playground 🌌

This is a static frontend web application that visually demonstrates how Project Aether's compiler and runtime algorithms eliminate LLM context bloat. It loads a pre-compiled Knowledge Graph (`graph.json`) and runs a simulated Aether Context Assembly (BFS traversal) in the browser when you execute a mission.

## Quick Start (Local Development)

To run the playground locally on your machine:
```bash
# From this directory (packages/playground)
npm install
npm run dev
```
Open the provided `localhost` URL to view the playground.

## How to Add or Edit Knowledge

The Knowledge Graph visualized in this playground is statically generated from the `.kdl` (Knowledge Definition Language) files located in the `knowledge/` directory.

### 1. Add your Rules
Create or edit a `.kdl` file inside `packages/playground/knowledge/`. Example format:
```kdl
Rule "My Custom Standard" {
  Scope "Backend, API"
  Priority "Mandatory"
  Directive "Always do this thing."
}
```

### 2. Rebuild the Graph
After editing your knowledge base, you **must** rebuild the static `graph.json` so the playground UI can see your new rules:
```bash
npm run build:graph
```
*This command runs the `aether compile` CLI against the `knowledge/` directory and outputs a new `public/graph.json`.*

### 3. Test your Mission
Go back to the playground UI (reload if necessary) and type a mission matching the scope of your new rule to see it activate dynamically!
