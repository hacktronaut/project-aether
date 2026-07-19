# @aether/cli

> The standalone `aether` CLI tool — compile knowledge, run missions, inspect graphs, and serve the REST API.

[![npm version](https://img.shields.io/npm/v/@aether/cli)](https://www.npmjs.com/package/@aether/cli)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](../../LICENSE)

---

## Installation

```bash
# Install globally
npm install -g @aether/cli

# Or use as a project dev dependency
npm install --save-dev @aether/cli
```

---

## Commands

```
aether compile <source-dir>   Compile knowledge sources → Knowledge Graph
aether run --mission "..."    Run a mission → CEC → model execution
aether inspect                Inspect compiled graph (stats, node types)
aether verify --cec <path>    Verify a CEC against all 10 LAS-008 invariants
aether cache <list|clear>     Manage the CEC cache
aether serve                  Start the REST API server (POST /api/v1/run, etc.)
aether kdl validate <file>    Validate a KDL source file
```

---

## Quick Start

```bash
# 1. Compile your engineering knowledge
aether compile ./docs --output .aether/graph.json

# 2. Inspect the result
aether inspect --graph .aether/graph.json

# 3. Run a mission
aether run \
  --mission "Implement the UserController with JWT authentication" \
  --graph .aether/graph.json \
  --model gpt-4o

# 4. Or start the REST API
aether serve --port 3000
```

---

## REST API

When running `aether serve`, the following endpoints are available:

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/compile` | Compile source dir → graph |
| `POST` | `/api/v1/run` | Run mission → CEC |
| `GET` | `/api/v1/cec/:id` | Get a cached CEC |
| `GET` | `/api/v1/graph` | Graph statistics |
| `GET` | `/api/v1/health` | Health check |
| `GET` | `/api/v1/docs` | OpenAPI documentation |

---

## Status

🚧 In active development.
