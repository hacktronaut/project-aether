import type { KnowledgeNode } from './base.js';

export enum PolicySource {
  Regulatory = 'Regulatory',
  Organizational = 'Organizational',
  Security = 'Security',
  Legal = 'Legal',
  Technical = 'Technical',
}

export enum AuthorityLevel {
  Absolute = 'Absolute',
  Override = 'Override',
  Standard = 'Standard',
}

/**
 * Policy represents an organizational or compliance mandate.
 */
export interface Policy extends KnowledgeNode {
  policySource: PolicySource;
  authority: AuthorityLevel;
  complianceFramework?: string[];
  enforcement: string;
  auditRequired: boolean;
  violationImpact?: string;
}
