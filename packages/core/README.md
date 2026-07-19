# @aether/core

> The Knowledge Compiler, Knowledge Graph, CEC, and Runtime for Project Aether.

[![npm version](https://img.shields.io/npm/v/@aether/core)](https://www.npmjs.com/package/@aether/core)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](../../LICENSE)

---

## What's In This Package

| Module | Description | LAS Spec |
|--------|-------------|---------|
| `ontology` | All 12 knowledge node types, 14 edge types, type guards | [LAS-003](../../research-artifacts/specifications/LAS-003-knowledge-ontology.md) |
| `kir` | Knowledge Intermediate Representation — compiler's working data structure | [LAS-006](../../research-artifacts/specifications/LAS-006-knowledge-ir.md) |
| `compiler` | 7 compilation + 9 optimization passes | [LAS-005](../../research-artifacts/specifications/LAS-005-compiler-pass-specification.md) |
| `graph` | Enterprise Knowledge Graph persistence and indexing | LAS-003 |
| `cec` | Compiled Execution Context — assembly, verification, caching | [LAS-008](../../research-artifacts/specifications/LAS-008-cec-specification.md) |
| `runtime` | `AetherRuntime` — the main public API | [LAS-010](../../research-artifacts/specifications/LAS-010-runtime-specification.md) |

---

## Installation

```bash
npm install @aether/core
```

---

## Quick Usage

```typescript
import { AetherRuntime } from '@aether/core';
import { OpenAIAdapter } from '@aether/adapters';

const runtime = new AetherRuntime({
  graphPath: '.aether/graph.sqlite',
  adapter: new OpenAIAdapter({ apiKey: process.env.OPENAI_API_KEY }),
});

// Compile a mission against the knowledge graph
const cec = await runtime.compileMission({
  raw: 'Implement the UserController with JWT authentication',
  format: 'NaturalLanguage',
});

console.log(cec.mission.title);           // "Implement UserController"
console.log(cec.constraints.length);      // e.g., 8 (Mandatory constraints)
console.log(cec.header.compressionRatio); // e.g., 12.4x
```

---

## SDD Integration

```typescript
// In the SDD framework — this is all you need:
import { AetherRuntime } from '@aether/core';
```

---

## Status

🚧 In active development — see [implementation plan](../../.gemini/antigravity-ide/brain/a2e279a1-42a6-4aa2-8ab6-7092e19e4eb9/implementation_plan.md) for progress.
