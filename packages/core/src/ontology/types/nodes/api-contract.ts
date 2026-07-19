import type { KnowledgeNode } from './base.js';

export enum ContractType {
  REST = 'REST',
  GraphQL = 'GraphQL',
  gRPC = 'gRPC',
  AsyncAPI = 'AsyncAPI',
  Schema = 'Schema',
  Protocol = 'Protocol',
}

export enum CompatibilityMode {
  BackwardCompatible = 'BackwardCompatible',
  BreakingChange = 'BreakingChange',
  Additive = 'Additive',
}

/**
 * ApiContract represents an interface specification contract (OpenAPI, etc.).
 */
export interface ApiContract extends KnowledgeNode {
  contractType: ContractType;
  specFormat: string;
  spec: string;
  compatibility: CompatibilityMode;
  consumers?: string[];
  producers?: string[];
}
