# @aether/adapters

> Model Adapter Protocol implementations for Project Aether — OpenAI, Anthropic, MCP, and Agent Framework adapters.

[![npm version](https://img.shields.io/npm/v/@aether/adapters)](https://www.npmjs.com/package/@aether/adapters)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](../../LICENSE)

---

## Available Adapters

| Adapter | Import Path | Target |
|---------|-------------|--------|
| `OpenAIAdapter` | `@aether/adapters` or `@aether/adapters/openai` | GPT-4o, GPT-4-turbo, etc. |
| `AnthropicAdapter` | `@aether/adapters/anthropic` | Claude 3.5 Sonnet, Haiku, etc. |
| `MCPAdapter` | `@aether/adapters/mcp` | MCP-compatible clients |
| `AgentFrameworkAdapter` | `@aether/adapters` | LangChain, generic agent frameworks |

---

## Usage

```typescript
import { OpenAIAdapter } from '@aether/adapters';
import { AetherRuntime } from '@aether/core';

const runtime = new AetherRuntime({
  graphPath: '.aether/graph.sqlite',
  adapter: new OpenAIAdapter({
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4o',
  }),
});
```

See [LAS-009](../../research-artifacts/specifications/LAS-009-model-adapter-specification.md) for the full adapter protocol specification.

---

## Status

🚧 In active development.
