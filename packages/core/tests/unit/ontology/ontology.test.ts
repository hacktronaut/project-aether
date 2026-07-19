import { describe, it, expect } from 'vitest';
import {
  Priority,
  Scope,
  NodeStatus,
  StabilityLevel,
  NodeType,
  isRule,
  isConstraint,
  serializeNode,
  deserializeNode,
} from '../../../src/ontology/index.js';
import type { Rule, Constraint } from '../../../src/ontology/index.js';

describe('Aether Ontology Type Guards and Serialization', () => {
  const sampleRule: Rule = {
    id: 'rule:test-1',
    name: 'Test Rule',
    type: NodeType.Rule,
    version: '1.0.0',
    createdAt: '2026-07-19T10:00:00Z',
    updatedAt: '2026-07-19T10:00:00Z',
    status: NodeStatus.Active,
    stability: StabilityLevel.Stable,
    priority: Priority.Mandatory,
    scope: [Scope.Backend],
    tags: ['test'],
    confidence: 1.0,
    description: 'This is a test rule',
    directive: 'Do not repeat yourself',
    category: 'Implementation' as any, // category enum checked by casts/guards
    enforcement: 'Strict' as any,
    rationale: 'DRY code is easier to maintain',
  };

  const sampleConstraint: Constraint = {
    id: 'constraint:test-1',
    name: 'Test Constraint',
    type: NodeType.Constraint,
    version: '1.0.0',
    createdAt: '2026-07-19T10:00:00Z',
    updatedAt: '2026-07-19T10:00:00Z',
    status: NodeStatus.Active,
    stability: StabilityLevel.Stable,
    priority: Priority.Mandatory,
    scope: [Scope.Security],
    tags: ['security'],
    confidence: 1.0,
    description: 'This is a security constraint',
    directive: 'Never store plain-text credentials',
    constraintType: 'Security' as any,
    verificationMethod: 'Static analysis check',
    impact: 'Critical' as any,
    enforcement: 'automated',
  };

  it('correctly identifies nodes using type guards', () => {
    expect(isRule(sampleRule)).toBe(true);
    expect(isRule(sampleConstraint)).toBe(false);
    expect(isConstraint(sampleConstraint)).toBe(true);
    expect(isConstraint(sampleRule)).toBe(false);
  });

  it('correctly serializes and deserializes a node', () => {
    const serialized = serializeNode(sampleRule);
    const deserialized = deserializeNode(serialized) as Rule;

    expect(deserialized.id).toBe(sampleRule.id);
    expect(deserialized.name).toBe(sampleRule.name);
    expect(deserialized.type).toBe(sampleRule.type);
    expect(deserialized.directive).toBe(sampleRule.directive);
    expect(deserialized.priority).toBe(sampleRule.priority);
  });

  it('throws an error on deserializing invalid node JSON', () => {
    const invalidJson = '{"id":"rule:1","name":"Missing Type"}';
    expect(() => deserializeNode(invalidJson)).toThrow();
  });
});
