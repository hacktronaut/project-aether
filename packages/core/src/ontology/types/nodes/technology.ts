import type { NodeId } from '../base.js';
import type { KnowledgeNode } from './base.js';

export enum TechType {
  Language = 'Language',
  Framework = 'Framework',
  Library = 'Library',
  Platform = 'Platform',
  Database = 'Database',
  Tool = 'Tool',
}

/**
 * Technology represents a programming language, library, framework, or developer tool.
 */
export interface Technology extends KnowledgeNode {
  techType: TechType;
  ecosystem: string;
  versionConstraint: string;
  alternatives?: NodeId[];
  deprecated: boolean;
  replacement?: NodeId;
  officialDocs?: string;
}
