import type { ISO8601 } from '../ontology/types/base.js';
import type { KIRModule, KIRSubgraph } from '../kir/types.js';

export interface SourceDocument {
  id: string;
  path: string;
  content: string;
  format: 'markdown' | 'kdl' | 'yaml' | 'json';
  lastModified: ISO8601;
}

export interface Block {
  type: 'paragraph' | 'code' | 'list' | 'table' | 'yaml' | 'json';
  content: string;
  raw?: any;
  line: number;
  column: number;
}

export interface Section {
  heading: string;
  level: number;
  blocks: Block[];
  children: Section[];
}

export interface DocumentAST {
  id: string;
  type: 'markdown' | 'kdl' | 'yaml' | 'json';
  path: string;
  sections: Section[];
  blocks: Block[]; // top-level blocks outside sections
  metadata?: Record<string, any>;
}

export enum DiagnosticSeverity {
  Info = 'Info',
  Warning = 'Warning',
  Error = 'Error',
}

export interface Diagnostic {
  code: string;
  message: string;
  severity: DiagnosticSeverity;
  file?: string;
  line?: number;
  column?: number;
}

export interface CompilerConfig {
  sourceDirectories: string[];
  outputGraphPath: string;
  fixedPointIteration: boolean;
  strict: boolean;
  conflictPolicy: 'fail' | 'warn' | 'auto-resolve';
}

export interface PassResult {
  passId: string;
  passName: string;
  durationMs: number;
  success: boolean;
  stats: {
    nodesCreated: number;
    nodesModified: number;
    nodesRemoved: number;
    edgesCreated: number;
    edgesRemoved: number;
  };
}

export interface CompilerPass {
  readonly id: string;
  readonly name: string;
  readonly stage: 'compilation' | 'optimization';
  readonly dependsOn?: string[];
  run(unit: CompilationUnit): Promise<void>;
}

export interface OptimizationPass {
  readonly id: string;
  readonly name: string;
  run(subgraph: KIRSubgraph, mission: any): Promise<void>;
}

export interface CompilationUnit {
  config: CompilerConfig;
  documents: SourceDocument[];
  asts: Map<string, DocumentAST>;
  kirModule: KIRModule;
  diagnostics: Diagnostic[];
  passResults: PassResult[];
}
