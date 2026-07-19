import type { CompiledExecutionContext, ConstraintEntry, CapabilityRef } from '@aether/core';
import type { ExecutionEnvelope, ModelAdapter, AdapterOptions } from '../types.js';

export class AnthropicAdapter implements ModelAdapter {
  readonly id = 'anthropic';
  readonly name = 'Anthropic Claude';
  readonly version = '1.0.0';

  async render(cec: CompiledExecutionContext, options?: AdapterOptions): Promise<ExecutionEnvelope> {
    let systemPrompt = "You are an AI assistant bound by the following Enterprise Knowledge constraints.\n\n";
    
    if (cec.constraints.length > 0) {
      systemPrompt += "## KNOWLEDGE CONSTRAINTS\n";
      cec.constraints.forEach((c: ConstraintEntry) => {
        systemPrompt += `- ${c.directive}\n`;
      });
      systemPrompt += "\n";
    }

    if (cec.capabilities.length > 0) {
      systemPrompt += "## CAPABILITIES\n";
      cec.capabilities.forEach((cap: CapabilityRef) => {
        systemPrompt += `- ${cap.name} (${cap.capabilityType})\n`;
      });
    }

    return {
      systemPrompt,
      userPrompt: cec.mission.objective,
      metadata: {
        cecId: cec.header.id,
        model: options?.model || 'claude-3-opus-20240229',
        estimatedTokens: 0
      }
    };
  }
}
