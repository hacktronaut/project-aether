# LAS-010 — Runtime Specification

**Document ID:** LAS-010  
**Title:** Runtime Specification  
**Version:** 0.1  
**Status:** Draft  
**Layer:** Execution Engine (Layer 7)  
**Depends On:** LAS-003 (Knowledge Ontology), LAS-005 (Compiler Passes), LAS-008 (CEC)  
**Used By:** LAS-009 (Model Adapter — uses Runtime to obtain CECs)

---

## 1. Purpose

This specification defines the **runtime subsystems** of Project Aether — everything that happens between receiving a mission and dispatching a CEC to a model adapter.

The runtime is responsible for:
1. **Mission Resolution** — parsing and classifying incoming missions
2. **Graph Traversal** — walking the Knowledge Graph to find relevant nodes
3. **Dependency Resolution** — computing the complete, transitive dependency set
4. **CEC Assembly** — invoking the compiler optimization passes and assembling the CEC
5. **Context Projection** — splitting the CEC into role-specific slices for multi-agent execution
6. **Execution Planning** — building the execution DAG for multi-step missions
7. **Incremental Recompilation** — detecting knowledge changes and recompiling affected CECs
8. **Runtime Validation** — final pre-dispatch integrity checks

```
Mission Input
      │
      ▼ [1] Mission Resolution
      │
      ▼ [2] Graph Traversal
      │
      ▼ [3] Dependency Resolution
      │
      ▼ [4] CEC Assembly (invokes LAS-005 O1-O9)
      │
      ▼ [5] CEC Verification (invokes LAS-008 Verifier)
      │
      ├──── [6] Context Projection (multi-agent)
      │
      ▼ [7] Execution Planning
      │
      ▼ → Model Adapter (LAS-009)
```

---

## 2. Runtime Architecture

### 2.1 Runtime Components

```typescript
class AetherRuntime {
  // Core subsystems
  private missionResolver: MissionResolver
  private graphTraversalEngine: GraphTraversalEngine
  private dependencyResolver: DependencyResolver
  private cecAssembler: CECAssembler
  private cecVerifier: CECVerifier
  private contextProjector: ContextProjector
  private executionPlanner: ExecutionPlanner
  private incrementalEngine: IncrementalRecompiler
  private runtimeValidator: RuntimeValidator

  // State
  private knowledgeGraph: EnterpriseKnowledgeGraph
  private cecCache: CECCache
  private graphChangeTracker: GraphChangeTracker

  // Primary entry point
  async compile(mission: MissionInput, config: RuntimeConfig): Promise<CECBundle>

  // Multi-agent entry point
  async compileForAgents(mission: MissionInput, roles: Role[], config: RuntimeConfig): Promise<AgentCECBundle>

  // Graph management
  async reloadGraph(newGraph: EnterpriseKnowledgeGraph): Promise<void>
  async applyGraphPatch(patch: GraphPatch): Promise<void>
}

interface CECBundle {
  cec: CompiledExecutionContext
  envelope: ExecutionEnvelope?       // pre-rendered envelope (optional)
  compilationStats: CompilationStats
}

interface AgentCECBundle {
  fullCEC: CompiledExecutionContext
  projections: Map<RoleId, CECProjection>
  executionPlan: ExecutionPlan
  agentCECBundles: Map<RoleId, CECBundle>
}
```

---

## 3. Subsystem 1: Mission Resolution

The Mission Resolver parses and classifies the incoming mission input, extracting domain hints and producing a formal `MissionDescriptor`.

### 3.1 Mission Input

```typescript
interface MissionInput {
  raw: string                        // natural language or structured mission text
  format: "NaturalLanguage" | "Structured" | "SDDTask"
  context?: MissionContext           // optional additional context
  hints?: string[]                   // caller-provided domain hints
  priority?: MissionPriority
}

interface MissionContext {
  projectId?: string
  currentBranch?: string
  existingFiles?: string[]           // files already present in workspace
  previousMissions?: MissionId[]     // missions already completed
}
```

### 3.2 Mission Resolution Algorithm

```
ALGORITHM: MissionResolver.resolve(input: MissionInput): MissionDescriptor

// Step 1: Parse mission text
IF input.format == "SDDTask":
  parsedMission = SDDTaskParser.parse(input.raw)
ELSE IF input.format == "Structured":
  parsedMission = StructuredMissionParser.parse(input.raw)
ELSE:
  // NaturalLanguage: use heuristic extractor
  parsedMission = NLMissionParser.parse(input.raw)

// Step 2: Classify mission type
missionType = classifyMissionType(parsedMission)
// Rules:
//   Contains "implement", "build", "create", "add" → Implementation
//   Contains "review", "audit", "check", "assess" → Review or SecurityAudit
//   Contains "test", "coverage", "spec" → TestGeneration
//   Contains "document", "readme", "describe" → Documentation
//   Contains "refactor", "restructure", "improve" → Refactoring

// Step 3: Extract domain hints
domainHints = []
domainHints += input.hints ?? []
domainHints += extractDomainHints(parsedMission.text)
// Domain hint extraction:
//   "JWT", "OAuth", "login", "auth" → "Authentication", "Security"
//   "REST", "endpoint", "API", "controller" → "REST", "API"
//   "database", "repository", "CRUD", "entity" → "DataAccess", "Repository"
//   "test", "unit test", "integration test" → "Testing"
//   "log", "audit", "trace" → "Logging"

// Step 4: Resolve against Knowledge Graph
// For each domain hint, find the corresponding Capability or Technology nodes
anchorNodes = domainHints.flatMap(hint => knowledgeGraph.findByHint(hint))

// Step 5: Build MissionDescriptor
descriptor = MissionDescriptor {
  id: UUID(),
  title: parsedMission.title ?? extractTitle(parsedMission),
  objective: parsedMission.objective,
  missionType: missionType,
  domainHints: domainHints,
  actor: resolveActor(input.context),
  preconditions: extractPreconditions(parsedMission),
  postconditions: extractPostconditions(parsedMission),
  anchorNodeIds: anchorNodes.map(n => n.id),
  priority: input.priority ?? MissionPriority.Normal
}

RETURN descriptor
```

---

## 4. Subsystem 2: Graph Traversal Engine

The Graph Traversal Engine performs a **mission-scoped BFS** over the Knowledge Graph to collect all nodes relevant to the mission.

### 4.1 Traversal Configuration

```typescript
interface TraversalConfig {
  maxDepth: int                      // max BFS depth (default: 6)
  maxNodes: int                      // hard cap on collected nodes (default: 500)
  edgeWeightThreshold: float         // minimum edge weight to traverse (default: 0.4)
  priorityFilter: Priority[]         // which priority levels to include
  scopeFilter: Scope[]               // which scopes to include
  includeExamples: boolean           // whether to include Example nodes
  includeDeprecated: boolean         // whether to include Deprecated nodes (default: false)
}
```

### 4.2 `traverse_for_mission` Algorithm

```
ALGORITHM: GraphTraversalEngine.traverse_for_mission(
  graph: EnterpriseKnowledgeGraph,
  mission: MissionDescriptor,
  config: TraversalConfig
): TraversalSubgraph

visited = Set<NodeId>()
subgraphNodes = []
subgraphEdges = []
queue = PriorityQueue<TraversalEntry>()  // sorted by relevance score desc

// Seed with anchor nodes from Mission Resolution
FOR EACH anchorNodeId IN mission.anchorNodeIds:
  anchorNode = graph.get(anchorNodeId)
  IF anchorNode != null:
    queue.enqueue(TraversalEntry {
      node: anchorNode,
      depth: 0,
      pathScore: 1.0,
      incomingEdge: null
    })

// BFS with priority scoring
WHILE queue NOT EMPTY:
  entry = queue.dequeue()
  node = entry.node

  IF node.id IN visited:
    CONTINUE
  IF entry.depth > config.maxDepth:
    CONTINUE
  IF node.status == Deprecated AND NOT config.includeDeprecated:
    CONTINUE
  IF node.priority IN [Informational, Deprecated] AND node.priority NOT IN config.priorityFilter:
    CONTINUE
  IF NOT node.scope.intersects(mission.domainScopes) AND node.scope != CrossCutting:
    CONTINUE

  // Accept node
  visited.add(node.id)
  node.pathScore = entry.pathScore      // store for optimization passes
  subgraphNodes.append(node)

  IF entry.incomingEdge != null:
    subgraphEdges.append(entry.incomingEdge)

  // Check node cap
  IF subgraphNodes.size >= config.maxNodes:
    Emit Warning("KRT-001: Node cap reached during traversal")
    BREAK

  // Expand neighbors
  outgoingEdges = graph.outgoingEdges(node.id)
  FOR EACH edge IN outgoingEdges:
    IF edge.weight < config.edgeWeightThreshold:
      CONTINUE
    neighbor = graph.get(edge.target)
    IF neighbor == null OR neighbor.id IN visited:
      CONTINUE

    childScore = entry.pathScore × edge.weight × priorityWeight(neighbor.priority)
    queue.enqueue(TraversalEntry {
      node: neighbor,
      depth: entry.depth + 1,
      pathScore: childScore,
      incomingEdge: edge
    })

RETURN TraversalSubgraph {
  nodes: subgraphNodes,
  edges: subgraphEdges,
  traversalStats: { nodesVisited: visited.size, depth: maxDepthReached, duration: elapsed }
}
```

### 4.3 Graph Index Queries

For efficient traversal, the runtime uses the graph indices built in P7:

```typescript
interface GraphIndex {
  // Find nodes matching a domain hint
  findByHint(hint: string): KnowledgeNode[]

  // Find all nodes of a given type
  findByType(type: NodeType): KnowledgeNode[]

  // Find all nodes in a scope
  findByScope(scope: Scope): KnowledgeNode[]

  // Find outgoing edges from a node
  outgoingEdges(nodeId: NodeId): Edge[]

  // Find incoming edges to a node
  incomingEdges(nodeId: NodeId): Edge[]

  // BFS distance between two nodes
  distance(fromId: NodeId, toId: NodeId): int | null

  // Find all nodes reachable within N hops
  reachable(fromId: NodeId, maxHops: int): NodeId[]
}
```

---

## 5. Subsystem 3: Dependency Resolution

The Dependency Resolver computes the **complete, transitive dependency set** for all nodes in the traversal subgraph.

### 5.1 `resolve_dependencies` Algorithm

```
ALGORITHM: DependencyResolver.resolve_dependencies(
  subgraph: TraversalSubgraph,
  fullGraph: EnterpriseKnowledgeGraph
): ResolvedDependencySet

resolved = Set<NodeId>()         // nodes that have been fully resolved
worklist = Queue<NodeId>()       // nodes pending dependency resolution
dependencyMap = Map<NodeId, NodeId[]>()  // node → its direct dependencies
errors = []

// Initialize worklist with all nodes in subgraph
FOR EACH node IN subgraph.nodes:
  worklist.enqueue(node.id)
  resolved.add(node.id)

// Iterative dependency expansion
MAX_ITERATIONS = 1000  // prevent infinite loops
iteration = 0

WHILE worklist NOT EMPTY AND iteration < MAX_ITERATIONS:
  iteration++
  nodeId = worklist.dequeue()
  node = fullGraph.get(nodeId)

  // Find all hard dependencies
  hardDepEdges = fullGraph.outgoingEdges(nodeId)
                 .filter(e => e.type IN ["requires", "depends_on"])

  directDeps = []
  FOR EACH depEdge IN hardDepEdges:
    depNode = fullGraph.get(depEdge.target)
    IF depNode == null:
      errors.append(DependencyError {
        type: "UnresolvableDependency",
        nodeId: nodeId,
        targetId: depEdge.target
      })
      CONTINUE

    directDeps.append(depNode.id)

    IF depNode.id NOT IN resolved:
      resolved.add(depNode.id)
      subgraph.addNode(depNode)
      subgraph.addEdge(depEdge)
      worklist.enqueue(depNode.id)  // process transitive deps of this dep

  dependencyMap[nodeId] = directDeps

IF iteration >= MAX_ITERATIONS:
  // Possible circular dependency
  cycles = detectCycles(subgraph, dependencyMap)
  FOR EACH cycle IN cycles:
    errors.append(DependencyError { type: "CircularDependency", cycle: cycle })

RETURN ResolvedDependencySet {
  subgraph: subgraph,
  dependencyMap: dependencyMap,
  topologicalOrder: topologicalSort(dependencyMap),
  errors: errors
}
```

### 5.2 Circular Dependency Detection

```
ALGORITHM: detectCycles(subgraph, dependencyMap): Cycle[]

// DFS-based cycle detection (Tarjan's SCC algorithm)
color = Map<NodeId, "White" | "Gray" | "Black">()
cycles = []

FOR EACH node IN subgraph.nodes:
  color[node.id] = "White"

FUNCTION dfs(nodeId, path):
  color[nodeId] = "Gray"
  path.append(nodeId)

  FOR EACH dep IN dependencyMap.get(nodeId, []):
    IF color[dep] == "Gray":
      // Found cycle — extract it
      cycleStart = path.indexOf(dep)
      cycles.append(Cycle { nodes: path[cycleStart..] + [dep] })
    ELSE IF color[dep] == "White":
      dfs(dep, path)

  path.pop()
  color[nodeId] = "Black"

FOR EACH node IN subgraph.nodes WHERE color[node.id] == "White":
  dfs(node.id, [])

RETURN cycles
```

### 5.3 Topological Sort

```
ALGORITHM: topologicalSort(dependencyMap): NodeId[]

// Kahn's algorithm
inDegree = Map<NodeId, int>()
FOR EACH (nodeId, deps) IN dependencyMap:
  FOR EACH dep IN deps:
    inDegree[dep] = inDegree.get(dep, 0) + 1

queue = Queue(dependencyMap.keys().filter(n => inDegree.get(n, 0) == 0))
order = []

WHILE queue NOT EMPTY:
  node = queue.dequeue()
  order.append(node)
  FOR EACH dependent IN dependencyMap.keys().filter(n => dependencyMap[n].includes(node)):
    inDegree[dependent] -= 1
    IF inDegree[dependent] == 0:
      queue.enqueue(dependent)

IF order.length != dependencyMap.keys().length:
  THROW TopologicalSortError("Circular dependency detected")

RETURN order  // leaf dependencies first, dependent nodes last
```

---

## 6. Subsystem 4: CEC Assembly

The CECAssembler invokes LAS-005 optimization passes on the resolved dependency subgraph and then constructs the CEC schema.

### 6.1 `assemble_cec` Algorithm

```
ALGORITHM: CECAssembler.assemble_cec(
  mission: MissionDescriptor,
  resolvedDeps: ResolvedDependencySet,
  fullGraph: EnterpriseKnowledgeGraph,
  config: CompilerConfig
): CompiledExecutionContext

subgraph = resolvedDeps.subgraph

// Check CEC cache first
cacheKey = computeCECCacheKey(mission, fullGraph.digest, config)
IF cecCache.has(cacheKey):
  cached = cecCache.get(cacheKey)
  IF cecVerifier.verify(cached).valid:
    RETURN cached  // cache hit

// Run optimization passes (O1-O9 from LAS-005)
passRunner = OptimizationPassRunner(config)
optimizedSubgraph = passRunner.runAll(subgraph, mission, fullGraph)

// Build CEC from optimized subgraph
cec = CompiledExecutionContext {
  id: UUID(),
  version: CEC_SCHEMA_VERSION,
  header: buildCECHeader(optimizedSubgraph, config),
  mission: mission,
  capabilities: extractCapabilities(optimizedSubgraph),
  constraints: extractConstraints(optimizedSubgraph),
  patterns: extractPatterns(optimizedSubgraph),
  rules: extractRules(optimizedSubgraph),
  dependencies: extractDependencies(optimizedSubgraph),
  validationRules: extractValidationRules(optimizedSubgraph),
  technologyStack: extractTechStack(optimizedSubgraph),
  examples: extractExamples(optimizedSubgraph),
  qualityGates: extractQualityGates(optimizedSubgraph),
  expectedOutputs: deriveExpectedOutputs(mission, optimizedSubgraph),
  successCriteria: deriveSuccessCriteria(optimizedSubgraph),
  executionHints: deriveExecutionHints(optimizedSubgraph, resolvedDeps.topologicalOrder),
  conflictWarnings: optimizedSubgraph.conflictWarnings ?? [],
  provenance: buildProvenance(resolvedDeps, optimizedSubgraph)
}

// Compute content digest
cec.digest = SHA256(canonicalSerialize(cec without digest field))

// Cache for reuse
cecCache.put(cacheKey, cec)

RETURN cec
```

---

## 7. Subsystem 5: Context Projection

Context Projection splits a full CEC into role-specific slices for multi-agent execution. The algorithm is defined in LAS-008 §4.2. This section specifies the runtime's projection scheduling.

### 7.1 `project_context` Algorithm

```
ALGORITHM: ContextProjector.project_context(
  cec: CompiledExecutionContext,
  roles: Role[]
): Map<RoleId, CECProjection>

projections = {}

// Build role-to-scope mapping
roleScopes = Map(roles.map(r => [r.id, r.knowledgeDomains]))

// Generate projection for each role
FOR EACH role IN roles:
  projection = CECProjection {
    parentCECId: cec.id,
    roleId: role.id,
    roleName: role.name
  }

  // Filter each CEC section to role-relevant nodes
  projection.capabilities = cec.capabilities.filter(cap =>
    cap.scope.any(s => roleScopes[role.id].includes(s) OR s == CrossCutting)
  )

  projection.constraints = cec.constraints.filter(c =>
    c.scope.any(s => roleScopes[role.id].includes(s) OR s == CrossCutting)
  )

  projection.patterns = cec.patterns.filter(p =>
    p.scope.any(s => roleScopes[role.id].includes(s))
  )

  projection.rules = cec.rules.filter(r =>
    r.scope.any(s => roleScopes[role.id].includes(s) OR s == CrossCutting)
  )

  projection.expectedOutputs = cec.expectedOutputs.filter(o =>
    role.outputOwnership.includes(o.artifactType) OR role.outputOwnership.includes("All")
  )

  projection.qualityGates = cec.qualityGates.filter(qg =>
    projection.expectedOutputs.any(o => o.validatedBy.includes(qg.nodeId))
  )

  projections[role.id] = projection

// Compute inter-projection dependencies
FOR EACH projection IN projections.values():
  projection.dependsOnProjections = computeProjectionDependencies(projection, projections, cec)
  projection.providesToProjections = computeProjectionProvisions(projection, projections, cec)

// Verify projection completeness (Invariant I10)
outputsCovered = projections.values().flatMap(p => p.expectedOutputs)
IF NOT setEquals(outputsCovered.map(o => o.name), cec.expectedOutputs.map(o => o.name)):
  THROW ProjectionError("Projection set does not cover all expected outputs")

RETURN projections
```

---

## 8. Subsystem 6: Execution Planning

The Execution Planner builds an **Execution DAG** — a directed acyclic graph of tasks for a mission, where each task has a dependency order, responsible role, and success criteria.

### 8.1 ExecutionPlan Schema

```typescript
interface ExecutionPlan {
  planId: string
  missionId: MissionId
  cecId: CECId
  tasks: ExecutionTask[]
  dependencies: TaskDependency[]     // which tasks must complete before others
  criticalPath: TaskId[]             // the longest path through the DAG
  parallelGroups: TaskId[][]         // tasks that can run concurrently
  estimatedDuration: Duration?
}

interface ExecutionTask {
  id: TaskId
  name: string
  description: string
  assignedRole: RoleId?
  inputs: TaskInput[]                // outputs from previous tasks needed as input
  outputs: TaskOutput[]              // artifacts this task produces
  qualityGates: QualityGateRef[]     // gates that must pass for this task to complete
  cecProjectionId: RoleId?           // which CEC projection to use
  maxRetries: int
  timeout: Duration?
}

interface TaskDependency {
  from: TaskId                       // task that must complete first
  to: TaskId                         // task that depends on 'from'
  dependencyType: "Output" | "Approval" | "QualityGate"
}
```

### 8.2 `build_execution_plan` Algorithm

```
ALGORITHM: ExecutionPlanner.build_execution_plan(
  mission: MissionDescriptor,
  cec: CompiledExecutionContext,
  projections: Map<RoleId, CECProjection>,
  config: RuntimeConfig
): ExecutionPlan

tasks = []
dependencies = []

// Step 1: Create a task for each expected output
FOR EACH output IN cec.expectedOutputs:
  task = ExecutionTask {
    id: "task:" + output.name,
    name: "Produce " + output.name,
    description: "Generate " + output.artifactType + ": " + output.name,
    outputs: [TaskOutput { name: output.name, type: output.artifactType }],
    qualityGates: output.validatedBy.map(qg => cec.qualityGates.find(qg.nodeId))
  }

  // Assign role if multi-agent
  IF projections NOT EMPTY:
    task.assignedRole = findResponsibleRole(output, projections)
    task.cecProjectionId = task.assignedRole

  tasks.append(task)

// Step 2: Derive inter-task dependencies from topological order
FOR EACH hint IN cec.executionHints WHERE hint.hintType == Ordering:
  // Execution hints define ordering: "Implement Service before Controller"
  [first, second] = parseOrderingHint(hint)
  firstTask = tasks.find(t => t.name.includes(first))
  secondTask = tasks.find(t => t.name.includes(second))
  IF firstTask AND secondTask:
    dependencies.append(TaskDependency { from: firstTask.id, to: secondTask.id, dependencyType: "Output" })

// Step 3: Add quality gate checkpoints as tasks
FOR EACH gate IN cec.qualityGates WHERE gate.blocking == true:
  gateTask = ExecutionTask {
    id: "gate:" + gate.name,
    name: "Verify: " + gate.name,
    description: "Run quality gate: " + gate.metric.name + " " + gate.metric.operator + " " + gate.metric.value,
    qualityGates: [gate]
  }
  tasks.append(gateTask)
  // Quality gate depends on all tasks that produce artifacts it validates
  FOR EACH task IN tasks.filter(t => t.outputs.any(o => gate.appliesTo.includes(o.name))):
    dependencies.append(TaskDependency { from: task.id, to: gateTask.id, dependencyType: "QualityGate" })

// Step 4: Compute critical path
criticalPath = computeCriticalPath(tasks, dependencies)

// Step 5: Identify parallelizable groups
parallelGroups = computeParallelGroups(tasks, dependencies)

RETURN ExecutionPlan {
  planId: UUID(),
  missionId: mission.id,
  cecId: cec.id,
  tasks: tasks,
  dependencies: dependencies,
  criticalPath: criticalPath,
  parallelGroups: parallelGroups
}
```

### 8.3 Critical Path Algorithm

```
ALGORITHM: computeCriticalPath(tasks, dependencies): TaskId[]

// Assign weights (1 per task)
// Use longest path algorithm (since DAG)
topo = topologicalSort(tasks.map(t => t.id), dependencies)
dist = Map(topo.map(t => [t, 0]))
prev = Map()

FOR EACH taskId IN topo:
  FOR EACH dep IN dependencies.filter(d => d.from == taskId):
    IF dist[dep.from] + 1 > dist[dep.to]:
      dist[dep.to] = dist[dep.from] + 1
      prev[dep.to] = dep.from

// Traceback from max-distance task
end = topo.maxBy(t => dist[t])
path = [end]
WHILE prev.has(path[0]):
  path.unshift(prev[path[0]])

RETURN path
```

---

## 9. Subsystem 7: Incremental Recompilation

When source knowledge changes, the runtime detects which nodes are affected and recompiles only the affected subgraph and invalidated CECs.

### 9.1 Change Detection

```typescript
interface GraphPatch {
  patchId: string
  appliedAt: ISO8601
  changes: GraphChange[]
}

interface GraphChange {
  changeType: "NodeAdded" | "NodeModified" | "NodeDeleted" | "EdgeAdded" | "EdgeDeleted"
  nodeId?: NodeId
  edgeId?: EdgeId
  before?: KnowledgeNode | Edge
  after?: KnowledgeNode | Edge
}
```

### 9.2 `apply_incremental_update` Algorithm

```
ALGORITHM: IncrementalRecompiler.apply_incremental_update(patch: GraphPatch)

// Step 1: Apply patch to Knowledge Graph
FOR EACH change IN patch.changes:
  SWITCH change.changeType:
    CASE NodeAdded:    knowledgeGraph.addNode(change.after)
    CASE NodeModified: knowledgeGraph.updateNode(change.after)
    CASE NodeDeleted:  knowledgeGraph.removeNode(change.nodeId)
    CASE EdgeAdded:    knowledgeGraph.addEdge(change.after)
    CASE EdgeDeleted:  knowledgeGraph.removeEdge(change.edgeId)

// Step 2: Compute affected nodes
// A node is affected if:
// (a) it was directly changed, or
// (b) it depends on a changed node (transitively)
affectedNodes = Set()
FOR EACH change IN patch.changes:
  affectedNodes.add(change.nodeId ?? extractNodeId(change))
  // Propagate upstream: all nodes that depend on the changed node
  upstream = knowledgeGraph.allAncestors(change.nodeId, edgeTypes=["depends_on", "requires"])
  affectedNodes.addAll(upstream)

// Step 3: Invalidate CECs that reference affected nodes
invalidatedCECs = cecCache.values().filter(cec =>
  cec.provenance.graphTraversalPath.any(nodeId => affectedNodes.has(nodeId))
)

FOR EACH cec IN invalidatedCECs:
  cecCache.invalidate(cec.id)
  graphChangeTracker.markInvalidated(cec.id, patch.patchId)
  Emit Event("CECInvalidated", { cecId: cec.id, reason: patch.patchId })

// Step 4: Report
RETURN IncrementalUpdateResult {
  patchId: patch.patchId,
  affectedNodeCount: affectedNodes.size,
  invalidatedCECCount: invalidatedCECs.size,
  invalidatedCECIds: invalidatedCECs.map(c => c.id)
}
```

---

## 10. Subsystem 8: Runtime Validation

The Runtime Validator performs final pre-dispatch checks after CEC assembly and before sending to the Model Adapter.

### 10.1 `validate_pre_dispatch` Algorithm

```
ALGORITHM: RuntimeValidator.validate_pre_dispatch(
  cec: CompiledExecutionContext,
  targetModel: ModelDescriptor,
  config: RuntimeConfig
): ValidationResult

checks = []

// Check 1: CEC semantic invariants (LAS-008 §5)
invariantResult = CECVerifier.verify(cec)
checks.append(invariantResult)
IF NOT invariantResult.valid:
  RETURN ValidationResult { valid: false, failedChecks: [invariantResult] }

// Check 2: Token budget
tokenEstimate = adapter.estimateTokens(cec, targetModel)
IF tokenEstimate.total > targetModel.limits.contextWindowTokens:
  checks.append(Check { name: "TokenBudget", passed: false,
    message: "CEC exceeds model context window: " + tokenEstimate.total + " > " + targetModel.limits.contextWindowTokens })
  // Attempt compact mode
  compactCEC = CECCompactor.compact(cec)
  compactEstimate = adapter.estimateTokens(compactCEC, targetModel)
  IF compactEstimate.total <= targetModel.limits.contextWindowTokens:
    cec = compactCEC
    checks.append(Check { name: "CompactMode", passed: true, message: "CEC compacted to fit context window" })
  ELSE:
    RETURN ValidationResult { valid: false, failedChecks: checks }

// Check 3: Quality gate pre-flight (automated gates only)
FOR EACH gate IN cec.qualityGates WHERE gate.automatable == true:
  preFlightResult = QualityGateRunner.preflight(gate, config)
  IF NOT preFlightResult.passed AND gate.blocking:
    checks.append(Check { name: "QualityGate:" + gate.name, passed: false })

// Check 4: Adapter compatibility
adapterCompatibility = adapter.verifyCompatibility(cec, targetModel)
IF NOT adapterCompatibility.compatible:
  checks.append(Check { name: "AdapterCompatibility", passed: false,
    message: adapterCompatibility.reason })

// Check 5: Conflict warnings
IF cec.conflictWarnings.any(w => w.severity == "Critical"):
  checks.append(Check { name: "CriticalConflicts", passed: false,
    message: "CEC contains " + cec.conflictWarnings.filter(w => w.severity == "Critical").length + " critical unresolved conflicts" })

allPassed = checks.all(c => c.passed)
RETURN ValidationResult {
  valid: allPassed,
  passedChecks: checks.filter(c => c.passed),
  failedChecks: checks.filter(c => NOT c.passed),
  recommendation: allPassed ? "Dispatch" : determineRecommendation(checks)
}
```

---

## 11. Runtime APIs

The runtime exposes the following public interfaces for integration:

```typescript
// Primary runtime interface
interface IAetherRuntime {
  // Single-agent mission compilation
  compileMission(input: MissionInput, config: RuntimeConfig): Promise<CECBundle>

  // Multi-agent mission compilation with projections
  compileMissionForAgents(
    input: MissionInput,
    roles: Role[],
    config: RuntimeConfig
  ): Promise<AgentCECBundle>

  // Get a CEC by ID (from cache or recompile)
  getCEC(cecId: CECId): Promise<CompiledExecutionContext | null>

  // Invalidate a CEC explicitly
  invalidateCEC(cecId: CECId): Promise<void>

  // Apply a knowledge graph patch
  applyPatch(patch: GraphPatch): Promise<IncrementalUpdateResult>

  // Get runtime health and statistics
  getStats(): RuntimeStats
}

interface RuntimeStats {
  graphNodeCount: int
  graphEdgeCount: int
  cachedCECCount: int
  activeCompilations: int
  totalCompilations: int
  averageCompilationMs: float
  cacheHitRate: float
}
```

---

## 12. Error Handling

| Error Code | Description | Recovery |
|-----------|-------------|----------|
| `KRT-001` | Node cap reached during traversal | Increase maxNodes or narrow mission scope |
| `KRT-002` | Circular dependency detected | Review and break dependency cycle in source knowledge |
| `KRT-003` | Unresolvable dependency | Add missing node to Knowledge Graph |
| `KRT-004` | CEC token budget exceeded | Enable compact mode or reduce mission scope |
| `KRT-005` | CEC semantic invariant failure | Recompile graph or expand knowledge sources |
| `KRT-006` | Projection completeness failure | Ensure all outputs are assigned to at least one role |
| `KRT-007` | Knowledge Graph not loaded | Initialize runtime with compiled graph before calling compile() |
| `KRT-008` | Topological sort failure (cycle) | Circular dependency in optimization pass output |
| `KRT-009` | Cache corruption detected | Clear cache and recompile |

---

## 13. Runtime Lifecycle

```
┌──────────────────────────────────────────────────────────┐
│                   RUNTIME LIFECYCLE                       │
│                                                          │
│  [Startup]                                               │
│  1. Load compiled Knowledge Graph from disk              │
│  2. Validate graph integrity                             │
│  3. Initialize CEC cache                                 │
│  4. Register all adapters                                │
│  5. Ready                                                │
│                                                          │
│  [Per Mission]                                           │
│  1. Receive MissionInput                                 │
│  2. Check CEC cache (hit → return cached)                │
│  3. Mission Resolution                                   │
│  4. Graph Traversal                                      │
│  5. Dependency Resolution                                │
│  6. CEC Assembly (O1-O9 passes)                          │
│  7. CEC Verification (LAS-008 invariants)                │
│  8. [If multi-agent] Context Projection                  │
│  9. Execution Planning                                   │
│  10. Pre-dispatch Validation                             │
│  11. Hand off to Model Adapter (LAS-009)                 │
│                                                          │
│  [Knowledge Update]                                      │
│  1. Receive GraphPatch                                   │
│  2. Apply to Knowledge Graph                             │
│  3. Compute affected nodes                               │
│  4. Invalidate dependent CECs                            │
│  5. Emit invalidation events                             │
│                                                          │
│  [Shutdown]                                              │
│  1. Persist CEC cache                                    │
│  2. Flush diagnostics                                    │
│  3. Save graph state                                     │
└──────────────────────────────────────────────────────────┘
```
