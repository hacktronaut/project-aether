import { randomUUID } from 'crypto';
import type { KIRSubgraph } from '../kir/types.js';
import type {
  CompiledExecutionContext,
  ConstraintEntry,
  PatternRef,
  CapabilityRef,
  DependencyEntry,
  QualityGateEntry,
  OutputSpec,
} from './types.js';
import { computeCECDigest } from './digest.js';
import { Priority, Scope } from '../ontology/types/base.js';

export class CECAssembler {
  assemble(subgraph: KIRSubgraph, mission: any): CompiledExecutionContext {
    const constraints: ConstraintEntry[] = [];
    const patterns: PatternRef[] = [];
    const capabilities: CapabilityRef[] = [];
    const dependencies: DependencyEntry[] = [];
    const qualityGates: QualityGateEntry[] = [];
    const expectedOutputs: OutputSpec[] = [];

    const activeNodes = Array.from(subgraph.nodes.values()).filter(
      (n) => n.status === 'Active' || n.status === 'Mapped' || n.status === 'Candidate'
    );

    const sourceFiles = new Set<string>();

    for (const node of activeNodes) {
      if (node.sourceDocId) {
        sourceFiles.add(node.sourceDocId);
      }

      const type = node.canonicalType || node.tentativeType;

      if (type === 'Rule' || type === 'Constraint') {
        constraints.push({
          id: node.id,
          name: node.rawProperties['name'] || node.id,
          priority: (node.priority || Priority.Recommended) as Priority,
          scope: (node.scope || [Scope.CrossCutting]) as Scope[],
          constraintType: node.rawProperties['constraintType'] || type,
          directive: node.rawProperties['directive'] || '',
          impact: node.rawProperties['impact'] || 'Medium',
          enforcement: node.rawProperties['enforcement'] || 'Convention',
          verificationMethod: node.rawProperties['verificationMethod'] || node.rawProperties['verification'] || 'Manual check',
        });
      } else if (type === 'Pattern') {
        patterns.push({
          id: node.id,
          name: node.rawProperties['name'] || node.id,
          patternType: node.rawProperties['patternType'] || 'Design',
          structure: node.rawProperties['structure'] || '',
          applicability: node.rawProperties['applicability'] || '',
          rationale: node.rawProperties['rationale'] || '',
        });
      } else if (type === 'Capability') {
        capabilities.push({
          id: node.id,
          name: node.rawProperties['name'] || node.id,
          capabilityType: node.rawProperties['capabilityType'] || 'General',
          components: node.rawProperties['components']?.split(',').map((c) => c.trim()) || [],
        });
      } else if (type === 'Technology') {
        dependencies.push({
          id: node.id,
          name: node.rawProperties['name'] || node.id,
          techType: node.rawProperties['techType'] || 'Library',
          versionConstraint: node.rawProperties['versionConstraint'] || '*',
          deprecated: node.rawProperties['deprecated'] === 'true',
        });
      } else if (type === 'QualityGate') {
        qualityGates.push({
          id: node.id,
          name: node.rawProperties['name'] || node.id,
          gateType: node.rawProperties['gateType'] || 'Quality',
          measurement: node.rawProperties['measurement'] || '',
          blocking: node.rawProperties['blocking'] === 'true',
        });
      } else if (type === 'ApiContract') {
        expectedOutputs.push({
          id: node.id,
          name: node.rawProperties['name'] || node.id,
          format: node.rawProperties['specFormat'] || 'OpenAPI',
          schema: node.rawProperties['spec'] || '',
        });
      }
    }

    const cecDraft: Omit<CompiledExecutionContext, 'header'> = {
      mission: {
        id: mission?.id || randomUUID(),
        objective: mission?.objective || 'Complete task',
        scope: (mission?.scope || [Scope.CrossCutting]) as Scope[],
        preconditions: mission?.preconditions || [],
        postconditions: mission?.postconditions || [],
      },
      capabilities,
      constraints,
      patterns,
      dependencies,
      qualityGates,
      expectedOutputs,
      provenance: {
        sourceFiles: Array.from(sourceFiles),
        compilationTimestamp: new Date().toISOString(),
      },
    };

    const digest = computeCECDigest(cecDraft);
    const totalInputNodes = subgraph.nodes.size;
    const totalOutputNodes = activeNodes.length;
    const compressionRatio = totalOutputNodes > 0 ? totalInputNodes / totalOutputNodes : 1.0;

    return {
      header: {
        id: randomUUID(),
        compilationId: subgraph.parentGraphId || randomUUID(),
        createdAt: new Date().toISOString(),
        version: '0.1.0',
        digest,
        compressionRatio,
        ontologyVersion: '0.1.0',
      },
      ...cecDraft,
    };
  }
}
