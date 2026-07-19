import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { join } from 'path';
import { rm, mkdir } from 'fs/promises';
import {
  KnowledgeCompiler,
  createDefaultConfig,
  AetherRuntime,
  NodeType,
  Priority,
  Scope,
} from '../../src/index.js';
import { OpenAIAdapter } from '../../../adapters/src/index.js';
import type { SourceDocument } from '../../src/index.js';

describe('Project Aether MVP Integration Pipeline', () => {
  const outputDir = join(__dirname, '../../tests/fixtures/output');
  const graphPath = join(outputDir, 'graph.json');

  const sourceDocs: SourceDocument[] = [
    {
      id: 'doc:auth-standards',
      path: 'auth-standards.md',
      format: 'markdown',
      lastModified: new Date().toISOString(),
      content: `
# Rule: JWT Authentication
- Scope: Backend, Security
- Priority: Mandatory
- Directive: All authentication endpoints must use JWT. Do not use session cookie auth or basic auth.
- Category: Security
- Enforcement: Strict
- Rationale: Simplifies horizontal scaling and stateless API execution.

# Constraint: Token expiration
- Scope: Backend, Security
- Priority: Mandatory
- Directive: JWT tokens must have an expiration window of exactly 15 minutes.
- ConstraintType: Security
- Verification: JwtServiceTest checks token payload exp claim
- Impact: Critical
- Enforcement: automated

# Pattern: Repository pattern
- Scope: Backend, DataAccess
- Priority: Recommended
- Directive: Use Repository Pattern to abstract data access layer.
- PatternType: Design
- Structure: Controller -> Service -> Repository -> Database
- Rationale: Allows mocking database during unit testing.
`,
    },
  ];

  beforeAll(async () => {
    await mkdir(outputDir, { recursive: true });
  });

  afterAll(async () => {
    await rm(outputDir, { recursive: true, force: true });
  });

  it('compiles documents, loads graph, runs optimizations, and adapts to OpenAI payload', async () => {
    // 1. Compile
    const config = createDefaultConfig({
      outputGraphPath: graphPath,
      strict: true,
    });
    const compiler = new KnowledgeCompiler(config);
    const unit = await compiler.compile(sourceDocs);

    expect(unit.diagnostics.length).toBe(0);
    expect(unit.passResults.length).toBe(3); // P1, P2, P7

    // Verify P7 constructed nodes
    const finalNodes = Array.from(unit.kirModule.nodes.values());
    expect(finalNodes.length).toBe(3);

    // 2. Runtime Resolution & Optimization
    const runtime = new AetherRuntime({ graphPath });
    const cec = await runtime.compileMission({
      raw: 'Create a new login endpoint using JWT Authentication, Token expiration and Repository pattern.',
      scope: ['Backend', 'Security'],
      budget: 5,
    });

    expect(cec.header).toBeDefined();
    expect(cec.header.compressionRatio).toBe(1.0); // 3 input nodes -> 3 active nodes (all fit budget)
    expect(cec.mission.objective).toContain('login endpoint');
    expect(cec.constraints.length).toBe(2); // JWT Authentication + Token expiration (Mandatory rules/constraints)
    expect(cec.patterns.length).toBe(1); // Repository pattern (Recommended pattern)

    // Verify values mapped correctly
    const jwtConstraint = cec.constraints.find((c) => c.id === 'rule:jwt-authentication');
    expect(jwtConstraint).toBeDefined();
    expect(jwtConstraint?.priority).toBe(Priority.Mandatory);
    expect(jwtConstraint?.scope).toContain(Scope.Security);
    expect(jwtConstraint?.directive).toBe('All authentication endpoints must use JWT. Do not use session cookie auth or basic auth.');

    // 3. Adapter Payload Generation
    const adapter = new OpenAIAdapter();
    const envelope = await adapter.render(cec, { model: 'gpt-4o' });

    expect(envelope.systemPrompt).toContain('### MISSION OBJECTIVE');
    expect(envelope.systemPrompt).toContain('### CONSTRAINTS');
    expect(envelope.systemPrompt).toContain('### DESIGN PATTERNS');
    expect(envelope.systemPrompt).toContain('JWT Authentication');
    expect(envelope.systemPrompt).toContain('Token expiration');
    expect(envelope.systemPrompt).toContain('Repository pattern');
    expect(envelope.metadata.model).toBe('gpt-4o');
    expect(envelope.metadata.estimatedTokens).toBeGreaterThan(50);
  });
});
