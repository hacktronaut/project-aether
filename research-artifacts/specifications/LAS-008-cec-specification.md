# LAS-008 — Compiled Execution Context (CEC) Specification

**Document ID:** LAS-008  
**Title:** Compiled Execution Context  
**Version:** 0.1  
**Status:** Draft  
**Layer:** Compiled Execution Context (Layer 5)  
**Depends On:** LAS-003 (Knowledge Ontology), LAS-005 (Compiler Passes)  
**Used By:** LAS-009 (Model Adapter), LAS-010 (Runtime)

---

## 1. Purpose

This specification defines the **structure, lifecycle, semantic invariants, and verification protocol** of a Compiled Execution Context (CEC).

A CEC is the core output of the Knowledge Compiler. It is the bridge between the Enterprise Knowledge Graph and the execution engines (LLMs, agents, automation tools).

**A CEC is:**
- A mission-specific, precompiled, structured execution package
- The result of graph traversal + optimization over the Enterprise Knowledge Graph
- Independent of any specific LLM or execution engine
- A formal, verifiable artifact with a content hash

**A CEC is NOT:**
- A prompt
- A markdown document
- A snapshot of the full Knowledge Graph
- An instruction template

The analogy: a CEC is to knowledge what an executable binary is to source code — compiled, optimized, ready to run, requiring no further interpretation.

---

## 2. CEC Schema

### 2.1 Top-Level Structure

```typescript
interface CompiledExecutionContext {
  // --- Identity ---
  id: CECId                          // globally unique (UUID v4)
  version: SemVer                    // CEC schema version
  digest: ContentHash                // SHA-256 of normalized content (for integrity)

  // --- Header ---
  header: CECHeader

  // --- Mission ---
  mission: MissionDescriptor

  // --- Knowledge Content ---
  capabilities: CapabilityRef[]      // compiled Capability nodes
  constraints: ConstraintEntry[]     // all Mandatory and Recommended constraints
  patterns: PatternRef[]             // applicable patterns
  rules: RuleEntry[]                 // non-folded individual rules
  dependencies: DependencyEntry[]    // required technologies and libraries
  validationRules: ValidationEntry[] // quality and correctness requirements
  technologyStack: TechStackEntry[]  // specific technology choices
  examples: ExampleRef[]             // illustrative code or architecture examples
  qualityGates: QualityGateEntry[]   // measurable success criteria

  // --- Execution Guidance ---
  expectedOutputs: OutputSpec[]      // what must be produced
  successCriteria: SuccessCriterion[]// how to know when the mission is done
  executionHints: ExecutionHint[]    // ordering, sequencing, and approach guidance
  conflictWarnings: ConflictWarning[]// any unresolved conflicts (if O9 allowed them through)

  // --- Multi-Agent Support ---
  projections: Map<RoleId, CECProjection>  // role-specific context slices

  // --- Provenance ---
  provenance: Provenance
}
```

---

### 2.2 CEC Header

```typescript
interface CECHeader {
  schemaVersion: SemVer              // LAS-008 version used
  compiledAt: ISO8601                // when this CEC was compiled
  compiledBy: string                 // compiler version identifier
  sourceGraphId: string              // which Knowledge Graph this came from
  sourceGraphDigest: ContentHash     // hash of the source graph at compile time
  ontologyVersion: SemVer            // LAS-003 ontology version used
  passesRun: string[]                // list of optimization passes applied
  compressionStats: CompressionStats
}

interface CompressionStats {
  sourceDocumentCount: int           // number of source documents
  sourceNodeCount: int               // nodes in full graph
  optimizedNodeCount: int            // nodes in this CEC
  compressionRatio: float            // sourceNodeCount / optimizedNodeCount
  estimatedSourcePages: int
  tokenEstimate: int                 // approximate token count for CEC
}
```

---

### 2.3 Mission Descriptor

The Mission Descriptor formally captures **what this CEC is compiled for**. It is the execution goal specification.

```typescript
interface MissionDescriptor {
  id: MissionId
  title: string                      // human-readable mission title
  objective: string                  // what must be accomplished (structured prose)
  scope: MissionScope                // what is in-scope vs out-of-scope
  actor: RoleRef?                    // who/what is executing this mission
  preconditions: Condition[]         // what must be true before execution starts
  postconditions: Condition[]        // what must be true when mission is complete
  missionType: MissionType           // Implementation | Review | Test | Architecture | Documentation
  domainHints: string[]              // domain keywords that guided graph traversal
  priority: MissionPriority          // Critical | High | Normal | Low
}

interface MissionScope {
  included: string[]                 // explicitly included domains/topics
  excluded: string[]                 // explicitly excluded domains/topics
}

enum MissionType {
  Implementation,    // building new code or features
  Review,           // reviewing existing code or architecture
  TestGeneration,   // creating test suites
  ArchitectureDesign, // designing system architecture
  Documentation,    // generating documentation
  Refactoring,      // improving existing code structure
  SecurityAudit     // security-focused analysis
}
```

---

### 2.4 Capability Reference

Capabilities are included by reference in the CEC, with their content expandable on demand.

```typescript
interface CapabilityRef {
  capabilityId: NodeId               // references Capability node in Knowledge Graph
  name: string                       // e.g. "Authentication", "Logging"
  included: "full" | "partial"       // whether full or partial capability is relevant
  mandatoryRules: RuleRef[]          // mandatory rules within this capability
  recommendedRules: RuleRef[]        // recommended rules
  applicablePatterns: PatternRef[]   // patterns that realize this capability
  expandable: boolean                // whether execution engine can request full expansion
}
```

---

### 2.5 Constraint Entry

```typescript
interface ConstraintEntry {
  nodeId: NodeId
  name: string
  constraintType: ConstraintType
  directive: string                  // the actual constraint text (structured)
  impact: ImpactLevel
  enforcement: EnforcementLevel
  verification: string               // how compliance is verified
  source: SourceRef                  // trace to original document
}
```

---

### 2.6 Pattern Reference

```typescript
interface PatternRef {
  nodeId: NodeId
  name: string
  patternType: PatternType
  applicability: string              // when to apply this pattern
  structure: string                  // the structural template
  example: ExampleRef?               // concrete example if available
  alternatives: PatternRef[]         // alternative patterns (for agent decision-making)
}
```

---

### 2.7 Dependency Entry

```typescript
interface DependencyEntry {
  nodeId: NodeId
  name: string                       // library/framework name
  version: VersionConstraint         // e.g. "^3.2.0"
  ecosystem: string                  // e.g. "Java/Maven", "Node.js/npm"
  dependencyType: "Required" | "Optional" | "DevOnly"
  purpose: string                    // why this dependency is needed
}
```

---

### 2.8 Quality Gate Entry

```typescript
interface QualityGateEntry {
  nodeId: NodeId
  name: string
  gateType: GateType
  metric: Metric
  threshold: Threshold
  blocking: boolean                  // if false → advisory only
  measurement: string                // HOW to measure
  automatable: boolean               // if true → can be checked in CI/CD
}
```

---

### 2.9 Expected Outputs

```typescript
interface OutputSpec {
  name: string                       // e.g. "LoginController.java"
  artifactType: ArtifactType         // Code | Test | Config | Documentation | Schema
  required: boolean
  constraints: string[]              // constraints that apply to this output
  validatedBy: QualityGateRef[]      // which quality gates apply
  templateHint: string?              // structural template if applicable
}
```

---

### 2.10 Execution Hints

Execution hints guide the execution engine on *how* to approach the mission without constraining the output structure.

```typescript
interface ExecutionHint {
  hintType: HintType                 // Ordering | Approach | Priority | Warning | Dependency
  content: string                    // the hint text (structured)
  appliesTo: string[]                // which output specs this hint affects
  priority: int                      // ordering among hints (1 = first)
}

enum HintType {
  Ordering,      // "Implement Service before Controller"
  Approach,      // "Use top-down design"
  Priority,      // "Security constraints are non-negotiable"
  Warning,       // "Avoid X which conflicts with Y"
  Dependency     // "Output A must exist before Output B"
}
```

---

### 2.11 Conflict Warnings

If O9 (Conflict Resolution) allowed unresolved conflicts through, they appear here.

```typescript
interface ConflictWarning {
  conflictId: ConflictId
  conflictType: ConflictType
  involvedNodes: [NodeId, NodeId]
  description: string
  suggestedResolution: string
  severity: "Critical" | "Warning"
}
```

---

### 2.12 Provenance

```typescript
interface Provenance {
  sourceDocuments: SourceDocumentRef[]  // all documents that contributed
  graphTraversalPath: NodeId[]          // the traversal path that produced this CEC
  appliedOptimizations: OptimizationRecord[] // which O-passes ran and their effects
  compilationLog: CompilationLogEntry[] // detailed step-by-step compilation record
}

interface SourceDocumentRef {
  documentId: string
  documentPath: string
  contributedNodes: NodeId[]         // which nodes came from this document
}
```

---

## 3. CEC Lifecycle

The CEC lifecycle spans from source knowledge to artifact delivery.

```
┌────────────────────┐
│   Mission Input    │  (user provides: "Implement Login API")
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│  Runtime: Mission  │  (LAS-010: parse, classify, extract domain hints)
│  Resolution        │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│  Runtime: Graph    │  (LAS-010: BFS traversal from mission-relevant nodes)
│  Traversal         │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│  Compiler:         │  (LAS-005 O1-O9: reduce and optimize the subgraph)
│  Optimization      │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│  CEC Assembly      │  (this spec: assemble CECSchema from optimized subgraph)
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│  CEC Verification  │  (validate invariants, compute digest)
└─────────┬──────────┘
          │
          ├──────────────────────────┐
          │                          │ multi-agent projection
          ▼                          ▼
┌────────────────────┐    ┌─────────────────────┐
│  Model Adapter     │    │  Context Projection  │  (role-specific CEC slices)
│  (LAS-009)         │    │  (LAS-010)           │
└─────────┬──────────┘    └─────────┬───────────┘
          │                         │
          ▼                         ▼
┌────────────────────┐    ┌─────────────────────┐
│  Execution Engine  │    │  Per-Agent Execution │
└─────────┬──────────┘    └─────────────────────┘
          │
          ▼
┌────────────────────┐
│  Artifacts         │  (code, tests, docs, etc.)
└────────────────────┘
```

### Lifecycle States

| State | Description |
|-------|-------------|
| `Pending` | Mission received, compilation not yet started |
| `Compiling` | Compilation passes running |
| `Assembled` | CEC schema constructed, not yet verified |
| `Verified` | All invariants pass, digest computed |
| `Dispatched` | CEC handed to Model Adapter |
| `Executing` | Execution engine processing |
| `Complete` | All artifacts produced and quality gates passed |
| `Failed` | Compilation failed, invariant violated, or quality gate not met |
| `Invalidated` | Source knowledge changed, CEC must be recompiled |

---

## 4. Context Projection (Multi-Agent)

When multiple agents collaborate on a mission, each agent receives a **CECProjection** — a role-specific slice of the full CEC.

### 4.1 CECProjection Schema

```typescript
interface CECProjection {
  parentCECId: CECId                 // the full CEC this was projected from
  roleId: RoleId                     // which agent role this projection is for
  roleName: string                   // e.g. "BackendAgent", "SecurityAgent"
  
  // Projected subsets (only role-relevant nodes)
  capabilities: CapabilityRef[]
  constraints: ConstraintEntry[]
  patterns: PatternRef[]
  rules: RuleEntry[]
  dependencies: DependencyEntry[]
  expectedOutputs: OutputSpec[]      // only outputs this role produces
  qualityGates: QualityGateEntry[]   // only gates applicable to this role
  
  // Coordination context
  dependsOnProjections: RoleId[]     // other projections that must complete first
  providesToProjections: RoleId[]    // projections that depend on this one's output
}
```

### 4.2 Projection Algorithm

```
ALGORITHM: ProjectCEC(cec: CompiledExecutionContext, roles: Role[])

projections = {}

FOR EACH role IN roles:
  projection = CECProjection {
    parentCECId: cec.id,
    roleId: role.id,
    roleName: role.name
  }

  // Select capabilities relevant to this role
  projection.capabilities = cec.capabilities.filter(cap =>
    role.knowledgeDomains.intersects(cap.scope)
  )

  // Select constraints applicable to this role's scope
  projection.constraints = cec.constraints.filter(c =>
    c.scope.intersects(role.scope) OR c.scope == CrossCutting
  )

  // Select patterns used in this role's domain
  projection.patterns = cec.patterns.filter(p =>
    p.scope.intersects(role.scope)
  )

  // Select outputs this role produces
  projection.expectedOutputs = cec.expectedOutputs.filter(o =>
    role.responsibilities.any(r => o.artifactType.matches(r))
  )

  // Select quality gates applicable to this role's outputs
  projection.qualityGates = cec.qualityGates.filter(qg =>
    projection.expectedOutputs.any(o => o.validatedBy.has(qg.nodeId))
  )

  // Compute inter-projection dependencies
  projection.dependsOnProjections = computeDependencies(projection, projections)
  projection.providesToProjections = computeProvisions(projection, roles)

  projections[role.id] = projection

RETURN projections
```

### 4.3 Standard Role Projections

| Role | Receives |
|------|----------|
| `ArchitectAgent` | Architecture + Pattern + Decision + Technology nodes |
| `BackendAgent` | Mission + Repository + Service + REST + Logging + Validation + DTO nodes |
| `FrontendAgent` | Component + StateManagement + API Contract + UI Pattern nodes |
| `QAAgent` | Testing + ValidationRule + QualityGate + Coverage nodes |
| `SecurityAgent` | Policy + Security Constraint + Encryption + Authentication + Audit nodes |
| `DatabaseAgent` | Schema + Migration + Performance + DataAccess Pattern nodes |
| `DevOpsAgent` | Infrastructure + Deployment + Configuration + Monitoring nodes |

---

## 5. Semantic Invariants

A CEC must satisfy all of the following invariants to be considered **valid**. The verifier runs after CEC assembly and before dispatch.

### Invariant I1: Mission Completeness
Every capability referenced in the MissionDescriptor must have at least one entry in `capabilities[]`.

### Invariant I2: Constraint Closure
For every Capability in `capabilities[]`, all its Mandatory constraints must appear in `constraints[]`.

### Invariant I3: Dependency Completeness
For every Technology node referenced in `dependencies[]`, all its `requires`-linked Technology nodes must also appear in `dependencies[]`.

### Invariant I4: No Critical Unresolved Conflicts
`conflictWarnings[]` must contain no entries with `severity == "Critical"` (unless `config.allowCriticalConflictsInCEC == true`, which disables shipping to production).

### Invariant I5: Quality Gate Coverage
Every `expectedOutput` with `required == true` must be covered by at least one `QualityGateEntry` in `qualityGates[]`.

### Invariant I6: Non-Empty Mission
`mission.objective` must be non-empty. `mission.missionType` must be a valid MissionType.

### Invariant I7: Source Traceability
Every `ConstraintEntry` and `PatternRef` must have a non-null `source` field tracing to a source document.

### Invariant I8: Digest Validity
`digest` must equal `SHA-256(canonicalSerialize(cec excluding digest field))`.

### Invariant I9: Priority Consistency
No `ConstraintEntry` with `impact == Critical` may have `enforcement != Strict`.

### Invariant I10: Projection Completeness (multi-agent)
If `projections` is non-empty, the union of all projections' `expectedOutputs` must equal the full CEC's `expectedOutputs`.

---

## 6. CEC Verification Protocol

### 6.1 Verifier

```typescript
class CECVerifier {
  verify(cec: CompiledExecutionContext): VerificationResult

  private checkI1_MissionCompleteness(cec): InvariantResult
  private checkI2_ConstraintClosure(cec): InvariantResult
  private checkI3_DependencyCompleteness(cec): InvariantResult
  private checkI4_NoUnresolvedCriticalConflicts(cec): InvariantResult
  private checkI5_QualityGateCoverage(cec): InvariantResult
  private checkI6_NonEmptyMission(cec): InvariantResult
  private checkI7_SourceTraceability(cec): InvariantResult
  private checkI8_DigestValidity(cec): InvariantResult
  private checkI9_PriorityConsistency(cec): InvariantResult
  private checkI10_ProjectionCompleteness(cec): InvariantResult
}

interface VerificationResult {
  valid: boolean
  checkedAt: ISO8601
  failedInvariants: InvariantResult[]
  passedInvariants: InvariantResult[]
  recommendation: "Dispatch" | "FixConflicts" | "RecompileCEC" | "RecompileGraph"
}
```

### 6.2 Semantic Equivalence Verification

The verifier also checks **semantic equivalence** between the CEC and source knowledge: does the CEC faithfully represent the enterprise knowledge for this mission?

This is checked using a **coverage audit**:

```
ALGORITHM: VerifySemanticEquivalence(cec, knowledgeGraph, mission)

// Find all mission-relevant nodes in the full graph
missionRelevantNodes = findMissionRelevantNodes(knowledgeGraph, mission)
mandatoryNodes = missionRelevantNodes.filter(n => n.priority == "Mandatory")

// Every mandatory node must appear in the CEC (directly or via Capability fold)
coverageGaps = []
FOR EACH mandatoryNode IN mandatoryNodes:
  IF NOT cecCovers(cec, mandatoryNode):
    coverageGaps.append(mandatoryNode)

IF coverageGaps.length > 0:
  RETURN { covered: false, gaps: coverageGaps }
ELSE:
  RETURN { covered: true }
```

---

## 7. CEC Caching

CECs are deterministic. The same mission against the same Knowledge Graph always produces the same CEC (given the same compiler config). Therefore, CECs can be cached.

### Cache Key
```
cacheKey = SHA-256(
  mission.canonicalForm +
  knowledgeGraph.digest +
  compilerConfig.canonicalForm +
  ontologyVersion
)
```

### Cache Invalidation
A cached CEC is invalidated when:
1. The source Knowledge Graph is recompiled (new `knowledgeGraph.digest`)
2. The compiler configuration changes
3. The ontology version changes (LAS-003 minor or major version bump)
4. The CEC's own digest fails verification (corrupted cache)

---

## 8. CEC Serialization

### Wire Format (JSON)

The CEC is serialized to JSON for storage, transport, and adapter input. The canonical JSON format uses:
- camelCase field names
- ISO8601 timestamps
- Content hashes as hex strings
- NodeIds as `"namespace:identifier"` strings

### Binary Format

For high-performance scenarios, the CEC may be serialized using Protocol Buffers or MessagePack. The binary schema mirrors the JSON schema exactly.

### Minimal CEC (Compact Mode)

For low-latency scenarios, a Compact CEC omits Examples, Provenance, and expansion metadata, retaining only the execution-critical fields: mission, constraints, patterns, dependencies, expectedOutputs, successCriteria.

---

## 9. Example CEC (Abbreviated)

```json
{
  "id": "cec:a7f3b2c1-0023-44ef-a123-456789abcdef",
  "version": "0.1.0",
  "digest": "sha256:3a9e7f...",
  "header": {
    "compiledAt": "2026-07-17T13:00:00Z",
    "compiledBy": "kcc-0.1.0",
    "sourceGraphId": "graph:enterprise-backend",
    "compressionStats": {
      "sourceDocumentCount": 12,
      "sourceNodeCount": 380,
      "optimizedNodeCount": 43,
      "compressionRatio": 8.84,
      "estimatedSourcePages": 85
    }
  },
  "mission": {
    "id": "mission:impl-login-api",
    "title": "Implement Login API",
    "objective": "Build a JWT-authenticated REST login endpoint with rate limiting and audit logging",
    "missionType": "Implementation",
    "domainHints": ["Authentication", "REST", "Security", "Logging", "Repository"]
  },
  "capabilities": [
    { "name": "Authentication", "included": "full" },
    { "name": "RESTful API", "included": "partial" },
    { "name": "Audit Logging", "included": "full" }
  ],
  "constraints": [
    { "name": "Use JWT", "directive": "MUST use JWT for token-based authentication", "impact": "Critical", "enforcement": "Strict" },
    { "name": "No Business Logic in Controller", "directive": "Controller MUST NOT contain business logic", "impact": "High", "enforcement": "Strict" },
    { "name": "Rate Limiting Required", "directive": "MUST apply rate limiting on all authentication endpoints", "impact": "Critical", "enforcement": "Strict" }
  ],
  "patterns": [
    { "name": "Repository Pattern", "patternType": "Design" },
    { "name": "Service Layer Pattern", "patternType": "Architectural" },
    { "name": "DTO Pattern", "patternType": "Design" }
  ],
  "dependencies": [
    { "name": "spring-security", "version": "^6.2.0", "dependencyType": "Required" },
    { "name": "jjwt", "version": "^0.11.5", "dependencyType": "Required" },
    { "name": "spring-data-jpa", "version": "^3.2.0", "dependencyType": "Required" }
  ],
  "expectedOutputs": [
    { "name": "AuthController", "artifactType": "Code", "required": true },
    { "name": "AuthService", "artifactType": "Code", "required": true },
    { "name": "UserRepository", "artifactType": "Code", "required": true },
    { "name": "LoginRequestDTO", "artifactType": "Code", "required": true },
    { "name": "AuthControllerTest", "artifactType": "Test", "required": true }
  ],
  "qualityGates": [
    { "name": "Test Coverage", "metric": { "name": "Line Coverage", "operator": ">=", "value": 80, "unit": "%" }, "blocking": true },
    { "name": "No Direct DB in Controller", "metric": { "name": "SQL in Controller", "operator": "=", "value": 0, "unit": "occurrences" }, "blocking": true }
  ]
}
```
