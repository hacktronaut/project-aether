import { NodeType } from './types/nodes/base.js';
import type { KnowledgeNode } from './types/nodes/base.js';
import type { Rule } from './types/nodes/rule.js';
import type { Constraint } from './types/nodes/constraint.js';
import type { Pattern } from './types/nodes/pattern.js';
import type { Capability } from './types/nodes/capability.js';
import type { Workflow } from './types/nodes/workflow.js';
import type { Decision } from './types/nodes/decision.js';
import type { Policy } from './types/nodes/policy.js';
import type { Technology } from './types/nodes/technology.js';
import type { Example } from './types/nodes/example.js';
import type { QualityGate } from './types/nodes/quality-gate.js';
import type { Role } from './types/nodes/role.js';
import type { ApiContract } from './types/nodes/api-contract.js';

export function isRule(node: KnowledgeNode): node is Rule {
  return node.type === NodeType.Rule;
}

export function isConstraint(node: KnowledgeNode): node is Constraint {
  return node.type === NodeType.Constraint;
}

export function isPattern(node: KnowledgeNode): node is Pattern {
  return node.type === NodeType.Pattern;
}

export function isCapability(node: KnowledgeNode): node is Capability {
  return node.type === NodeType.Capability;
}

export function isWorkflow(node: KnowledgeNode): node is Workflow {
  return node.type === NodeType.Workflow;
}

export function isDecision(node: KnowledgeNode): node is Decision {
  return node.type === NodeType.Decision;
}

export function isPolicy(node: KnowledgeNode): node is Policy {
  return node.type === NodeType.Policy;
}

export function isTechnology(node: KnowledgeNode): node is Technology {
  return node.type === NodeType.Technology;
}

export function isExample(node: KnowledgeNode): node is Example {
  return node.type === NodeType.Example;
}

export function isQualityGate(node: KnowledgeNode): node is QualityGate {
  return node.type === NodeType.QualityGate;
}

export function isRole(node: KnowledgeNode): node is Role {
  return node.type === NodeType.Role;
}

export function isApiContract(node: KnowledgeNode): node is ApiContract {
  return node.type === NodeType.ApiContract;
}
