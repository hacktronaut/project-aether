# LAS-006 — Knowledge Intermediate Representation (KIR)

**Document ID:** LAS-006  
**Title:** Knowledge Intermediate Representation  
**Version:** 0.1  
**Status:** Draft  
**Layer:** Compiler Infrastructure  
**Depends On:** LAS-002 (Knowledge Theory), LAS-003 (Knowledge Ontology), LAS-004 (KDL)  
**Used By:** LAS-005 (Compiler Passes), LAS-007 (Optimization Engine), LAS-008 (CEC Assembly)

---

## 1. Purpose and Motivation

### 1.1 Why a Separate IR?

The Knowledge Compiler operates on three distinct representations:

| Representation | What It Is | Lifetime |
|---------------|-----------|---------|
| **Source Documents** | Raw markdown, KDL, YAML files | Input — read once |
| **Knowledge IR (KIR)** | Transient working representation during compilation | Created at compilation start, discarded after CEC assembly |
| **Enterprise Knowledge Graph** | Persistent, indexed, queryable compiled result | Stored long-term, reused across missions |
| **CEC** | Mission-specific optimized execution package | Created per mission, cached |

The Knowledge IR (KIR) is the **internal intermediate representation** — the data structure that compiler passes read from and write to during the compilation pipeline.

The KIR serves the same role that LLVM IR serves in LLVM:
- All passes communicate through a common representation
- Each pass can be implemented, tested, and debugged independently
- The IR is verifiable — invariants can be checked between passes
- The IR can be serialized (for debugging, caching intermediate states, or parallelization)

### 1.2 KIR vs. Knowledge Graph

| Property | KIR | Knowledge Graph |
|----------|-----|----------------|
| **Persistence** | Transient (compilation session only) | Persistent (stored to disk) |
| **Purpose** | Working representation during compilation | Query and traversal at runtime |
| **Completeness** | Partial — reflects state after each pass | Complete — full compiled result |
| **Indexing** | Minimal — only what passes need | Full — byType, byScope, byPriority, byTag |
| **Versioning** | Not versioned (per-compilation artifact) | Versioned (SemVer, historical) |
| **Optimization** | Mutable — passes rewrite it | Immutable after compilation |

---

## 2. KIR Object Model

### 2.1 KIRModule

The `KIRModule` is the top-level container for a compilation unit. It corresponds to one run of the Knowledge Compiler.

```typescript
interface KIRModule {
  id: KIRModuleId                      // unique per compilation run
  compilationId: string                // links this module to a CompilationUnit
  createdAt: ISO8601
  
  // Node set — mutable during compilation
  nodes: Map<KIRNodeId, KIRNode>
  
  // Edge set — mutable during compilation
  edges: Map<KIREdgeId, KIREdge>
  
  // Source document registry
  sources: Map<SourceDocId, SourceDocument>
  
  // Per-pass results (append-only)
  passResults: KIRPassResult[]
  
  // Active diagnostics
  diagnostics: KIRDiagnostic[]
  
  // Module-level metadata
  ontologyVersion: SemVer
  config: CompilerConfig
}
```

### 2.2 KIRNode

A `KIRNode` is the working representation of a knowledge piece during compilation. It is mutable — passes can add, modify, and remove properties.

```typescript
interface KIRNode {
  id: KIRNodeId                        // stable across passes (UUID assigned at extraction)
  
  // Type information
  tentativeType: string                // raw type from P2 (may be imprecise)
  canonicalType: NodeType | null       // assigned by P4 (null before P4 runs)
  
  // Properties (mutable — passes normalize these)
  rawProperties: Map<string, string>   // raw string values from P2
  typedProperties: Map<string, KIRPropertyValue>  // typed values from P4
  
  // Provenance
  sourceDocId: SourceDocId
  sourceLocation: SourceLocation       // { line, column, length }
  extractionConfidence: number         // 0.0 – 1.0
  
  // Status — modified by normalization, conflict resolution, optimization
  status: KIRNodeStatus
  priority: Priority | null            // null before P4 maps it
  scope: Scope[] | null               // null before P4 maps it
  
  // Semantic hash — computed by P6 for deduplication
  semanticHash: string | null          // null before P6 runs
  
  // Optimization metadata — set by optimization passes
  relevanceScore: number | null        // null before O4 runs
  pathScore: number | null             // null before traversal
  inlinedRules: InlinedRule[]          // rules inlined by O5
  foldedIntoCapability: KIRNodeId | null  // set by O3 if this node was folded
  
  // Conflict tracking
  conflictsWith: KIRNodeId[]           // nodes in direct conflict
  resolvedBy: KIRNodeId | null         // which node won if this was a conflict loser
  
  // Annotations — pass-readable/writable metadata
  annotations: Map<string, string>
  
  // Modification log — for debugging and auditing
  modificationLog: KIRNodeModification[]
}

enum KIRNodeStatus {
  Candidate,       // after P2 — not yet validated
  Mapped,          // after P4 — canonical type assigned
  Active,          // after P6 — normalized, no conflicts
  Deprecated,      // after P6 — conflict loser or superseded
  Inlined,         // after O5 — inlined into parent, removed from graph
  FoldedInto,      // after O3 — folded into a Capability
  Pruned,          // after O4 — removed by context compression
  Eliminated       // after O1 — removed as dead knowledge
}

interface KIRPropertyValue {
  raw: string                          // original string
  typed: string | number | boolean | Priority | Scope[] | VersionConstraint
  propertyType: KIRPropertyType
}

interface KIRNodeModification {
  passId: string                       // which pass made this change
  field: string                        // which field was changed
  before: unknown
  after: unknown
  timestamp: ISO8601
}
```

### 2.3 KIREdge

```typescript
interface KIREdge {
  id: KIREdgeId
  type: EdgeType                       // from LAS-003 EdgeType enum
  source: KIRNodeId
  target: KIRNodeId
  weight: number                       // 0.0 – 1.0 (from LAS-003 default weight table)
  
  // Provenance
  discoveryMethod: EdgeDiscoveryMethod
  discoveredInPass: string             // which pass created this edge
  sourceRef: SourceReference | null    // if derived from explicit text reference
  
  // Status
  status: KIREdgeStatus
  
  // Annotations
  annotations: Map<string, string>
}

enum EdgeDiscoveryMethod {
  Explicit,           // declared explicitly in KDL or markdown ("requires X")
  CoLocation,         // inferred from same section co-location (P3)
  NameMatching,       // inferred from name mention in property text (P3)
  Synthetic           // added by optimization pass (O7 dependency closure)
}

enum KIREdgeStatus {
  Active,
  Redirected,         // target was merged — edge redirected to canonical node
  Removed             // edge removed by optimization
}
```

### 2.4 KIRPassResult

```typescript
interface KIRPassResult {
  passId: string                       // e.g. "P1", "O4"
  passName: string
  startedAt: ISO8601
  completedAt: ISO8601
  duration: number                     // ms
  
  status: "success" | "failure" | "skipped"
  
  stats: KIRPassStats
  diagnostics: KIRDiagnostic[]
  
  // Snapshot for debugging (optional — only when debug mode enabled)
  nodeCountBefore: number
  nodeCountAfter: number
  edgeCountBefore: number
  edgeCountAfter: number
}

interface KIRPassStats {
  nodesCreated: number
  nodesModified: number
  nodesRemoved: number
  edgesCreated: number
  edgesRemoved: number
  conflictsDetected?: number
  nodesDeduped?: number
  nodesPruned?: number
}
```

---

## 3. KIR Operations API

The KIR exposes a controlled mutation API. All passes interact with the KIR exclusively through this API — direct field mutation is not allowed.

```typescript
interface KIROperations {
  // Node operations
  addNode(node: Omit<KIRNode, 'id' | 'modificationLog'>): KIRNodeId
  getNode(id: KIRNodeId): KIRNode | undefined
  updateNode(id: KIRNodeId, changes: Partial<KIRNode>, passId: string): void
  removeNode(id: KIRNodeId, passId: string, reason: KIRNodeStatus): void
  
  // Edge operations
  addEdge(edge: Omit<KIREdge, 'id'>): KIREdgeId
  getEdge(id: KIREdgeId): KIREdge | undefined
  removeEdge(id: KIREdgeId, passId: string): void
  redirectEdge(id: KIREdgeId, newTarget: KIRNodeId, passId: string): void
  
  // Query operations — used by passes to read state
  getActiveNodes(): KIRNode[]
  getActiveEdges(): KIREdge[]
  getOutgoingEdges(nodeId: KIRNodeId, type?: EdgeType): KIREdge[]
  getIncomingEdges(nodeId: KIRNodeId, type?: EdgeType): KIREdge[]
  getNodesByType(type: NodeType): KIRNode[]
  getNodesByStatus(status: KIRNodeStatus): KIRNode[]
  
  // Semantic hash operations
  computeSemanticHash(node: KIRNode): string
  findBySemanticHash(hash: string): KIRNode | undefined
  
  // Merge operation (used by P6, O2)
  mergeNodes(canonical: KIRNodeId, duplicate: KIRNodeId, passId: string): void
  
  // Conflict operations (used by P5, O9)
  addConflict(nodeA: KIRNodeId, nodeB: KIRNodeId, type: ConflictType): void
  resolveConflict(winner: KIRNodeId, loser: KIRNodeId, passId: string): void
  
  // Snapshot (for debugging)
  snapshot(): KIRSnapshot
}
```

---

## 4. KIR Semantic Properties

### 4.1 KIR Invariants

The KIR must satisfy these invariants at the start of each pass (post-condition of the previous pass). Violations cause compilation to abort.

| Invariant | Description | Checked After |
|-----------|-------------|---------------|
| `KIR-INV-01` | All edges reference nodes that exist in the module | Every pass |
| `KIR-INV-02` | No duplicate KIRNodeIds | Every pass |
| `KIR-INV-03` | No self-referencing edges (source ≠ target) | Every pass |
| `KIR-INV-04` | All Active nodes have non-null `canonicalType` | P4 completion |
| `KIR-INV-05` | All Active nodes have non-null `priority` and `scope` | P4 completion |
| `KIR-INV-06` | Conflict edges are symmetric (`A conflicts_with B ↔ B conflicts_with A`) | P5 completion |
| `KIR-INV-07` | No Active node has a `semanticHash` collision with another Active node | P6 completion |
| `KIR-INV-08` | All edges from/to Eliminated/Inlined/Pruned nodes have been removed | O1, O5 completion |
| `KIR-INV-09` | Redirected edges point to Active nodes only | Any merge operation |

### 4.2 KIR Verification

```typescript
class KIRVerifier {
  verify(module: KIRModule, afterPass: string): KIRVerificationResult {
    violations = []
    
    // INV-01: Edge validity
    for edge of module.edges.values():
      if !module.nodes.has(edge.source) OR !module.nodes.has(edge.target):
        violations.push({ invariant: 'KIR-INV-01', edgeId: edge.id })
    
    // INV-03: No self-loops
    for edge of module.edges.values():
      if edge.source === edge.target:
        violations.push({ invariant: 'KIR-INV-03', edgeId: edge.id })
    
    // INV-04, INV-05: Type and priority completeness (post-P4 only)
    if passIndex(afterPass) >= passIndex('P4'):
      for node of module.nodes.values():
        if node.status === KIRNodeStatus.Active:
          if !node.canonicalType: violations.push({ invariant: 'KIR-INV-04', nodeId: node.id })
          if !node.priority: violations.push({ invariant: 'KIR-INV-05', nodeId: node.id })
    
    // INV-07: No semantic hash collisions (post-P6 only)
    if passIndex(afterPass) >= passIndex('P6'):
      seen = new Map<string, KIRNodeId>()
      for node of getActiveNodes(module):
        if node.semanticHash:
          if seen.has(node.semanticHash):
            violations.push({ invariant: 'KIR-INV-07', nodeId: node.id, collision: seen.get(node.semanticHash) })
          seen.set(node.semanticHash, node.id)
    
    return { valid: violations.length === 0, violations, checkedAfter: afterPass }
  }
}
```

---

## 5. KIR Serialization

The KIR can be serialized to JSON for debugging, caching mid-compilation states, and parallelization.

### 5.1 KIR JSON Schema

```json
{
  "$schema": "https://aether.dev/schemas/kir/0.1.json",
  "id": "kir-module-uuid",
  "compilationId": "compilation-uuid",
  "createdAt": "2026-07-19T10:00:00Z",
  "ontologyVersion": "0.1.0",
  "nodes": {
    "node-uuid-1": {
      "id": "node-uuid-1",
      "tentativeType": "rule",
      "canonicalType": "Rule",
      "status": "Active",
      "priority": "Mandatory",
      "scope": ["backend", "security"],
      "extractionConfidence": 0.92,
      "semanticHash": "sha256:abc123...",
      "relevanceScore": null,
      "rawProperties": {
        "directive": "Controllers must not contain business logic"
      },
      "typedProperties": {
        "directive": { "raw": "Controllers must not contain business logic", "typed": "Controllers must not contain business logic", "propertyType": "string" }
      },
      "sourceDocId": "doc-uuid-1",
      "sourceLocation": { "line": 42, "column": 1, "length": 180 },
      "inlinedRules": [],
      "conflictsWith": [],
      "resolvedBy": null,
      "annotations": {},
      "modificationLog": [
        { "passId": "P2", "field": "status", "before": null, "after": "Candidate", "timestamp": "..." },
        { "passId": "P4", "field": "canonicalType", "before": "rule", "after": "Rule", "timestamp": "..." },
        { "passId": "P4", "field": "status", "before": "Candidate", "after": "Mapped", "timestamp": "..." }
      ]
    }
  },
  "edges": {
    "edge-uuid-1": {
      "id": "edge-uuid-1",
      "type": "requires",
      "source": "node-uuid-1",
      "target": "node-uuid-2",
      "weight": 0.95,
      "discoveryMethod": "Explicit",
      "discoveredInPass": "P3",
      "status": "Active"
    }
  },
  "passResults": [ ... ],
  "diagnostics": [ ... ]
}
```

### 5.2 Checkpointing

The compiler can checkpoint the KIR after any pass:

```typescript
interface KIRCheckpointer {
  // Save KIR state to disk after a specific pass
  checkpoint(module: KIRModule, afterPass: string, outputDir: string): string  // returns file path
  
  // Load KIR from checkpoint and resume compilation from a given pass
  resume(checkpointPath: string, fromPass: string): KIRModule
}
```

This enables:
- **Debugging:** Inspect the exact KIR state between passes
- **Parallelization:** Multiple optimizations running on KIR snapshots (future)
- **Incremental compilation:** Reuse P1–P4 output when only optimization config changes

---

## 6. KIR and the Compilation Pipeline

### 6.1 KIR Lifecycle Per Pass

```
Compilation Start
      │
      │ CREATE KIRModule
      │
      ▼
 P1 (Parser)
  Reads: SourceDocument[]
  Writes: module.sources
  KIR state: Empty nodes, no edges
      │
      ▼
 P2 (Extractor)
  Reads: module.sources
  Writes: nodes (status=Candidate, tentativeType, rawProperties, confidence)
  KIR state: Populated nodes, no edges
      │
      ▼ VERIFY KIR-INV-01, KIR-INV-02, KIR-INV-03
      │
 P3 (Relationship Discoverer)
  Reads: module.nodes (rawProperties)
  Writes: module.edges
  KIR state: Nodes + edges (all Active)
      │
      ▼ VERIFY
      │
 P4 (Ontology Mapper)
  Reads: module.nodes (tentativeType, rawProperties)
  Writes: node.canonicalType, node.typedProperties, node.priority, node.scope, node.status=Mapped
  KIR state: All nodes have canonical types and typed properties
      │
      ▼ VERIFY KIR-INV-04, KIR-INV-05
      │
 P5 (Conflict Detector)
  Reads: module.nodes (priority, scope, typedProperties)
  Writes: module.conflicts, node.conflictsWith
  KIR state: Conflict relationships tracked
      │
      ▼ VERIFY KIR-INV-06
      │
 P6 (Normalizer)
  Reads: module.nodes, module.conflicts
  Writes: node.semanticHash, node.status, merges duplicates
  KIR state: No active duplicate nodes
      │
      ▼ VERIFY KIR-INV-07
      │
 P7 (Graph Constructor)
  Reads: module (all active nodes + edges)
  Writes: EnterpriseKnowledgeGraph (output — not KIR)
  KIR state: Final — used to build output graph

      ← END OF COMPILATION PHASE — KIR archived or discarded →

 MISSION RECEIVED
      │
      │ CREATE KIRSubgraph (from graph traversal result)
      │
 O1 → O2 → O3 → O4 → O5 → O6 → O7 → O8 → O9
  Each pass reads/writes the KIRSubgraph
      │
 CEC Assembler reads final KIRSubgraph
      │
      ▼ EnterpriseKnowledgeGraph + KIRSubgraph → CEC
      ← KIRSubgraph discarded →
```

### 6.2 KIRSubgraph

During the optimization phase, the compiler works on a `KIRSubgraph` — a mission-scoped subset of the Knowledge Graph reloaded as a KIR for in-memory mutation:

```typescript
interface KIRSubgraph {
  parentGraphId: string                // which Knowledge Graph this came from
  missionId: string
  
  // Same operations API as KIRModule
  nodes: Map<KIRNodeId, KIRNode>
  edges: Map<KIREdgeId, KIREdge>
  
  // Optimization-specific state
  priorityOrder: KIRNodeId[]          // set by O6
  compressionReport: CompressionReport | null  // set by O8
  conflictWarnings: ConflictWarning[] // set by O9
}
```

---

## 7. KIR Analogies

To understand the KIR in relation to well-known compiler infrastructure:

| KIR Concept | LLVM Analog | Purpose |
|-------------|-------------|---------|
| `KIRModule` | `LLVMModule` | Container for the compilation unit |
| `KIRNode` | `LLVMValue` (instruction) | The atomic unit of representation |
| `KIREdge` | `LLVMUse` (use-def chain) | Relationships between units |
| `KIRNodeStatus` | SSA `def` state | Tracks whether a value is live or dead |
| `KIR-INV-*` | LLVM verifier invariants | Checked between passes to catch bugs |
| `KIRCheckpointer` | LLVM bitcode serialization | Persist IR state between compilation phases |
| `KIRSubgraph` | LLVM function (within a module) | Mission-scoped optimization unit |
| `KIROperations` | IRBuilder API | Controlled mutation of the IR |
| Optimization passes (O1-O9) | LLVM optimization passes | Transform IR while preserving semantics |
| P7 → Knowledge Graph | LLVM backend → machine code | Final output from IR |

The key difference: LLVM IR represents program instructions; KIR represents **enterprise knowledge assertions**. The graph structure (edges between knowledge nodes) has no direct analog in LLVM, which uses SSA form. The closest analog is LLVM's use-def chains, but KIR edges carry semantic meaning (requires, implements, conflicts_with) while use-def chains only represent data flow.

---

## 8. Design Decisions and Rationale

### Why not use the Knowledge Graph directly as the working representation?

The Knowledge Graph is optimized for **queries** (byType, byScope, indexed lookups) and **persistence** (SQLite storage). It is not optimized for the frequent mutations, node status tracking, and pass-by-pass audit logging that compilation requires. Separating the two representations allows each to be optimized for its purpose.

### Why not use SSA form for KIR?

SSA (Static Single Assignment) form is designed for data flow analysis — tracking where a value is defined and where it is used. KIR nodes are not values with definitions and uses; they are knowledge assertions with relationships. The graph structure is more appropriate than SSA form for representing semantic relationships between knowledge pieces.

### Why maintain a modification log per node?

The modification log enables complete auditability of the compilation process — every change to every node is recorded with which pass made it and what it changed. This is critical for debugging extraction errors ("why was this rule assigned the wrong type?") and for compliance scenarios where the provenance of all constraints must be documented.
