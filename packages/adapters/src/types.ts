import type { CompiledExecutionContext } from '@aether/core';

export interface ExecutionEnvelope {
  systemPrompt: string;
  userPrompt: string;
  tools?: any[];
  responseFormat?: any;
  metadata: {
    cecId: string;
    model: string;
    estimatedTokens: number;
  };
}

export interface AdapterOptions {
  model?: string;
  role?: string;
  temperature?: number;
}

export interface ModelAdapter {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  render(cec: CompiledExecutionContext, options?: AdapterOptions): Promise<ExecutionEnvelope>;
}
