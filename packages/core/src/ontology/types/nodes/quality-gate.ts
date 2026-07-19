import type { KnowledgeNode } from './base.js';

export enum GateType {
  Coverage = 'Coverage',
  Performance = 'Performance',
  Security = 'Security',
  Compliance = 'Compliance',
  Review = 'Review',
}

export type MetricOperator = '>=' | '<=' | '=' | '!=' | '>' | '<';

export interface QualityGateMetric {
  name: string;
  unit: string;
  operator: MetricOperator;
  value: number | string;
}

/**
 * QualityGate represents a measurable success threshold.
 */
export interface QualityGate extends KnowledgeNode {
  gateType: GateType;
  metric: QualityGateMetric;
  measurement: string;
  blocking: boolean;
  automated: boolean;
}
