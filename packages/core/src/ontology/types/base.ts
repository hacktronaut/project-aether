/**
 * NodeId globally unique identifier (typically UUID v4 or string).
 */
export type NodeId = string;

/**
 * EdgeId globally unique identifier.
 */
export type EdgeId = string;

/**
 * Semantic Version string (e.g. "1.0.0").
 */
export type SemVer = string;

/**
 * ISO 8601 Date-Time string (e.g. "2026-07-19T10:00:00Z").
 */
export type ISO8601 = string;

/**
 * Content hash string (e.g. "sha256:abc123...").
 */
export type ContentHash = string;

/**
 * Priority levels with precedence order.
 */
export enum Priority {
  Mandatory = 'Mandatory',
  Recommended = 'Recommended',
  Optional = 'Optional',
  Informational = 'Informational',
  Deprecated = 'Deprecated',
}

/**
 * Applicability domains/scopes of a knowledge node.
 */
export enum Scope {
  Backend = 'Backend',
  Frontend = 'Frontend',
  Security = 'Security',
  Infrastructure = 'Infrastructure',
  Testing = 'Testing',
  DataAccess = 'DataAccess',
  Integration = 'Integration',
  DevOps = 'DevOps',
  Documentation = 'Documentation',
  CrossCutting = 'CrossCutting',
}

/**
 * Node status during compiler lifecycle.
 */
export enum NodeStatus {
  Active = 'Active',
  Deprecated = 'Deprecated',
  Experimental = 'Experimental',
  Draft = 'Draft',
  Archived = 'Archived',
}

/**
 * Node stability levels.
 */
export enum StabilityLevel {
  Stable = 'Stable',
  Unstable = 'Unstable',
  Evolving = 'Evolving',
}

/**
 * Origin reference pointing to the source document and location.
 */
export interface SourceReference {
  file: string;
  line: number;
  column: number;
  length: number;
}

/**
 * Extensible key-value metadata annotation.
 */
export interface Annotation {
  key: string;
  value: string;
}
