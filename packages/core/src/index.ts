/**
 * @aether/core
 *
 * The Knowledge Computing Platform — core library.
 *
 * Exports:
 * - Ontology types (LAS-003)
 * - Knowledge IR (LAS-006)
 * - Knowledge Compiler (LAS-005)
 * - Graph layer
 * - CEC (LAS-008)
 * - Runtime (LAS-010)
 * - Custom errors
 *
 * @packageDocumentation
 */

// Ontology (LAS-003) — type system foundation
export * from './ontology/index.js';

// Knowledge IR (LAS-006) — internal compiler representation
export * from './kir/index.js';

// Compiler (LAS-005) — compilation and optimization passes
export * from './compiler/index.js';

// Graph layer — persistence and indexing
export * from './graph/index.js';

// CEC (LAS-008) — Compiled Execution Context
export * from './cec/index.js';

// Runtime (LAS-010) — AetherRuntime public API
export * from './runtime/index.js';

// Custom Errors
export * from './errors/index.js';
