import type { NodeId } from '../base.js';
import type { KnowledgeNode } from './base.js';

export enum ExampleType {
  CodeSnippet = 'CodeSnippet',
  ArchitectureDiagram = 'ArchitectureDiagram',
  ConfigFile = 'ConfigFile',
  TestCase = 'TestCase',
}

/**
 * Example represents a concrete implementation sample or anti-example.
 */
export interface Example extends KnowledgeNode {
  exampleType: ExampleType;
  language?: string;
  framework?: string;
  content: string;
  illustrates?: NodeId[];
  antiExample: boolean;
  verified: boolean;
}
