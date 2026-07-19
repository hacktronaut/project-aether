import type { CompiledExecutionContext, ConstraintEntry, CapabilityRef } from '@aether/core';
import type { ExecutionEnvelope, ModelAdapter, AdapterOptions } from '../types.js';

export class MCPAdapter implements ModelAdapter {
  readonly id = 'mcp';
  readonly name = 'Model Context Protocol';
  readonly version = '1.0.0';

  async render(cec: CompiledExecutionContext, options?: AdapterOptions): Promise<ExecutionEnvelope> {
    const tools = cec.capabilities.map((cap: CapabilityRef) => ({
      name: cap.name.replace(/[^a-zA-Z0-9_-]/g, '_'),
      description: cap.capabilityType,
      inputSchema: {
        type: 'object',
        properties: {}
      }
    }));

    let systemPrompt = "You are an AI assistant using the Model Context Protocol.\n";
    if (cec.constraints.length > 0) {
      systemPrompt += "## CONSTRAINTS\n";
      cec.constraints.forEach((c: ConstraintEntry) => {
        systemPrompt += `- ${c.directive}\n`;
      });
    }

    return {
      systemPrompt,
      userPrompt: cec.mission.objective,
      tools,
      metadata: {
        cecId: cec.header.id,
        model: options?.model || 'mcp-server',
        estimatedTokens: 0
      }
    };
  }
}
