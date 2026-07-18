# LAS-005 — Compiler Pass Specification

**Document ID:** LAS-005  
**Title:** Compiler Pass Specification  
**Version:** 0.1  
**Status:** Draft  
**Layer:** Knowledge Compiler (Layer 2) + Optimization Engine (Layer 4)  
**Depends On:** LAS-003 (Knowledge Ontology)  
**Used By:** LAS-008 (CEC), LAS-010 (Runtime)

---

## 1. Purpose

This specification defines every **compiler pass** in the Knowledge Compiler (KCC) — its inputs, outputs, invariants, algorithms, and optimization goals.

The KCC operates in two stages:

1. **Compilation Stage (Passes P1–P7):** Transforms raw enterprise documents into the Enterprise Knowledge Graph.
2. **Optimization Stage (Passes O1–O9):** Transforms the Knowledge Graph into an optimized, mission-specific Compiled Execution Context.

The compiler is deterministic. The same inputs always produce the same outputs. No LLM is involved in the compilation process.

---

## 2. Pass Framework

### 2.1 Pass Interface

Every pass implements the following abstract interface:

```typescript
interface CompilerPass {
  readonly id: string               // unique pass identifier (e.g. "P1", "O3")
  readonly name: string             // human-readable name
  readonly stage: PassStage         // Compilation | Optimization
  readonly dependsOn: string[]      // pass IDs that must complete before this one
  readonly produces: string[]       // output artifact type identifiers
  readonly consumes: string[]       // input artifact type identifiers

  // Execute the pass against the given compilation unit
  run(unit: CompilationUnit): PassResult

  // Verify that this pass's output satisfies all invariants
  verify(output: PassOutput): InvariantReport

  // Optional: supports incremental execution
  runIncremental?(unit: CompilationUnit, changedInputs: ChangeSet): PassResult
}

interface PassResult {
  passId: string
  status: "success" | "failure" | "warning"
  output: PassOutput
  diagnostics: Diagnostic[]         // warnings, errors, info
  duration: Duration
  stats: PassStats                  // e.g. nodes_created, edges_added
}

interface Diagnostic {
  level: "error" | "warning" | "info"
  code: string                      // diagnostic code (e.g. "KCC-E001")
  message: string
  source: SourceReference?
  node: NodeId?
}
```

### 2.2 Compilation Unit

The CompilationUnit is the shared mutable data structure passed through all passes:

```typescript
interface CompilationUnit {
  // Input
  sourceDocs: SourceDocument[]
  config: CompilerConfig
  ontologyVersion: SemVer

  // Intermediate state (accumulated by passes)
  documentASTs: Map<DocId, DocumentAST>
  rawNodes: KnowledgeNode[]
  edges: Edge[]
  conflicts: ConflictReport[]

  // Output
  knowledgeGraph: KnowledgeGraph?

  // Diagnostics
  diagnostics: Diagnostic[]
  passLog: PassLogEntry[]
}
```

### 2.3 Pass Registry

Passes are registered and ordered by the Pass Registry. Pass ordering is enforced based on the `dependsOn` declarations.

```typescript
class PassRegistry {
  private passes: Map<string, CompilerPass> = new Map()

  register(pass: CompilerPass): void
  getExecutionOrder(): CompilerPass[]       // topological sort of dependsOn
  runAll(unit: CompilationUnit): CompilationResult
  runOptimizations(unit: CompilationUnit, mission: Mission): OptimizationResult
}
```

### 2.4 CompilerConfig

```typescript
interface CompilerConfig {
  // Source settings
  sourceDirectories: string[]
  fileGlobs: string[]               // e.g. ["**/*.md", "**/*.kdl", "**/*.yaml"]
  excludeGlobs: string[]

  // Extraction settings
  minConfidence: float              // minimum extraction confidence [0.0–1.0]
  strictMode: boolean               // fail on any warning (default: false)

  // Optimization settings
  enableOptimizations: string[]     // which optimization passes to run
  maxOptimizationDepth: int         // prevent infinite optimization loops
  targetContextBudget: int          // max CEC nodes (e.g. 50)

  // Conflict settings
  conflictPolicy: "fail" | "warn" | "auto-resolve"
  autoResolutionStrategy: "priority" | "recency" | "manual"

  // Output settings
  outputFormat: "json" | "binary" | "kdl"
  outputDir: string
}
```

---

## 3. Compilation Stage Passes (P1–P7)

```
Knowledge Sources
      │
      ▼ P1: Document Parser
      │
      ▼ P2: Knowledge Extractor
      │
      ▼ P3: Relationship Discoverer
      │
      ▼ P4: Ontology Mapper
      │
      ▼ P5: Conflict Detector
      │
      ▼ P6: Knowledge Normalizer
      │
      ▼ P7: Graph Constructor
      │
      ▼ Enterprise Knowledge Graph
```

---

### P1 — Document Parser

**Purpose:** Parse raw source documents into a structured AST representation. This pass is purely syntactic — no semantic interpretation occurs here.

**Inputs:** Raw source files (Markdown, YAML, JSON, KDL, PDF)  
**Outputs:** `DocumentAST[]` — one AST per document  
**Depends On:** None

#### Algorithm

```
ALGORITHM: DocumentParser.run(unit: CompilationUnit)

FOR EACH sourceDoc IN unit.sourceDocs:
  1. Detect document type (by extension + content sniffing)
  2. Select appropriate parser:
       .md  → MarkdownParser  (produces heading tree + block elements)
       .kdl → KDLParser        (produces typed node declarations)
       .yaml → YAMLParser      (produces key-value tree)
       .json → JSONParser      (produces object tree)
  3. Parse document into DocumentAST:
       DocumentAST {
         id: hash(document.path + document.content)
         type: DocType
         path: document.path
         sections: Section[]        // hierarchical structure
         blocks: Block[]            // code blocks, lists, tables, paragraphs
         metadata: Map              // frontmatter / document headers
       }
  4. IF parse fails:
       Emit Diagnostic(level=error, code="KCC-P1-001: ParseFailure")
       Continue (other documents still parsed)
  5. Store AST in unit.documentASTs

POSTCONDITION: unit.documentASTs contains one AST per successfully parsed document
```

#### Invariants

- Every successfully parsed document produces exactly one AST
- ASTs are syntactic only — no semantic types assigned yet
- All source file metadata (path, size, last-modified) is preserved in the AST

---

### P2 — Knowledge Extractor

**Purpose:** Walk each DocumentAST and extract candidate KnowledgeNodes. This is the first semantic pass. Each extracted node is unresolved — it has a raw type hint and raw property values.

**Inputs:** `DocumentAST[]` from P1  
**Outputs:** `RawKnowledgeNode[]` — unresolved candidate nodes  
**Depends On:** P1

#### Extraction Heuristics

The extractor applies a **rule-based extraction** pipeline (not LLM-based):

| Signal | Detected Pattern | Extracted Type |
|--------|-----------------|----------------|
| Heading + "must", "always", "never" | `## Always use Repository Pattern` | `Rule` |
| Heading + "constraint", "invariant" | `## Security Constraint: No plaintext...` | `Constraint` |
| Heading with "pattern" keyword | `## Repository Pattern` | `Pattern` |
| Bullet starting with technology name | `- Spring Boot 3.x` | `Technology` |
| Code block labeled "example" | ` ```java // Example ``` ` | `Example` |
| ADR-style structure | `# ADR-001: Use Event Sourcing` | `Decision` |
| "policy" or "policy:" keyword | `## Security Policy` | `Policy` |
| "must achieve", "%", "coverage" | `80% test coverage required` | `QualityGate` |
| Role/actor keywords | `Backend Developer is responsible for...` | `Role` |
| OpenAPI/Swagger/AsyncAPI block | ` ```yaml openapi: "3.0" ``` ` | `APIContract` |
| Capability group markers | `## Authentication Capability` | `Capability` |
| SDD workflow blocks | `## Workflow: Implementation` | `Workflow` |

#### Algorithm

```
ALGORITHM: KnowledgeExtractor.run(unit: CompilationUnit)

rawNodes = []

FOR EACH ast IN unit.documentASTs:
  FOR EACH section IN ast.sections:
    candidates = extractionRules.match(section)
    FOR EACH candidate IN candidates:
      rawNode = RawKnowledgeNode {
        tentativeType: candidate.type       // may be corrected in P4
        rawProperties: candidate.properties // raw strings, not typed
        sourceRef: SourceReference(ast, section.location)
        confidence: candidate.confidence    // rule-based confidence score
      }
      IF rawNode.confidence >= config.minConfidence:
        rawNodes.append(rawNode)
      ELSE:
        Emit Diagnostic(level=info, code="KCC-P2-001: LowConfidenceNode", node=rawNode)

unit.rawNodes = rawNodes

POSTCONDITION: unit.rawNodes contains all candidate nodes with confidence >= threshold
```

#### Confidence Scoring

```
confidence = base_score * signal_multipliers

base_score per source:
  KDL native format:        1.0   (authored directly in KDL — no ambiguity)
  Explicit heading + body:  0.9
  Code block match:         0.85
  Bullet list item:         0.75
  Paragraph heuristic:      0.6
  Low-signal paragraph:     0.4

signal_multipliers:
  Keyword in heading:       × 1.1
  Structured format match:  × 1.1
  Multiple signal types:    × 1.05
  Single keyword only:      × 0.9
```

---

### P3 — Relationship Discoverer

**Purpose:** Discover relationships between raw nodes. Produces candidate Edge objects. Edges are discovered from:
1. Explicit references in source documents (`requires`, `see also`, `depends on`)
2. Structural co-location (nodes in same section imply `related_to`)
3. Name matching (e.g. a Rule mentions "Repository Pattern" → edge to `pattern:repository`)
4. KDL edge blocks (explicitly declared in KDL source)

**Inputs:** `RawKnowledgeNode[]` from P2  
**Outputs:** `Edge[]` — candidate edges  
**Depends On:** P2

#### Algorithm

```
ALGORITHM: RelationshipDiscoverer.run(unit: CompilationUnit)

candidateEdges = []

// Pass 3a: Explicit reference discovery
FOR EACH node IN unit.rawNodes:
  FOR EACH textProperty IN node.rawProperties:
    refs = referenceParser.extract(textProperty)
    FOR EACH ref IN refs:
      targetNode = resolveReference(ref, unit.rawNodes)
      IF targetNode != null:
        edge = Edge {
          type: inferEdgeType(ref.keyword),  // "requires" → requires, etc.
          source: node.id,
          target: targetNode.id,
          weight: DEFAULT_WEIGHTS[inferEdgeType(ref.keyword)],
          derivedFrom: node.sourceRef
        }
        candidateEdges.append(edge)

// Pass 3b: Co-location inference
FOR EACH section IN each ast.sections:
  sectionNodes = nodesInSection(section, unit.rawNodes)
  FOR EACH pair (A, B) IN sectionNodes × sectionNodes WHERE A != B:
    IF NOT edgeExists(A, B, candidateEdges):
      candidateEdges.append(Edge { type: "related_to", source: A, target: B, weight: 0.4 })

// Pass 3c: Name matching
FOR EACH node IN unit.rawNodes:
  FOR EACH otherNode IN unit.rawNodes WHERE otherNode != node:
    IF node.rawProperties mentions otherNode.name:
      IF NOT edgeExists(node, otherNode, candidateEdges):
        candidateEdges.append(Edge { type: "related_to", source: node.id, target: otherNode.id, weight: 0.5 })

unit.edges = deduplicate(candidateEdges)

POSTCONDITION: unit.edges contains all discovered relationships with inferred types and weights
```

---

### P4 — Ontology Mapper

**Purpose:** Normalize the raw nodes and their tentative types against the formal Knowledge Ontology (LAS-003). This pass resolves ambiguous types, normalizes property values, validates schemas, and maps terminology variants to canonical types.

**Inputs:** `RawKnowledgeNode[]` + `Edge[]` from P2/P3  
**Outputs:** `KnowledgeNode[]` — fully typed, schema-validated nodes  
**Depends On:** P2, P3

#### Normalization Examples

| Raw text/type | Canonical type | Notes |
|--------------|---------------|-------|
| "DAO", "Repository", "Persistence Layer", "Storage Adapter" | `Pattern:RepositoryPattern` | Terminology folding |
| "Auth", "Authentication", "AuthN" | `Capability:Authentication` | Alias resolution |
| "must not", "forbidden", "never" | `Constraint` (priority: Mandatory) | Enforcement keyword → type |
| "should", "recommended" | `Rule` (priority: Recommended) | Priority inference |
| "ADR-001", "Architecture Decision" | `Decision` | Decision type inference |

#### Algorithm

```
ALGORITHM: OntologyMapper.run(unit: CompilationUnit)

normalizedNodes = []

FOR EACH rawNode IN unit.rawNodes:
  1. Resolve type:
       canonicalType = ontology.resolveType(rawNode.tentativeType)
       IF canonicalType == null:
         // Attempt fuzzy type resolution via synonym table
         canonicalType = ontology.fuzzyResolveType(rawNode.tentativeType)
         IF canonicalType == null:
           Emit Diagnostic(level=warning, code="KCC-P4-001: UnresolvableType")
           canonicalType = "Rule"  // fallback to Rule (most general)

  2. Normalize properties:
       FOR EACH property IN rawNode.rawProperties:
         typedValue = ontology.parseProperty(canonicalType, property.name, property.value)
         IF typedValue == null:
           Emit Diagnostic(level=warning, code="KCC-P4-002: PropertyNormalizationFailed")

  3. Validate schema:
       violations = ontology.validateSchema(canonicalType, typedProperties)
       IF violations.any(v => v.level == "error"):
         Emit Diagnostic(level=error, code="KCC-P4-003: SchemaViolation")
         CONTINUE  // skip invalid node

  4. Construct typed KnowledgeNode:
       typedNode = KnowledgeNode(canonicalType, typedProperties, rawNode.sourceRef, rawNode.confidence)
       normalizedNodes.append(typedNode)

// Update edges to reference typed node IDs
unit.rawNodes = normalizedNodes
unit.edges = remapEdges(unit.edges, rawNodeIdToTypedNodeId)

POSTCONDITION: All nodes have canonical types and validated property schemas
```

---

### P5 — Conflict Detector

**Purpose:** Detect semantic conflicts between nodes using the conflict predicates defined in LAS-003. Produce a ConflictReport for each detected conflict.

**Inputs:** Typed `KnowledgeNode[]` + `Edge[]`  
**Outputs:** `ConflictReport[]`  
**Depends On:** P4

#### Algorithm

```
ALGORITHM: ConflictDetector.run(unit: CompilationUnit)

conflicts = []

// 1. Direct conflicts (explicit edges)
FOR EACH edge IN unit.edges WHERE edge.type == "conflicts_with":
  conflicts.append(ConflictReport {
    type: "DirectConflict",
    nodes: [edge.source, edge.target],
    severity: Critical,
    resolution: resolutionStrategy(edge.source, edge.target)
  })

// 2. Priority conflicts (same scope, same applicability, incompatible directives, equal priority)
FOR EACH pair (A, B) IN unit.rawNodes × unit.rawNodes WHERE A.id < B.id:
  IF scopeOverlaps(A, B) AND applicabilityOverlaps(A, B) AND isIncompatible(A, B):
    IF A.priority == B.priority:
      conflicts.append(ConflictReport { type: "PriorityConflict", nodes: [A, B], severity: Warning, resolution: FlaggedForHuman })
    ELSE:
      // Auto-resolve by priority
      winner = maxPriority(A, B)
      loser = minPriority(A, B)
      conflicts.append(ConflictReport { type: "PriorityConflict", nodes: [A, B], severity: Info, resolution: AutoResolved, resolvedBy: winner.id })

// 3. Version conflicts (same technology, incompatible version constraints)
techNodes = unit.rawNodes.filter(n => n.type == "Technology")
FOR EACH pair (A, B) IN techNodes × techNodes WHERE A.id < B.id:
  IF A.name == B.name AND NOT versionCompatible(A.version, B.version):
    conflicts.append(ConflictReport { type: "VersionConflict", nodes: [A, B], severity: Critical, resolution: FlaggedForHuman })

unit.conflicts = conflicts

IF config.conflictPolicy == "fail" AND conflicts.any(c => c.severity == Critical):
  THROW CompilationError("Critical conflicts detected. Resolve before continuing.")

POSTCONDITION: unit.conflicts contains all detected conflicts with resolution status
```

---

### P6 — Knowledge Normalizer

**Purpose:** Merge duplicate nodes (semantically equivalent nodes from different source documents), apply auto-resolved conflict resolutions, and produce a clean, deduplicated node set.

**Inputs:** Typed nodes + `ConflictReport[]`  
**Outputs:** Deduplicated, merged `KnowledgeNode[]`  
**Depends On:** P4, P5

#### Algorithm

```
ALGORITHM: KnowledgeNormalizer.run(unit: CompilationUnit)

// 1. Merge auto-resolved conflicts (loser node demoted)
FOR EACH conflict IN unit.conflicts WHERE conflict.resolution == AutoResolved:
  loserNode = unit.rawNodes.find(conflict.nodes.exclude(conflict.resolvedBy))
  loserNode.status = Deprecated
  loserNode.priority = Deprecated
  loserNode.annotations["demoted_by"] = conflict.id

// 2. Semantic deduplication
// Two nodes are semantically equivalent if:
//   - Same type
//   - Same scope
//   - Semantic hash within threshold
//   - No direct conflicts between them
grouped = groupBySemanticHash(unit.rawNodes)
FOR EACH group IN grouped WHERE group.size > 1:
  canonical = selectCanonicalNode(group)  // highest confidence + highest version
  FOR EACH duplicate IN group.exclude(canonical):
    // Merge properties (canonical wins on conflicts)
    canonical = mergeNodes(canonical, duplicate)
    // Redirect edges
    unit.edges = redirectEdges(unit.edges, duplicate.id, canonical.id)
    // Remove duplicate
    unit.rawNodes.remove(duplicate)
    Emit Diagnostic(level=info, code="KCC-P6-001: NodesMerged", nodes=[canonical.id, duplicate.id])

// 3. Edge deduplication
unit.edges = deduplicateEdges(unit.edges)  // remove exact duplicate edges

POSTCONDITION: No two remaining nodes are semantically equivalent. All conflicts are resolved or flagged.
```

---

### P7 — Graph Constructor

**Purpose:** Assemble the final, validated Enterprise Knowledge Graph from the normalized nodes and edges.

**Inputs:** Normalized `KnowledgeNode[]` + deduplicated `Edge[]`  
**Outputs:** `EnterpriseKnowledgeGraph`  
**Depends On:** P6

#### Algorithm

```
ALGORITHM: GraphConstructor.run(unit: CompilationUnit)

graph = EnterpriseKnowledgeGraph {
  id: UUID(),
  version: SemVer,
  compiledAt: now(),
  ontologyVersion: unit.ontologyVersion,
  nodes: {},
  edges: {},
  indices: {}
}

// 1. Add nodes
FOR EACH node IN unit.rawNodes WHERE node.status != Deprecated:
  graph.nodes[node.id] = node

// 2. Add edges (only between active nodes)
FOR EACH edge IN unit.edges:
  IF graph.nodes.has(edge.source) AND graph.nodes.has(edge.target):
    graph.edges[edge.id] = edge

// 3. Build indices for fast traversal
graph.indices = {
  byType: groupBy(graph.nodes, n => n.type),
  byScope: groupBy(graph.nodes, n => n.scope),
  byPriority: groupBy(graph.nodes, n => n.priority),
  outgoingEdges: groupBy(graph.edges, e => e.source),
  incomingEdges: groupBy(graph.edges, e => e.target),
  byTag: buildInvertedIndex(graph.nodes, n => n.tags)
}

// 4. Compute graph statistics
graph.stats = {
  nodeCount: graph.nodes.size,
  edgeCount: graph.edges.size,
  typeDistribution: computeDistribution(graph.nodes, n => n.type),
  conflictsResolved: unit.conflicts.filter(c => c.resolution != FlaggedForHuman).length,
  conflictsFlagged: unit.conflicts.filter(c => c.resolution == FlaggedForHuman).length
}

unit.knowledgeGraph = graph

POSTCONDITION: graph is a valid, indexed Knowledge Graph. No unresolved edges. No orphan edges.
```

---

## 4. Optimization Stage Passes (O1–O9)

The Optimization Stage runs **after** the Knowledge Graph is built and **before** a CEC is produced. Optimizations are mission-scoped — they operate on a subgraph extracted for a specific mission, not on the full graph.

```
Enterprise Knowledge Graph
      │ + Mission
      ▼ O1: Dead Knowledge Elimination
      ▼ O2: Duplicate Rule Folding
      ▼ O3: Capability Folding
      ▼ O4: Context Compression
      ▼ O5: Rule Inlining
      ▼ O6: Priority Resolution
      ▼ O7: Dependency Closure
      ▼ O8: Semantic Compression
      ▼ O9: Conflict Resolution (final pass)
      │
      ▼ Optimized Execution Subgraph → CEC
```

---

### O1 — Dead Knowledge Elimination

**Purpose:** Remove nodes that are not reachable from the mission root within the current execution scope. Analogous to dead code elimination.

**Inputs:** Traversal subgraph (mission-scoped)  
**Outputs:** Subgraph with unreachable nodes removed

#### Algorithm

```
ALGORITHM: DeadKnowledgeElimination.run(subgraph, mission)

// Perform BFS from mission root node
visited = BFS(start=mission.rootNode, graph=subgraph, maxDepth=config.maxTraversalDepth)

// Mark unreachable nodes
FOR EACH node IN subgraph.nodes:
  IF node NOT IN visited:
    subgraph.remove(node)
    Emit Diagnostic(level=info, code="O1: NodeEliminated", nodeId=node.id)

// Remove edges referencing eliminated nodes
subgraph.edges = subgraph.edges.filter(e => subgraph.has(e.source) AND subgraph.has(e.target))

RETURN subgraph
```

---

### O2 — Duplicate Rule Folding

**Purpose:** Identify rules that are semantically equivalent (same type, same scope, same directive) and fold them into a single canonical node. Retains all edges from duplicates.

#### Algorithm

```
ALGORITHM: DuplicateRuleFolding.run(subgraph)

ruleNodes = subgraph.nodes.filter(n => n.type == "Rule")
semanticGroups = groupBySemanticEquivalence(ruleNodes)

FOR EACH group IN semanticGroups WHERE group.size > 1:
  canonical = group.maxBy(n => n.confidence * n.priority.numericValue)
  FOR EACH duplicate IN group.exclude(canonical):
    subgraph.mergeEdges(from=duplicate.id, into=canonical.id)
    subgraph.remove(duplicate)
    canonical.annotations["merged_from"] = canonical.annotations.get("merged_from", []) + [duplicate.id]

RETURN subgraph
```

---

### O3 — Capability Folding

**Purpose:** Cluster groups of related rules, constraints, and patterns that together implement a named capability. Replace the cluster with a single `Capability` node. Preserves the ability to expand the Capability on demand.

#### Algorithm

```
ALGORITHM: CapabilityFolding.run(subgraph)

// Identify nodes that are already part of a Capability
capabilityNodes = subgraph.nodes.filter(n => n.type == "Capability")

FOR EACH capability IN capabilityNodes:
  members = capability.components.map(id => subgraph.get(id)).filter(not null)
  IF members.size >= 3:
    // Replace member nodes with Capability node in subgraph
    FOR EACH member IN members:
      // Redirect external edges to capability
      externalEdges = subgraph.edges.filter(e => e.target == member.id AND NOT members.has(e.source))
      FOR EACH edge IN externalEdges:
        edge.target = capability.id
      // Remove member node from top-level graph (store as expandable)
      capability.expandedNodes = capability.expandedNodes + [member]
      subgraph.remove(member)
    
    // Keep capability node in subgraph

RETURN subgraph
```

---

### O4 — Context Compression

**Purpose:** Score remaining nodes by their relevance to the mission and prune low-relevance nodes. This is the primary token-budget enforcement mechanism.

#### Relevance Scoring Function

```
relevanceScore(node, mission) =
  pathRelevance(node, mission)         // how close to mission root (BFS distance)
  × priorityWeight(node.priority)      // Mandatory=1.0, Recommended=0.8, Optional=0.5
  × scopeMatch(node.scope, mission)    // 1.0 if scope matches, 0.3 if CrossCutting only
  × edgeStrength(node, mission)        // average weight of edges connecting to mission

pathRelevance(node, mission):
  d = BFS_distance(node, mission.rootNode)
  return max(0, 1.0 - (d / config.maxTraversalDepth))

priorityWeight:
  Mandatory    → 1.0
  Recommended  → 0.8
  Optional     → 0.5
  Informational → 0.0  (always excluded)
  Deprecated    → 0.0  (always excluded)
```

#### Algorithm

```
ALGORITHM: ContextCompression.run(subgraph, mission, budget=config.targetContextBudget)

// Score all nodes
FOR EACH node IN subgraph.nodes:
  node.relevanceScore = relevanceScore(node, mission)

// Sort by relevance descending
sorted = subgraph.nodes.sortBy(n => -n.relevanceScore)

// Keep top-N nodes up to budget (Mandatory nodes always kept)
mandatoryNodes = sorted.filter(n => n.priority == "Mandatory")
remaining = sorted.filter(n => n.priority != "Mandatory")

kept = mandatoryNodes
budget = budget - mandatoryNodes.size
FOR EACH node IN remaining WHILE budget > 0:
  kept.append(node)
  budget -= 1

pruned = subgraph.nodes.exclude(kept)
FOR EACH node IN pruned:
  subgraph.remove(node)
  Emit Diagnostic(level=info, code="O4: NodePruned", nodeId=node.id, score=node.relevanceScore)

RETURN subgraph
```

---

### O5 — Rule Inlining

**Purpose:** For small leaf rule nodes (single-property rules with no dependent edges), inline their content directly into their parent node's property set. Reduces graph node count.

#### Algorithm

```
ALGORITHM: RuleInlining.run(subgraph)

FOR EACH node IN subgraph.nodes:
  children = subgraph.outgoingEdges(node).filter(e => e.type == "requires").map(e => subgraph.get(e.target))
  inlineable = children.filter(c => isLeafRule(c))

  FOR EACH leaf IN inlineable:
    // Inline leaf rule content into parent
    node.inlinedRules = node.inlinedRules + [leaf.toInlineRepresentation()]
    // Remove leaf node
    subgraph.remove(leaf)
    subgraph.removeEdge(node.id, leaf.id, "requires")

// isLeafRule: node is a Rule, has no outgoing edges, has <= 3 properties, priority <= Recommended
isLeafRule(node):
  return node.type == "Rule" AND
         subgraph.outgoingEdges(node).length == 0 AND
         node.properties.size <= 3 AND
         node.priority.level <= Recommended.level

RETURN subgraph
```

---

### O6 — Priority Resolution

**Purpose:** Enforce the priority ordering within the optimized subgraph. Ensure Mandatory nodes are not shadowed by lower-priority conflicting nodes. Produce a priority-ordered list for CEC assembly.

#### Algorithm

```
ALGORITHM: PriorityResolution.run(subgraph)

// Build priority-ordered node list
ordered = subgraph.nodes.sortBy(n => [
  -n.priority.numericValue,   // primary: priority descending
  -n.relevanceScore,          // secondary: relevance descending
  n.id                        // tertiary: stable sort
])

// Validate no lower-priority node contradicts a Mandatory node
FOR EACH mandatoryNode IN ordered.filter(n => n.priority == "Mandatory"):
  FOR EACH conflictEdge IN subgraph.edges.filter(e => e.type == "conflicts_with" AND e.source == mandatoryNode.id):
    conflicting = subgraph.get(conflictEdge.target)
    IF conflicting != null AND conflicting.priority != "Mandatory":
      // Auto-resolve: remove conflicting node
      subgraph.remove(conflicting)
      Emit Diagnostic(level=info, code="O6: LowerPriorityNodeRemoved", 
                      winner=mandatoryNode.id, removed=conflicting.id)

subgraph.priorityOrder = ordered.map(n => n.id)
RETURN subgraph
```

---

### O7 — Dependency Closure

**Purpose:** Ensure all required dependencies of nodes in the subgraph are also present. If a node requires X, and X requires Y, then Y must be in the subgraph too. Computes transitive closure over `requires` and `depends_on` edges.

#### Algorithm

```
ALGORITHM: DependencyClosure.run(subgraph, fullGraph)

closure = Set(subgraph.nodes.map(n => n.id))
worklist = Queue(subgraph.nodes)

WHILE worklist NOT EMPTY:
  node = worklist.dequeue()
  hardDeps = fullGraph.outgoingEdges(node).filter(e => e.type IN ["requires", "depends_on"])

  FOR EACH dep IN hardDeps:
    IF dep.target NOT IN closure:
      depNode = fullGraph.get(dep.target)
      IF depNode.priority == "Mandatory" OR dep.target is Technology:
        closure.add(dep.target)
        subgraph.add(depNode)
        subgraph.addEdge(dep)
        worklist.enqueue(depNode)
        Emit Diagnostic(level=info, code="O7: DependencyAdded", nodeId=dep.target)

RETURN subgraph
```

---

### O8 — Semantic Compression

**Purpose:** The final compression pass. Represents the full reduction from source document volume (100+ pages) to a minimal execution set (40–50 nodes). Combines the effects of O1–O7 and produces a summary of compression achieved.

#### Algorithm

```
ALGORITHM: SemanticCompression.run(subgraph, originalStats)

// At this point O1-O7 have already reduced the graph.
// O8 performs a final pass:

// 1. Remove all Informational and Deprecated nodes (never needed in CEC)
FOR EACH node IN subgraph.nodes WHERE node.priority IN [Informational, Deprecated]:
  subgraph.remove(node)

// 2. Collapse Example nodes: keep only 1 example per Rule/Pattern (highest confidence)
FOR EACH ruleOrPattern IN subgraph.nodes WHERE type IN [Rule, Pattern]:
  examples = subgraph.incomingEdges(ruleOrPattern)
             .filter(e => e.type == "exemplifies")
             .map(e => subgraph.get(e.source))
  IF examples.size > 1:
    bestExample = examples.maxBy(e => e.confidence)
    FOR EACH ex IN examples.exclude(bestExample):
      subgraph.remove(ex)

// 3. Produce compression report
compressionReport = {
  sourceDocuments: originalStats.documentCount,
  sourcePageEstimate: originalStats.estimatedPages,
  graphNodesBeforeOptimization: originalStats.graphNodeCount,
  graphEdgesBeforeOptimization: originalStats.graphEdgeCount,
  executionNodesAfterOptimization: subgraph.nodes.size,
  executionEdgesAfterOptimization: subgraph.edges.size,
  compressionRatio: originalStats.graphNodeCount / subgraph.nodes.size
}

subgraph.compressionReport = compressionReport
RETURN subgraph
```

---

### O9 — Conflict Resolution (Final Pass)

**Purpose:** Resolve any remaining conflicts that survived earlier passes. This is the last chance before CEC assembly. Any unresolved FlaggedForHuman conflicts at this stage will either block compilation or produce a CEC with an embedded conflict warning.

#### Algorithm

```
ALGORITHM: ConflictResolution.run(subgraph, unit)

remainingConflicts = unit.conflicts.filter(c => c.resolution == "FlaggedForHuman")
                    .filter(c => subgraph.has(c.nodes[0]) AND subgraph.has(c.nodes[1]))

FOR EACH conflict IN remainingConflicts:
  strategy = config.autoResolutionStrategy

  IF strategy == "priority":
    winner = maxPriority(conflict.nodes[0], conflict.nodes[1])
    loser = theOther(winner, conflict.nodes)
    subgraph.remove(loser)
    conflict.resolution = AutoResolved
    conflict.resolvedBy = winner.id

  ELSE IF strategy == "recency":
    winner = mostRecent(conflict.nodes[0], conflict.nodes[1])
    loser = theOther(winner, conflict.nodes)
    subgraph.remove(loser)
    conflict.resolution = AutoResolved
    conflict.resolvedBy = winner.id

  ELSE IF strategy == "manual":
    // Embed conflict in CEC as a warning — human must resolve during execution
    subgraph.conflictWarnings = subgraph.conflictWarnings + [conflict]
    Emit Diagnostic(level=warning, code="O9: UnresolvedConflictInCEC", conflictId=conflict.id)

RETURN subgraph
```

---

## 5. Pass Invariants Summary

| Pass | Key Invariants |
|------|--------------|
| P1 | Every source file produces exactly one AST or one error diagnostic |
| P2 | All extracted nodes have confidence >= minConfidence |
| P3 | All edges reference valid node IDs from P2 output |
| P4 | All nodes have canonical types from LAS-003 ontology |
| P5 | All `conflicts_with` edges produce ConflictReport entries |
| P6 | No two nodes in output have semantic hash distance < threshold |
| P7 | All edges in graph reference nodes that exist in graph |
| O1 | All remaining nodes are reachable from mission root |
| O2 | No two Rule nodes in output are semantically equivalent |
| O3 | All Capability member nodes are either folded or retained as Capability |
| O4 | Node count <= config.targetContextBudget; all Mandatory nodes retained |
| O5 | No inlined node has outgoing edges |
| O6 | No lower-priority node contradicts a Mandatory node |
| O7 | All nodes that are `required` by subgraph members are present in subgraph |
| O8 | No Informational or Deprecated nodes in output; at most 1 Example per node |
| O9 | No unresolved Critical conflicts in output (blocked or embedded as warnings) |

---

## 6. Diagnostic Code Reference

| Code | Level | Description |
|------|-------|-------------|
| KCC-P1-001 | Error | Document parse failure |
| KCC-P2-001 | Info | Node extracted with confidence below threshold |
| KCC-P4-001 | Warning | Node type could not be resolved to ontology canonical type |
| KCC-P4-002 | Warning | Property value could not be normalized |
| KCC-P4-003 | Error | Node schema validation failed |
| KCC-P5-001 | Error | Critical conflict detected |
| KCC-P6-001 | Info | Two nodes merged into canonical node |
| O1 | Info | Node eliminated (not reachable from mission) |
| O4 | Info | Node pruned (below relevance threshold after budget enforcement) |
| O6 | Info | Lower-priority conflicting node removed |
| O7 | Info | Dependency node added to closure |
| O9 | Warning | Unresolved conflict embedded in CEC |
