# Project Aether

> **The Knowledge Computing Platform** — a compiler infrastructure for AI-native software engineering.

[![CI](https://github.com/hacktronaut/project-aether/actions/workflows/ci.yml/badge.svg)](https://github.com/hacktronaut/project-aether/actions/workflows/ci.yml)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](./LICENSE)
[![Node.js ≥ 20](https://img.shields.io/badge/Node.js-%3E%3D20-green.svg)](https://nodejs.org)

---

## What Is Project Aether?

Project Aether transforms enterprise engineering knowledge (coding standards, architecture decisions, security policies) from markdown documents into **compiled, optimized, model-agnostic execution contexts** that any AI model can consume deterministically.

It is the missing layer between enterprise knowledge and AI execution — analogous to LLVM for compilers, or JVM for Java execution.

```
Markdown / KDL / YAML
       │
       ▼  Knowledge Compiler (KCC)
       │
Enterprise Knowledge Graph
       │
       ▼  Optimization Engine (O1–O9 passes)
       │ + Mission ("Implement Login API")
       │
Compiled Execution Context (CEC)
       │
       ▼  Model Adapter
       │
GPT / Claude / Gemini / Agent Frameworks
```

---

## Packages

| Package | Description | Status |
|---------|-------------|--------|
| [`@aether/core`](./packages/core) | Knowledge Compiler, Graph, CEC, Runtime | 🚧 In Progress |
| [`@aether/kdl`](./packages/kdl) | Knowledge Definition Language parser | 🚧 In Progress |
| [`@aether/adapters`](./packages/adapters) | OpenAI, Anthropic, MCP, Agent adapters | 🚧 In Progress |
| [`@aether/cli`](./packages/cli) | Standalone CLI tool (`aether` binary) | 🚧 In Progress |

---

## Quick Start

```bash
# Install the CLI globally
npm install -g @aether/cli

# Compile your knowledge base
aether compile ./docs --output .aether/graph.json

# Run a mission against the compiled graph
aether run --mission "Implement Login API" --model gpt-4o

# Start the REST API server
aether serve --port 3000
```

---

## Documentation

- 📖 [Research Artifacts & Specifications](./research-artifacts/README.md) — all 10 LAS design specifications
- 🏗️ [Architecture Overview](./research-artifacts/aether-platform-overview.md) — end-to-end platform flow
- 📐 [Contributing Guide](./CONTRIBUTING.md)

---

## Development

**Prerequisites:** Node.js ≥ 20, npm ≥ 10

```bash
# Install all dependencies
npm install

# Build all packages
npm run build

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Type-check all packages
npm run typecheck

# Lint
npm run lint
```

---

## License

Apache-2.0 — see [LICENSE](./LICENSE)
Aether: A Compiler Architecture for AI Engineering
