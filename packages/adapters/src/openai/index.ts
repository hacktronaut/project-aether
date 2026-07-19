import type { CompiledExecutionContext } from '@aether/core';
import type { ModelAdapter, ExecutionEnvelope, AdapterOptions } from '../types.js';

export class OpenAIAdapter implements ModelAdapter {
  readonly id = 'openai';
  readonly name = 'OpenAI Model Adapter';
  readonly version = '0.1.0';

  async render(cec: CompiledExecutionContext, options?: AdapterOptions): Promise<ExecutionEnvelope> {
    const model = options?.model || 'gpt-4o';

    // 1. Build the system prompt using structured sections from CEC
    let systemPrompt = `You are an AI Software Engineer execution agent. Your task is to execute the following mission while strictly complying with all the provided constraints and patterns.\n\n`;

    systemPrompt += `### MISSION OBJECTIVE\n`;
    systemPrompt += `${cec.mission.objective}\n\n`;

    if (cec.constraints.length > 0) {
      systemPrompt += `### CONSTRAINTS (MANDATORY & RECOMMENDED)\n`;
      for (const c of cec.constraints) {
        systemPrompt += `- [${c.priority}] ${c.name}: ${c.directive}\n`;
        if (c.verificationMethod) {
          systemPrompt += `  Verification: ${c.verificationMethod}\n`;
        }
      }
      systemPrompt += `\n`;
    }

    if (cec.patterns.length > 0) {
      systemPrompt += `### DESIGN PATTERNS\n`;
      for (const p of cec.patterns) {
        systemPrompt += `- ${p.name}: ${p.rationale}\n`;
        if (p.structure) {
          systemPrompt += `  Structure: ${p.structure}\n`;
        }
      }
      systemPrompt += `\n`;
    }

    if (cec.dependencies.length > 0) {
      systemPrompt += `### REQUIRED TECHNOLOGIES\n`;
      for (const d of cec.dependencies) {
        systemPrompt += `- ${d.name} (${d.versionConstraint})\n`;
      }
      systemPrompt += `\n`;
    }

    if (cec.expectedOutputs.length > 0) {
      systemPrompt += `### EXPECTED OUTPUTS\n`;
      for (const o of cec.expectedOutputs) {
        systemPrompt += `- ${o.name} (${o.format})\n`;
      }
      systemPrompt += `\n`;
    }

    const userPrompt = `Please implement the requested files or code changes to accomplish the mission objective. Make sure to follow all the constraints listed in the system instructions.`;

    // Simple word count heuristic for estimated tokens (1 word ~ 1.3 tokens)
    const totalWords = (systemPrompt + userPrompt).split(/\s+/).length;
    const estimatedTokens = Math.ceil(totalWords * 1.3);

    return {
      systemPrompt,
      userPrompt,
      metadata: {
        cecId: cec.header.id,
        model,
        estimatedTokens,
      },
    };
  }
}
