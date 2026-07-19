/**
 * @aether/adapters
 *
 * Model Adapter Protocol implementations (LAS-009).
 * Concrete adapters are added in Phase D (OpenAI, Anthropic, MCP, Agent).
 */

export type { ModelAdapter } from './types.js';
export * from './openai/index.js';
export * from './anthropic/index.js';
export * from './mcp/index.js';
