# LAS-003 — Knowledge Ontology Specification

**Document ID:** LAS-003  
**Title:** Knowledge Ontology  
**Version:** 0.1  
**Status:** Draft  
**Layer:** Knowledge Graph (Layer 3)  
**Depends On:** None (foundational)  
**Used By:** LAS-005, LAS-008, LAS-009, LAS-010

---

## 1. Purpose

This specification defines the **formal type system** for all knowledge entities in Project Aether. It is the ontological foundation upon which the Knowledge Compiler, Knowledge Graph, Compiled Execution Context, and all adapters are built.

Every other specification in the LAS series references the types, properties, and relations defined here. This document must be read first.

---

## 2. Design Principles

1. **Typed, not textual.** Every knowledge artifact has a formal type. No untyped blobs.
2. **Relations are first-class.** Relationships between knowledge nodes are explicitly typed — they are not implicit from proximity or embedding similarity.
3. **Priority is mandatory.** Every node carries an explicit priority level. There are no "implied" priorities.
4. **Scope is explicit.** Every node declares its applicability domain.
5. **Conflict is detectable.** The ontology must enable programmatic conflict detection between any two nodes.
6. **Traceable to source.** Every node traces back to its source document and location.
7. **Versioned.** The ontology supports evolution. Nodes can supersede or deprecate other nodes.

---

## 3. Node Type Hierarchy

### 3.1 Abstract Base Type

All knowledge nodes derive from a single abstract base type.

```
KnowledgeNode (abstract)
├── id: NodeId                    // globally unique identifier
├── version: SemVer               // node version
├── sourceRef: SourceReference    // origin document + location
├── created_at: ISO8601           // compilation timestamp
├── updated_at: ISO8601           // last update timestamp
├── status: NodeStatus            // Active | Deprecated | Experimental | Draft
├── stability: StabilityLevel     // Stable | Unstable | Evolving
├── priority: Priority            // Mandatory | Recommended | Optional | Informational | Deprecated
├── scope: Scope[]                // applicability domains
├── tags: string[]                // free-form labels for tooling
├── edges: Edge[]                 // typed relationships to other nodes
├── confidence: float [0.0–1.0]   // compiler's extraction confidence
└── annotations: Annotation[]     // key-value metadata extensions
```

### 3.2 Concrete Node Types

The ontology defines **12 concrete knowledge node types**.

---

#### 3.2.1 Rule

Represents a **mandatory or recommended behavioral directive** — a specific instruction about how code, architecture, or processes must be structured.

```
Rule extends KnowledgeNode {
  category: RuleCategory          // Architectural | Implementation | Style | Security | Quality
  applicability: Applicability    // when this rule applies (condition predicate)
  enforcement: EnforcementLevel   // Strict | Linting | Convention
  examples: Example[]             // concrete illustrations
  rationale: string               // why this rule exists
  exceptions: string[]            // documented exception cases
}
```

**RuleCategory Values:**
- `Architectural` — Structural decisions (e.g. "Use layered architecture")
- `Implementation` — Code-level directives (e.g. "Use Repository Pattern")
- `Style` — Formatting and naming (e.g. "Use camelCase for variables")
- `Security` — Security-specific mandates (e.g. "Never log passwords")
- `Quality` — Quality and testing rules (e.g. "Minimum 80% coverage")

**EnforcementLevel Values:**
- `Strict` — Violation is a build/compile error
- `Linting` — Violation is a lint warning
- `Convention` — Advisory only; violation noted but not blocking

**Example node:**
```json
{
  "id": "rule:repository-pattern",
  "version": "1.0.0",
  "category": "Implementation",
  "priority": "Mandatory",
  "scope": ["Backend"],
  "applicability": "when: layer = DataAccess",
  "enforcement": "Strict",
  "rationale": "Decouples business logic from persistence concerns",
  "edges": [
    { "type": "conflicts_with", "target": "rule:direct-db-access" },
    { "type": "implements", "target": "pattern:repository" }
  ]
}
```

---

#### 3.2.2 Constraint

Represents a **hard boundary** — an invariant that must never be violated. Constraints differ from Rules in that they are non-negotiable; there are no exceptions.

```
Constraint extends KnowledgeNode {
  constraintType: ConstraintType  // Structural | Behavioral | Temporal | Resource | Security
  violation: ViolationSpec        // what constitutes a violation
  verificationMethod: string      // how compliance is checked
  impact: ImpactLevel             // Critical | High | Medium | Low
}
```

**ConstraintType Values:**
- `Structural` — Code structure constraints (e.g. "Controllers must not contain SQL")
- `Behavioral` — Runtime behavioral constraints (e.g. "All API calls must be idempotent")
- `Temporal` — Timing constraints (e.g. "Response time must be < 200ms")
- `Resource` — Resource usage constraints (e.g. "Memory allocation must not exceed 512MB")
- `Security` — Security invariants (e.g. "All secrets must be stored in Vault, never in code")

---

#### 3.2.3 Pattern

Represents a **reusable structural solution** to a recurring engineering problem. Patterns describe structure, not behavior.

```
Pattern extends KnowledgeNode {
  patternType: PatternType        // Architectural | Design | Integration | Data | Security
  structure: PatternStructure     // formal description of participants and relationships
  applicability: string           // when to use this pattern
  consequences: string[]          // trade-offs of using this pattern
  alternatives: NodeId[]          // alternative patterns
  examples: Example[]             // concrete code/architecture examples
  language_hints: LanguageHint[]  // language/framework-specific implementation notes
}
```

**PatternType Values:**
- `Architectural` — High-level patterns (MVC, Hexagonal, Event Sourcing)
- `Design` — Class/object-level patterns (Repository, Factory, Observer)
- `Integration` — System integration patterns (Circuit Breaker, Saga, Outbox)
- `Data` — Data management patterns (CQRS, UnitOfWork, Specification)
- `Security` — Security patterns (Token Validation, Defense in Depth)

---

#### 3.2.4 Capability

Represents a **compound skill cluster** — a named, cohesive grouping of rules, patterns, and constraints that together implement a recognized engineering capability. Capabilities are the result of the Capability Folding optimization pass.

```
Capability extends KnowledgeNode {
  capabilityType: string          // domain identifier (Authentication, Logging, Caching, etc.)
  components: NodeId[]            // rules, patterns, constraints that form this capability
  entryPoints: NodeId[]           // where this capability begins in the graph
  interfaces: Interface[]         // what other capabilities depend on
  requiredBy: NodeId[]            // which capabilities require this one
  optional: boolean               // whether this capability is electively included
}
```

**Why Capabilities matter:** Instead of including 12 individual JWT/authentication rules in a CEC, the compiler folds them into a single `Authentication` Capability node, then expands it only when needed. This is the primary semantic compression mechanism.

---

#### 3.2.5 Workflow

Represents an **ordered sequence of engineering activities** — how work flows through a development process. Workflows define execution structure, not content.

```
Workflow extends KnowledgeNode {
  workflowType: WorkflowType      // Development | Review | Deployment | Testing | Incident
  steps: WorkflowStep[]           // ordered steps
  parallelizable: boolean         // whether steps can run in parallel
  entryConditions: Condition[]    // what must be true before starting
  exitConditions: Condition[]     // what must be true on completion
  roles: NodeId[]                 // which Role nodes participate
  qualityGates: NodeId[]          // QualityGate nodes at each checkpoint
}

WorkflowStep {
  order: int
  name: string
  actor: NodeId                   // Role performing this step
  inputs: NodeId[]                // nodes consumed
  outputs: NodeId[]               // nodes produced
  tools: NodeId[]                 // Tool nodes used
  optional: boolean
}
```

---

#### 3.2.6 Decision

Represents an **Architecture Decision Record (ADR)**-style knowledge node — a choice made with its context, rationale, alternatives considered, and consequences. Decisions are immutable once made; they can only be superseded.

```
Decision extends KnowledgeNode {
  decisionId: string              // ADR-style identifier (e.g. ADR-0012)
  context: string                 // why this decision was needed
  decisionText: string            // what was decided
  rationale: string               // why this option was chosen
  alternatives: Alternative[]     // other options considered
  consequences: string[]          // known trade-offs and implications
  participants: string[]          // who was involved
  decidedAt: ISO8601              // when the decision was made
  supersedes: NodeId[]            // previous decisions this replaces
}

Alternative {
  description: string
  rejectionReason: string
}
```

---

#### 3.2.7 Policy

Represents an **organizational or compliance mandate** — a rule imposed by legal, regulatory, organizational, or security requirements. Policies have the highest authority level and override conflicting rules.

```
Policy extends KnowledgeNode {
  policySource: PolicySource      // Regulatory | Organizational | Security | Legal | Technical
  authority: AuthorityLevel       // Absolute | Override | Standard
  complianceFramework: string[]   // GDPR, SOC2, ISO27001, PCI-DSS, etc.
  enforcement: string             // how compliance is verified
  auditRequired: boolean          // whether this policy requires audit trails
  violationImpact: string         // consequences of violation
}
```

**Note:** Policy nodes with `authority: Absolute` cannot be overridden by any Rule or Constraint. The Conflict Detector treats conflicts between a Policy and any lower-authority node as **Policy Wins** automatically.

---

#### 3.2.8 Technology

Represents a **framework, library, tool, platform, or language** reference. Technology nodes are used by the compiler to build the dependency graph and by the CEC to specify required implementations.

```
Technology extends KnowledgeNode {
  techType: TechType              // Language | Framework | Library | Platform | Database | Tool
  ecosystem: string               // Java, Node.js, Python, etc.
  version: VersionConstraint      // e.g. "^17.0" or ">=3.10,<4.0"
  alternatives: NodeId[]          // alternative technologies
  deprecated: boolean             // whether this tech is being phased out
  replacement: NodeId             // what replaces it if deprecated
  officialDocs: string            // URL to official documentation
}
```

---

#### 3.2.9 Example

Represents a **concrete code, architecture diagram, or artifact** that illustrates a rule, pattern, or capability in practice.

```
Example extends KnowledgeNode {
  exampleType: ExampleType        // CodeSnippet | ArchitectureDiagram | ConfigFile | TestCase
  language: string                // programming language if applicable
  content: string                 // the actual content
  illustrates: NodeId[]           // which rules/patterns this demonstrates
  antiExample: boolean            // whether this shows what NOT to do
  verified: boolean               // whether this has been tested/validated
}
```

---

#### 3.2.10 QualityGate

Represents a **measurable success criterion** that must be satisfied for a mission to be considered complete.

```
QualityGate extends KnowledgeNode {
  gateType: GateType              // Coverage | Performance | Security | Compliance | Review
  metric: Metric                  // what is measured
  threshold: Threshold            // the pass/fail boundary
  measurement: string             // how to measure it
  blocking: boolean               // whether failing this gate blocks delivery
  automated: boolean              // whether it can be verified automatically
}

Metric {
  name: string
  unit: string
  operator: enum(>=, <=, =, !=, >, <)
  value: number | string
}
```

---

#### 3.2.11 Role

Represents an **actor** — a human or AI agent that participates in engineering workflows.

```
Role extends KnowledgeNode {
  roleType: RoleType              // Human | AIAgent | System | External
  responsibilities: string[]      // what this role is responsible for
  permissions: Permission[]       // what this role can read/write/execute
  knowledgeDomains: NodeId[]      // which Capability and Policy nodes this role operates in
  tools: NodeId[]                 // Tool nodes this role can use
}
```

---

#### 3.2.12 APIContract

Represents an **interface specification** — an API, schema, or protocol contract that defines boundaries between systems.

```
APIContract extends KnowledgeNode {
  contractType: ContractType      // REST | GraphQL | gRPC | AsyncAPI | Schema | Protocol
  specFormat: string              // OpenAPI, Avro, Protobuf, JSON Schema, etc.
  spec: string                    // the contract definition (inline or reference)
  version: string                 // contract version
  compatibility: CompatibilityMode // BackwardCompatible | BreakingChange | Additive
  consumers: string[]             // known consumers of this contract
  producers: string[]             // producers of this contract
}
```

---

## 4. Edge Type Definitions

The Knowledge Graph uses **typed directed edges** between nodes. Each edge type has formal semantics.

### 4.1 Edge Base Type

```
Edge {
  id: EdgeId
  type: EdgeType                  // one of the 14 types defined below
  source: NodeId                  // origin node
  target: NodeId                  // destination node
  weight: float [0.0–1.0]         // relationship strength (used in traversal scoring)
  bidirectional: boolean          // whether the inverse relation is also implied
  conditions: Condition[]         // conditions under which this edge is active
  derivedFrom: SourceReference    // where in the source document this was found
}
```

### 4.2 Edge Types

| Edge Type | Semantic Meaning | Inverse Implied? | Example |
|-----------|-----------------|------------------|---------|
| `requires` | Source cannot function without target | No | `Authentication` requires `JWT` |
| `depends_on` | Source uses target as a dependency | No | `UserService` depends_on `UserRepository` |
| `implements` | Source is a realization of target | No | `JWTService` implements `AuthenticationCapability` |
| `extends` | Source adds behavior to target | No | `OAuth2Rule` extends `AuthenticationRule` |
| `specializes` | Source is a specific case of target | No | `REST-DELETE-Rule` specializes `HTTP-Method-Rule` |
| `conflicts_with` | Source and target cannot coexist | Yes | `use-JWT` conflicts_with `use-OAuth` |
| `validates` | Source is a verification mechanism for target | No | `UnitTest` validates `RepositoryPattern` |
| `produces` | Source creates target as output | No | `Workflow:CodeGen` produces `Artifact:Code` |
| `consumes` | Source takes target as input | No | `ModelAdapter` consumes `CEC` |
| `replaces` | Source is the recommended replacement for target | No | `ServiceMesh` replaces `DirectHTTP` |
| `supersedes` | Source obsoletes target (versioning) | No | `Rule:JWT-v2` supersedes `Rule:JWT-v1` |
| `related_to` | Soft association (no direction imposed) | Yes | `Logging` related_to `AuditPolicy` |
| `exemplifies` | Source is a concrete example of target | No | `LoginControllerExample` exemplifies `ThinControllerRule` |
| `enforced_by` | Source rule is enforced by target mechanism | No | `CoverageRule` enforced_by `JacocoTool` |

### 4.3 Edge Traversal Weights

Default weights for path-scoring during graph traversal:

| Edge Type | Default Weight | Reason |
|-----------|---------------|---------|
| `requires` | 1.0 | Hard dependency — always traverse |
| `depends_on` | 0.95 | Near-mandatory |
| `implements` | 0.9 | Strong structural link |
| `validates` | 0.85 | Strongly related to correctness |
| `conflicts_with` | 1.0 | Always traverse to detect conflicts |
| `extends` | 0.8 | Inherit parent context |
| `specializes` | 0.75 | Conditional relevance |
| `produces` | 0.7 | Output tracking |
| `consumes` | 0.7 | Input tracking |
| `exemplifies` | 0.6 | Context enrichment |
| `replaces` | 0.8 | Follow deprecation chains |
| `supersedes` | 0.9 | Always follow versioning |
| `related_to` | 0.4 | Weak association, traversed last |
| `enforced_by` | 0.5 | Tool references, optional in CEC |

---

## 5. Property Schemas

### 5.1 Priority System

Priority is a **5-level ordered hierarchy** with formal precedence rules.

```
Priority := Mandatory | Recommended | Optional | Informational | Deprecated

Precedence order (highest to lowest):
  Mandatory (5) > Recommended (4) > Optional (3) > Informational (2) > Deprecated (1)
```

**Formal Semantics:**

| Level | Meaning | CEC Inclusion | Override Allowed? |
|-------|---------|--------------|-------------------|
| `Mandatory` | Must be followed; violation is a failure | Always included | Never |
| `Recommended` | Should be followed; deviation requires justification | Included by default | With documented justification |
| `Optional` | May be followed; included when relevant | Included when in scope | Yes, freely |
| `Informational` | Context only; no enforcement | Not included in CEC | N/A |
| `Deprecated` | No longer valid; present for history only | Never included | N/A |

**Priority Inheritance Rule:**  
When node A has edge `requires` → node B, and A is `Mandatory`, then B is treated as at least `Recommended` for the same scope, even if B's own priority is lower.

**Priority Resolution Rule (Conflict):**  
When two conflicting nodes have different priorities, the higher priority node wins. When they have equal priority, the conflict is flagged for human resolution.

### 5.2 Scope System

Scope defines the **applicability domain** of a knowledge node.

```
Scope := Backend | Frontend | Security | Infrastructure | Testing |
         DataAccess | Integration | DevOps | Documentation | CrossCutting

CrossCutting applies to all domains.
```

**Scope Inheritance:**  
A node with scope `Backend` applies to all nodes within the Backend domain. A node with scope `CrossCutting` applies regardless of domain.

**Scope Intersection:**  
If a mission involves multiple scopes, nodes from all intersecting scopes are eligible for CEC inclusion. The compiler resolves scope conflicts using the Conflict Detector.

### 5.3 NodeStatus

```
NodeStatus := Active | Deprecated | Experimental | Draft | Archived

Active      → Currently valid and in use
Deprecated  → Being phased out; replacement should be preferred
Experimental → Not yet stable; may change without notice
Draft       → Under review; not yet approved for use
Archived    → Historically preserved; not for new use
```

### 5.4 SourceReference

Every node traces back to its origin.

```
SourceReference {
  documentId: string              // unique document identifier
  documentPath: string            // file path or URL
  documentType: DocType           // Markdown | YAML | JSON | PDF | Git | KDL
  location: SourceLocation        // line/section reference
  extractedBy: string             // pass that extracted this node (e.g. "KnowledgeExtractor")
  extractedAt: ISO8601
  confidence: float               // extraction confidence [0.0–1.0]
}
```

---

## 6. Conflict Detection

The ontology defines **formal conflict predicates** — conditions under which two nodes are in semantic conflict. These are evaluated by Pass 5 (Conflict Detector).

### 6.1 Conflict Types

| Conflict Type | Predicate | Example |
|--------------|-----------|---------|
| `DirectConflict` | Edge `conflicts_with` exists between A and B | `use-JWT` conflicts_with `use-BasicAuth` |
| `PriorityConflict` | A and B have same scope, same applicability, incompatible directives, equal priority | Both Mandatory but mutually exclusive |
| `VersionConflict` | Two Technology nodes for same library but incompatible version constraints | Spring Boot ^2.x vs Spring Boot ^3.x |
| `ScopeOverlap` | Two nodes have contradictory directives within an overlapping scope | Security rule says "encrypt all DB fields" vs Performance rule says "store as plaintext for speed" |
| `InheritanceConflict` | A extends B, but A's directive contradicts B's directive | Child rule overrides parent in incompatible way |

### 6.2 Conflict Resolution Strategy

```
ConflictResolution := AutoResolved | FlaggedForHuman | Suppressed | Merged

AutoResolved  → Higher-priority node wins; lower-priority is demoted to Informational
FlaggedForHuman → Equal-priority conflict; human must choose
Suppressed    → One node explicitly supersedes the other
Merged        → Two nodes are semantically equivalent and merged into one
```

### 6.3 Conflict Report Schema

```
ConflictReport {
  id: ConflictId
  type: ConflictType
  nodes: [NodeId, NodeId]
  severity: Critical | Warning | Info
  resolution: ConflictResolution
  resolvedBy: NodeId?             // which node won (if AutoResolved)
  flaggedAt: ISO8601
  humanNote: string?              // human-added resolution rationale
}
```

---

## 7. Knowledge Definition Language (KDL) — Grammar Sketch

KDL is the **human-authored input language** for creating knowledge nodes directly (as an alternative to compiling from markdown). It is optional — the compiler can also extract nodes from existing markdown. KDL is for teams that want to author knowledge natively in a structured format.

### 7.1 Design Goals

- Readable by engineers (not just machine-parseable)
- Concise — less verbose than JSON or XML
- Expressive enough to capture all 12 node types
- Embeddable in existing project directories

### 7.2 EBNF Grammar

```ebnf
knowledge-file      ::= header node-definition*
header              ::= "@knowledge" identifier "{" header-props "}"
header-props        ::= (version-prop | scope-prop | author-prop)*
version-prop        ::= "version" ":" semver
scope-prop          ::= "scope" ":" scope-list
author-prop         ::= "author" ":" string

node-definition     ::= node-type identifier "{" node-body "}"
node-type           ::= "Rule" | "Constraint" | "Pattern" | "Capability" |
                        "Workflow" | "Decision" | "Policy" | "Technology" |
                        "Example" | "QualityGate" | "Role" | "APIContract"

node-body           ::= property-assignment* edge-block? annotation-block?

property-assignment ::= identifier ":" value
value               ::= string | number | boolean | enum-value | 
                        list | inline-block

edge-block          ::= "edges" "{" edge-definition* "}"
edge-definition     ::= edge-type "->" identifier ("{" edge-props "}")?
edge-type           ::= "requires" | "depends_on" | "implements" | "extends" |
                        "specializes" | "conflicts_with" | "validates" |
                        "produces" | "consumes" | "replaces" | "supersedes" |
                        "related_to" | "exemplifies" | "enforced_by"
edge-props          ::= ("weight" ":" float)? ("conditions" ":" condition-list)?

annotation-block    ::= "annotations" "{" (identifier ":" value)* "}"

identifier          ::= [a-zA-Z_][a-zA-Z0-9_-]*
string              ::= '"' [^"]* '"' | '"""' [^]* '"""'
number              ::= [0-9]+ ("." [0-9]+)?
boolean             ::= "true" | "false"
enum-value          ::= identifier
list                ::= "[" (value ("," value)*)? "]"
semver              ::= number "." number "." number
```

### 7.3 KDL Example

```kdl
@knowledge auth-module {
  version: "1.2.0"
  scope: [Backend, Security]
  author: "platform-team"
}

Rule use-jwt {
  priority: Mandatory
  category: Security
  enforcement: Strict
  rationale: "JWT provides stateless authentication compatible with our microservice architecture"
  applicability: "when: feature = Authentication"

  edges {
    conflicts_with -> rule:use-basic-auth { weight: 1.0 }
    implements -> capability:authentication
    requires -> technology:spring-security { weight: 0.95 }
  }
}

Constraint no-plaintext-credentials {
  priority: Mandatory
  constraintType: Security
  impact: Critical
  violation: "Any string matching password pattern stored without encryption"
  verificationMethod: "Static analysis via SAST tooling"

  edges {
    enforced_by -> tool:sonarqube
    enforced_by -> tool:semgrep
  }
}

Pattern repository-pattern {
  priority: Mandatory
  patternType: Design
  applicability: "when: layer = DataAccess"
  rationale: "Decouples persistence logic from domain logic"

  edges {
    requires -> technology:jpa
    conflicts_with -> rule:direct-db-access
  }
}

Capability authentication {
  components: [rule:use-jwt, constraint:no-plaintext-credentials, pattern:token-validation]
  optional: false
}
```

---

## 8. Serialization Format

The Knowledge Graph persists nodes in JSON. The canonical serialized form of a node:

```json
{
  "id": "rule:use-jwt",
  "type": "Rule",
  "version": "1.2.0",
  "status": "Active",
  "stability": "Stable",
  "priority": "Mandatory",
  "scope": ["Backend", "Security"],
  "confidence": 0.97,
  "tags": ["authentication", "stateless", "security"],
  "properties": {
    "category": "Security",
    "enforcement": "Strict",
    "applicability": "when: feature = Authentication",
    "rationale": "JWT provides stateless authentication compatible with our microservice architecture"
  },
  "edges": [
    {
      "type": "conflicts_with",
      "target": "rule:use-basic-auth",
      "weight": 1.0,
      "bidirectional": true
    },
    {
      "type": "implements",
      "target": "capability:authentication",
      "weight": 0.9,
      "bidirectional": false
    }
  ],
  "sourceRef": {
    "documentId": "doc:security-standards",
    "documentPath": "standards/security.md",
    "documentType": "Markdown",
    "location": { "line": 42, "section": "Authentication Rules" },
    "extractedBy": "KnowledgeExtractor",
    "extractedAt": "2026-07-17T13:00:00Z",
    "confidence": 0.97
  },
  "created_at": "2026-07-17T13:00:00Z",
  "updated_at": "2026-07-17T13:00:00Z"
}
```

---

## 9. Ontology Versioning

The ontology itself is versioned. When node types are added, renamed, or deprecated, the ontology version is bumped according to semantic versioning:

- **Patch** (0.0.x): Fixing property descriptions, adding optional annotation fields
- **Minor** (0.x.0): Adding new node types or edge types (backward compatible)
- **Major** (x.0.0): Renaming node types, changing property schemas (breaking)

All compiled Knowledge Graphs embed the ontology version they were compiled against. When the ontology changes, affected graphs must be recompiled.

---

## 10. Summary

| Category | Count | Items |
|----------|-------|-------|
| Node Types | 12 | Rule, Constraint, Pattern, Capability, Workflow, Decision, Policy, Technology, Example, QualityGate, Role, APIContract |
| Edge Types | 14 | requires, depends_on, implements, extends, specializes, conflicts_with, validates, produces, consumes, replaces, supersedes, related_to, exemplifies, enforced_by |
| Priority Levels | 5 | Mandatory, Recommended, Optional, Informational, Deprecated |
| Scope Domains | 10 | Backend, Frontend, Security, Infrastructure, Testing, DataAccess, Integration, DevOps, Documentation, CrossCutting |
| Conflict Types | 5 | DirectConflict, PriorityConflict, VersionConflict, ScopeOverlap, InheritanceConflict |
