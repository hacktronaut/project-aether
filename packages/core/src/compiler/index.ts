export * from './types.js';
export * from './config.js';
export * from './compilation-unit.js';
export * from './knowledge-compiler.js';

// Compilation passes
export * from './passes/compilation/p1-document-parser.js';
export * from './passes/compilation/p2-knowledge-extractor.js';
export * from './passes/compilation/p7-graph-constructor.js';

// Optimization passes
export * from './passes/optimization/o1-dead-knowledge-elimination.js';
export * from './passes/optimization/o4-context-compression.js';
