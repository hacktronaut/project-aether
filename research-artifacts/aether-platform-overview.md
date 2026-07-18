# Project Aether — Platform Overview

## A Knowledge Computing Platform for AI-Native Software Engineering

**Document ID:** AETHER-OVERVIEW-001  
**Version:** 0.1  
**Layer:** Conceptual

---

## 1. The Problem We Are Solving

Every team that uses AI for software engineering eventually hits the same wall.

The documentation grows. The prompts grow. The context windows fill up. Different engineers prompt the LLM differently and get different results. The same rules are written in five different markdown files. When the architecture changes, nobody knows which prompts are now outdated. The LLM keeps re-reading 200 pages of documentation every time someone asks it to implement a feature.

This is not a prompt engineering problem.

**This is a knowledge representation problem.**

The fundamental issue is that enterprise engineering knowledge — architecture decisions, coding standards, security policies, design patterns, dependency rules, quality gates — is stored as **human-readable prose** and consumed by the LLM as **raw text**. There is no structure. There is no compilation. There is no optimization. Every inference call starts from scratch.

This is equivalent to a world where compilers never existed — where every time you wrote a C program, you had to manually write machine code for the target processor.

**Project Aether introduces the missing compiler.**

---

## 2. The Core Idea in One Paragraph

Project Aether is a **Knowledge Computing Platform** that treats enterprise engineering knowledge the way a compiler treats source code. Knowledge is authored once in structured form, compiled into a normalized Knowledge Graph, optimized by deterministic compiler passes, assembled into a mission-specific **Compiled Execution Context (CEC)**, and then rendered by a **Model Adapter** into the exact format required by whatever AI execution engine is being used — GPT, Claude, Gemini, a local model, or an agent framework. The LLM never reads raw documentation again. It only ever receives a clean, pre-compiled, mission-specific execution package.

---

## 3. The Computing Model

```
┌─────────────────────────────────────────────────────────────┐
│                    KNOWLEDGE SOURCES                         │
│  README · Specs · ADRs · Standards · Policies · Examples    │
└───────────────────────────┬─────────────────────────────────┘
                            │ compile once
                            ▼
┌─────────────────────────────────────────────────────────────┐
│               KNOWLEDGE COMPILER (KCC)                       │
│                                                              │
│  Pass 1: Document Parser     → AST                           │
│  Pass 2: Knowledge Extractor → Nodes                         │
│  Pass 3: Relationship Disc.  → Edges                         │
│  Pass 4: Ontology Mapper     → Normalized Types              │
│  Pass 5: Conflict Detector   → Conflict Report               │
│  Pass 6: Knowledge Normalizer→ Deduplicated Graph            │
│  Pass 7: Graph Constructor   → Knowledge Graph               │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│             ENTERPRISE KNOWLEDGE GRAPH                       │
│                                                              │
│  Nodes: Rule · Pattern · Constraint · Capability ·          │
│         Workflow · Decision · Policy · Technology ·          │
│         Example · QualityGate · Role · APIContract           │
│                                                              │
│  Edges: requires · implements · conflicts_with ·             │
│         validates · produces · depends_on · extends          │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              OPTIMIZATION PASSES                             │
│                                                              │
│  O1: Dead Knowledge Elimination                              │
│  O2: Duplicate Rule Folding                                  │
│  O3: Capability Folding                                      │
│  O4: Context Compression    (500 nodes → 37 nodes)           │
│  O5: Rule Inlining                                           │
│  O6: Priority Resolution                                     │
│  O7: Dependency Closure                                      │
│  O8: Semantic Compression   (100 pages → 42 exec nodes)      │
│  O9: Conflict Resolution                                     │
└───────────────────────────┬─────────────────────────────────┘
                            │ mission-specific compilation
                            ▼
┌─────────────────────────────────────────────────────────────┐
│           COMPILED EXECUTION CONTEXT (CEC)                   │
│                                                              │
│  Mission · Capabilities · Constraints · Patterns ·           │
│  Dependencies · Validation Rules · Technology Stack ·        │
│  Expected Outputs · Success Criteria                         │
│                                                              │
│  [NOT a prompt. NOT markdown. A structured execution pkg]    │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   MODEL ADAPTER (MA)                         │
│                                                              │
│  Input:  CEC + Model Metadata + Execution Profile +          │
│          Agent Role + Tool Registry + Runtime Config         │
│                                                              │
│  Output: Provider-specific Execution Package                 │
│          ├── OpenAI: system/developer/user + tools           │
│          ├── Anthropic: system/messages + tool schema        │
│          ├── MCP: messages + resources + tool calls          │
│          └── Agent: context + memory + goals + plan          │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│               EXECUTION ENGINE                               │
│   GPT · Claude · Gemini · Llama · Agent Frameworks           │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      ARTIFACTS                               │
│   Code · Tests · Documentation · Architecture · Reviews      │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. How the Platform Changes the Developer Experience

### Before Project Aether (Current State)

```
Developer thinks of a task
        ↓
Manually collects relevant docs
(README, architecture.md, coding-rules.md, patterns.md, security.md)
        ↓
Writes a prompt embedding all of this
        ↓
Sends to LLM (2000–8000 tokens of context)
        ↓
Gets code that may or may not follow the architecture
        ↓
Reviews manually to check compliance
        ↓
Repeats for every task (no reuse of this work)
```

**Problems:**
- Every developer does this differently
- No traceability (which rule produced which code?)
- Knowledge lives in prompts, not in a structured form
- Changing one architecture decision requires updating prompts everywhere
- Context windows waste tokens on irrelevant information

---

### After Project Aether

```
Developer describes the mission
(e.g. "Implement Login API with JWT and audit logging")
        ↓
Runtime resolves which knowledge nodes are needed
        ↓
Compiler produces a CEC (mission-specific, minimal, complete)
        ↓
Model Adapter renders it for the target LLM
        ↓
LLM executes against a clean, pre-compiled context
        ↓
Artifacts produced with full traceability to source rules
```

**Benefits:**
- Knowledge compiled once, executed many times
- Every artifact traces back to specific rules/decisions
- Same CEC can target GPT today, Claude tomorrow
- Changing an architecture rule: update the knowledge source, recompile
- Context is minimal and task-specific (90% token reduction possible)

---

## 5. Use Case Walkthroughs

### 5.1 Use Case: SDD (Spec-Driven Development) Integration

This is the primary integration target. Project Aether acts as the **knowledge substrate** under an SDD workflow.

**Current SDD Workflow:**
```
Mission → Specification → Planning → Task Breakdown → LLM → Implementation
```

**SDD + Aether Workflow:**
```
Mission
    ↓
[Aether] Knowledge Graph already compiled from:
         - Project Constitution
         - Architecture specs
         - Coding standards
         - ADRs
         - Security policies
    ↓
[Aether] Runtime resolves mission against graph
    ↓
[Aether] Produces CEC for this mission
    ↓
Specification phase: LLM receives CEC, not raw docs
    ↓
Planning phase: Multi-agent CEC projections
         ├── ArchitectAgent receives: Architecture + Patterns
         ├── BackendAgent receives: Mission + Repository + Security
         ├── QAAgent receives: Testing + Validation + QualityGates
         └── SecurityAgent receives: Policy + Constraint nodes
    ↓
Task Breakdown: Each task inherits its CEC slice
    ↓
Implementation: LLM has zero ambiguity about rules
    ↓
Validation: Quality gates are already in CEC — compiler checks them
```

**Step-by-step example:**

> **Mission:** "Implement the Login API endpoint with JWT authentication, rate limiting, and audit logging."

**Step 1 — Mission Resolution**
The runtime receives the mission text and identifies the relevant knowledge domains: `Authentication`, `REST`, `Security`, `Logging`, `Repository`.

**Step 2 — Graph Traversal**
Starting from each domain node, the runtime traverses the Knowledge Graph:
- `Authentication` → requires `JWT` → requires `TokenService` → implements `SecurityPolicy`
- `REST` → requires `DTO` → requires `ThinController` → requires `ServiceLayer`
- `Logging` → requires `AuditLog` → requires `LoggingPattern` → implements `CompliancePolicy`

**Step 3 — CEC Assembly**
Compiler collects all traversed nodes, runs optimization passes, produces:
```
CEC: Login API Implementation
├── capabilities: [Authentication, REST, Logging, Repository]
├── constraints:
│   ├── MUST use JWT (Mandatory, source: ADR-0012)
│   ├── MUST use Repository Pattern (Mandatory, source: CodingStandard-3.1)
│   ├── MUST NOT write business logic in Controller (Mandatory)
│   └── MUST add rate limiting (Mandatory, source: SecurityPolicy-002)
├── patterns: [RepositoryPattern, ServiceLayerPattern, DTOPattern]
├── dependencies: [spring-security, jpa, bean-validation, slf4j]
├── expectedOutputs: [LoginController, AuthService, UserRepository, LoginTest]
└── successCriteria:
    ├── 80% test coverage
    ├── No direct database access in Controller
    └── All endpoints have audit log entries
```

**Step 4 — Model Adapter**
If targeting Claude: renders as structured system prompt + messages + tool schema.
If targeting GPT-4: renders as system/developer/user prompt + function definitions.

The knowledge is identical. Only the rendering changes.

**Step 5 — Execution**
The LLM receives a clean, complete, minimal context. It knows exactly what to build, what constraints to follow, what the success criteria are. No ambiguity.

---

### 5.2 Use Case: General AI Knowledge Storage

Beyond SDD, the platform serves as a **universal knowledge compilation layer** for any team that uses AI to generate software artifacts.

**Scenario: A fintech company onboarding to AI-assisted development**

**Challenge:** The company has:
- 3 architecture decision records (ADRs) about event sourcing
- A 50-page security compliance playbook
- A 30-page coding standards document
- A 15-page API design guide
- Dozens of example implementations in various repositories

They want their AI tools to always respect this knowledge — but managing prompts that include all of it is impossible at scale.

**Solution with Aether:**

```
Step 1: Feed all documents into the Knowledge Compiler
        compiler.compile([
          'architecture/adrs/',
          'security/playbook.md',
          'standards/coding-standards.md',
          'api-design/guide.md',
          'examples/'
        ])

Step 2: Knowledge Graph is built automatically
        - ADRs become Decision nodes
        - Security policies become Policy and Constraint nodes
        - Coding standards become Rule nodes
        - API guide becomes Pattern + Constraint nodes
        - Examples become Example nodes linked to relevant rules

Step 3: Conflicts are detected automatically
        (e.g. ADR says "use REST" but security guide has "use GraphQL for internal APIs")
        Compiler flags: ConflictReport → developer resolves

Step 4: Any AI tool in the company uses Aether as its knowledge source
        - GitHub Copilot integration: CEC injected as context
        - Custom AI agents: CEC provided at session start
        - Code review bots: CEC used to verify compliance
        - Documentation generators: CEC guides what to document
```

---

### 5.3 Use Case: Multi-Agent Orchestration

When multiple AI agents collaborate on a software project, they need different slices of knowledge. Aether handles this through **Context Projection**.

```
Single Compiled CEC for "Build E-commerce Checkout Feature"
├── Architecture (patterns, decisions, tech stack)
├── Security (payment policies, encryption rules)
├── Backend (REST API, repository, service layer)
├── Frontend (component rules, state management)
├── Testing (coverage requirements, testing patterns)
└── Database (schema rules, migration patterns)

Context Projection produces:
├── ArchitectAgent   → Architecture + Technology + Decision nodes
├── BackendAgent     → Mission + REST + Repository + Service nodes
├── FrontendAgent    → Component + StateManagement + API contract nodes
├── SecurityAgent    → Policy + Constraint + Encryption nodes
├── QAAgent          → Testing + ValidationRule + QualityGate nodes
└── DBAgent          → Schema + Migration + Performance nodes
```

Each agent receives **only the knowledge it needs**. No agent has to read 200 pages of irrelevant documentation.

---

## 6. The Key Architectural Properties

### Property 1: Compile Once, Execute Many

Knowledge is compiled into the Knowledge Graph once. Every subsequent mission uses the same graph. Only the CEC changes per mission. The graph does not change unless the source knowledge changes.

### Property 2: Model Independence

The Knowledge Graph and CEC are completely independent of any LLM. The same compiled knowledge can drive:
- GPT-4 today
- Claude Opus tomorrow
- A local Llama model in an air-gapped environment
- A future model that doesn't exist yet

Changing models requires only a new adapter, not a knowledge recompile.

### Property 3: Determinism

Two engineers who submit the same mission to the same Knowledge Graph always get the same CEC. There is no variation caused by how the prompt was phrased. Determinism comes from the compiler, not from the LLM.

### Property 4: Traceability

Every constraint, rule, and pattern in a CEC traces back to a specific source knowledge node, which traces back to a specific source document. When AI-generated code is reviewed, engineers can see exactly which rule influenced each decision.

### Property 5: Incremental Updates

When a coding standard changes, only the affected graph nodes are recompiled. Downstream CECs that referenced those nodes are invalidated and regenerated automatically. This is incremental compilation — the same concept that makes TypeScript fast.

---

## 7. What Project Aether Is NOT

| What people might assume | What Aether actually is |
|--------------------------|-------------------------|
| Another prompt framework | A knowledge compilation platform |
| A RAG system | RAG retrieves documents; Aether compiles knowledge into semantics |
| A vector database wrapper | The graph stores typed relationships, not embeddings |
| A replacement for LLMs | A layer that makes LLMs more deterministic and governable |
| An agent framework | An execution substrate that agent frameworks can build on |

---

## 8. Relationship to Existing Technology

```
LLVM    → introduced IR between high-level languages and machine code
Aether  → introduces CEC between enterprise knowledge and LLM inference

JVM     → made Java programs run on any machine without recompilation
Aether  → makes enterprise knowledge run on any LLM without reprompting

ONNX    → standardized model interchange for ML frameworks
Aether  → standardizes knowledge interchange for AI engineering

GraphRAG → retrieves subgraphs from a document graph
Aether   → compiles and optimizes knowledge into an execution context
```

---

## 9. The Vision

Project Aether is not building another AI framework.

It is defining a **new computing layer** — the layer between enterprise human knowledge and AI execution engines — that currently does not exist.

Just as LLVM defined the compiler infrastructure that modern languages (Rust, Swift, Kotlin) are built on top of, Project Aether aims to define the **knowledge compiler infrastructure** that AI-native engineering platforms will be built on top of.

The specifications in this directory are the formal definition of that infrastructure.

---

## 10. Document Map

| Document | What It Specifies |
|----------|-------------------|
| [LAS-003 Knowledge Ontology](./specifications/LAS-003-knowledge-ontology.md) | The type system — every node and edge type in the Knowledge Graph |
| [LAS-005 Compiler Pass Specification](./specifications/LAS-005-compiler-pass-specification.md) | How source documents are compiled into the Knowledge Graph |
| [LAS-008 CEC Specification](./specifications/LAS-008-cec-specification.md) | The structure and lifecycle of a Compiled Execution Context |
| [LAS-009 Model Adapter Specification](./specifications/LAS-009-model-adapter-specification.md) | How a CEC is rendered for each LLM provider |
| [LAS-010 Runtime Specification](./specifications/LAS-010-runtime-specification.md) | Graph traversal, dependency resolution, execution planning |
