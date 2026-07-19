# Project Aether — Next Steps Plan

**As of:** 2026-07-18  
**Perspective:** AI Researcher & Architect  
**Current State:** Five core design specifications complete (LAS-003, 005, 008, 009, 010)

---

## Where We Are

```
COMPLETED ✅
├── Platform Overview (aether-platform-overview.md)
├── LAS-003  Knowledge Ontology          — type system, KDL grammar
├── LAS-005  Compiler Pass Specification — 7 passes + 9 optimization passes
├── LAS-008  CEC Specification           — schema, lifecycle, invariants
├── LAS-009  Model Adapter Specification — 4 adapters, Execution Envelope
└── LAS-010  Runtime Specification       — 8 subsystems, all algorithms

MISSING FROM ORIGINAL PLAN ⚠️
├── LAS-001  Vision
├── LAS-002  Knowledge Theory            ← most critical research gap
├── LAS-004  Knowledge Definition Language (KDL full spec)
├── LAS-006  Knowledge IR                ← key novelty claim
└── LAS-007  Optimization Engine         ← separate deep treatment

NOT YET STARTED 🔲
├── Formal Theory (proofs, complexity, semantics)
├── Reference Implementation
├── Evaluation Framework + Benchmarks
├── Literature Review + Prior Art Analysis
├── Whitepaper
└── Patent / IP Track
```

---

## The Five Tracks

As an AI researcher and architect, the work ahead splits into **five parallel tracks**, each with different timelines and dependencies:

```
Track 1: Complete Specification Suite   (Weeks 1–4)
Track 2: Formal Theory                  (Weeks 2–8)   [can overlap]
Track 3: Reference Implementation       (Weeks 4–16)  [starts after Track 1]
Track 4: Evaluation & Benchmarking      (Weeks 10–20) [starts after Track 3]
Track 5: Publication & IP               (Weeks 6–24)  [parallel to all]
```

---

## Track 1: Complete the Specification Suite

### What's Missing

The five specs we wrote answer **how** the system works. The three missing specs answer **why** and **what** at a deeper theoretical level. These are arguably the most important for a research contribution.

---

### LAS-001 — Vision Document

**Purpose:** The "north star" — what Project Aether is trying to be in 10 years.  
**Audience:** Anyone reading the spec suite for the first time.  
**Priority:** High — needed before whitepaper.

**Content:**
- The knowledge computing paradigm (the "new computing layer" framing)
- Comparison to LLVM / JVM / ONNX / Kubernetes — where Aether sits in that lineage
- The 10-year thesis: Aether becomes the execution substrate for AI-native software engineering
- What success looks like at 1 year / 3 years / 10 years
- Design philosophy (the 7 principles)

---

### LAS-002 — Knowledge Theory

**Purpose:** The **most important missing document.** This is the formal theoretical foundation — the "why does this model work?" answer.

**This is where the novel research contribution lives.**

**Content to develop:**

#### 2.1 Formal Definition of Enterprise Knowledge
> What *is* knowledge in the context of software engineering? How does it differ from data, information, or documentation?

Define formally:
- Knowledge := a typed, structured, executable assertion about how software systems should be built
- Contrast with: documents (syntactic), prompts (imperative), rules engines (procedural)

#### 2.2 Knowledge Computability
> Can all software engineering knowledge be compiled? What is not computable?

Define:
- Computable knowledge: rules, constraints, patterns, policies with deterministic applicability
- Non-computable knowledge: tacit knowledge, aesthetic judgment, creative decisions
- The boundary between the two (what requires human input vs. what can be automated)

#### 2.3 The Knowledge Compilation Theorem
> Claim: any finite enterprise knowledge base can be compiled into a semantically equivalent, optimized, finite execution context for a given mission.

This is the theoretical core. It needs:
- Formal definition of "semantically equivalent"
- Conditions under which compilation is decidable
- Proof sketch (or conditions where it fails — incompleteness)

#### 2.4 Context Minimality
> What is the minimal set of knowledge nodes required for a given mission?

Define formally:
- The Mission-Knowledge Relevance Function: `rel(node, mission) → [0,1]`
- Minimal Complete Context: the smallest set of nodes that satisfies all mission invariants
- Proof that our optimization passes converge toward minimal complete context

#### 2.5 Semantic Equivalence
> When are two knowledge representations semantically equivalent?

Define formally:
- Two CECs are equivalent if they produce the same set of valid artifacts for any execution engine
- Conditions for CEC equivalence (not necessarily node-count equal)
- Why this matters: allows automated regression testing of recompiled CECs

#### 2.6 Complexity Analysis
- Time complexity of each compiler pass (Big-O)
- Space complexity of the Knowledge Graph (function of source document volume)
- Convergence guarantee for optimization passes (do they terminate? in what conditions might they loop?)

---

### LAS-004 — Knowledge Definition Language (Full Spec)

**Purpose:** The complete formal language specification for KDL — the grammar, type system, semantics, and tooling guide.

We have a sketch inside LAS-003. This needs to become a complete language specification.

**Content:**
- Complete EBNF grammar (all node types, edge types, modifiers, comments)
- Type system formal rules (subtyping, property inheritance)
- Semantic rules (what makes a KDL file valid beyond syntax)
- Operational semantics (what compiling a KDL file means, step by step)
- Module system (how KDL files reference each other)
- Standard library (built-in node templates for common engineering patterns)
- Error messages catalog (what the KDL parser reports when things go wrong)
- Language server specification (for IDE tooling)
- Migration guide from markdown to KDL

---

### LAS-006 — Knowledge IR

**Purpose:** Define the **internal intermediate representation** that sits between the Knowledge Graph and the CEC — the actual data structures the compiler operates on during optimization passes.

This is different from the Knowledge Graph (which is persistent) and the CEC (which is output). The Knowledge IR is the **transient working representation during compilation**.

**This is potentially the strongest novelty claim** — it is the direct analogy to LLVM IR.

**Content:**
- KIR (Knowledge IR) formal grammar
- Object model: KIRModule, KIRFunction (pass), KIRNode, KIREdge
- SSA-like properties for knowledge (can we define "knowledge use-def chains"?)
- KIR normalization rules
- How KIR differs from the Knowledge Graph and CEC
- KIR serialization (for caching mid-compilation states)
- KIR verification passes

---

### LAS-007 — Optimization Engine (Deep Treatment)

**Purpose:** A dedicated, deep treatment of the **optimization algorithms** — going beyond the pseudocode in LAS-005 into formal algorithms, correctness proofs, and complexity analysis.

**Content:**
- Formal optimization framework (passes as transformations on KIR)
- Soundness definition: an optimization is sound if it preserves semantic equivalence
- Completeness: can we enumerate all useful optimizations?
- Ordering theory: which optimization orders produce better results?
- Fixed-point iteration: when do we stop optimizing?
- Novel optimization ideas not yet explored:
  - **Context Memoization**: reuse CEC subgraphs across missions with shared structure
  - **Speculative Prefetching**: predict next mission and precompile its CEC
  - **Knowledge Delta Encoding**: encode CEC as delta from a base CEC
  - **Adaptive Compression**: learn which nodes are most reused and prioritize them

---

## Track 2: Formal Theory Work

This track runs in parallel with Track 1 but at a deeper mathematical level. It is the **difference between a systems paper and a theory paper** — and it is what makes a patent defensible.

### 2.1 Literature Review (Critical — Do First)

Before going further, conduct a thorough literature review of:

| Area | Key Works | Relevance |
|------|----------|-----------|
| Compiler IRs | LLVM IR, MLIR, GCC GIMPLE | Direct inspiration |
| Knowledge Graphs | TransE, KGBERT, GraphRAG | Understand gaps |
| Ontologies | OWL-DL, RDFS, SKOS | Compare to LAS-003 |
| AI Planning | STRIPS, PDDL, HTN Planning | Mission planning analogies |
| Program Synthesis | FlashFill, DeepCoder | Related to code generation |
| Semantic Web | Linked Data, RDF*, SHACL | Prior work on typed relations |
| RAG Systems | REALM, RETRO, Atlas | What we're going beyond |
| DSL Design | Spoofax, MPS, Xtext | KDL tooling inspiration |
| Type Theory | Hindley-Milner, dependent types | Typing for knowledge ontology |

**Open research question to answer from review:**  
> Has anyone previously defined a typed, compiler-based intermediate representation specifically for enterprise knowledge and AI execution contexts? (Hypothesis: No — this is the novelty claim.)

### 2.2 Formal Proofs to Develop

| Theorem | Description | Difficulty |
|---------|-------------|-----------|
| **Compilation Decidability** | The KCC always terminates for finite knowledge bases | Medium |
| **Optimization Soundness** | Each O-pass preserves semantic equivalence | High |
| **Context Minimality** | O4+O8 converge toward minimal complete context | High |
| **Projection Completeness** | Multi-agent projections cover all CEC outputs | Medium |
| **Incremental Correctness** | Incremental recompilation is equivalent to full recompilation for the changed scope | High |

### 2.3 Complexity Analysis

| Component | Claim | Approach |
|-----------|-------|---------|
| P1 Document Parser | O(n) in document size | Straightforward |
| P3 Relationship Discoverer | O(n²) in node count | Pairwise comparison |
| O1 Dead Knowledge Elimination | O(V + E) | Standard graph theory BFS |
| O7 Dependency Closure | O(V × E) | Transitive closure |
| `traverse_for_mission` | O((V + E) × log V) | Priority BFS |
| Overall compilation | O(V² × E) worst case | Dominated by O7/P3 |

---

## Track 3: Reference Implementation

A specification without an implementation is a vision. A specification with a reference implementation is an invention.

### Architecture Decision: Language Choice

| Option | Pros | Cons |
|--------|------|------|
| **TypeScript/Node.js** | Fast to prototype, aligns with SDD ecosystem, JSON-native | Not ideal for heavy graph computation |
| **Python** | Best ML ecosystem, easy LLM integration, rich graph libs | Slower, less type-safe |
| **Rust** | Performance, memory safety, strong type system | Slower development |
| **Go** | Fast compilation, good concurrency | Less ML ecosystem |

**Recommendation:** Start with **TypeScript** for compiler and adapter layer (aligns with SDD tooling), with **Python** bindings for any ML-based extraction in P2.

### Implementation Phases

#### Phase A — Minimal Viable Compiler
**Goal:** Compile one markdown document → Knowledge Graph → CEC → GPT prompt.

```
Deliverables:
├── P1: Markdown parser → DocumentAST
├── P2: Rule/Constraint/Pattern extractor (heuristics only, no LLM)
├── P7: Graph constructor (in-memory JSON)
├── O1+O4: Dead-knowledge elimination + context compression
├── CEC assembler (simplified schema)
└── OpenAI adapter (system + user message)
```

**Success criteria:** Given a 10-page coding standards doc and "Implement User Registration API", produce a CEC with ≥5 relevant constraint nodes and a valid OpenAI API payload.

#### Phase B — Full Compiler Pipeline

```
Deliverables:
├── All 7 compilation passes (P1-P7)
├── KDL parser + KDL → DocumentAST bridge
├── Persistent graph storage (JSON or SQLite)
├── Conflict detection (P5)
└── CLI: aether compile <source-dir> --output graph.json
```

#### Phase C — Full Optimization + CEC

```
Deliverables:
├── All 9 optimization passes (O1-O9)
├── Full CEC schema (all 12 sections)
├── CEC cache (file-based)
├── CEC verifier (10 invariants)
└── CLI: aether run --mission "..." --graph graph.json --model gpt-4o
```

#### Phase D — Multi-Agent + Full Adapter Suite

```
Deliverables:
├── Context projection (multi-agent)
├── Execution planner
├── Anthropic adapter
├── MCP adapter
├── Incremental recompilation
└── REST API: POST /compile, GET /cec/:id, POST /run
```

#### Phase E — SDD Integration

```
Deliverables:
├── SDD CLI plugin: sdd run --aether
├── Per-task CEC injection into SDD workflows
├── CEC-aware specification generation
└── Quality gate verification against CEC success criteria
```

---

## Track 4: Evaluation & Benchmarking

**This track defines what "working" means.** Without metrics, the system cannot be evaluated, compared, or published.

### 4.1 Metrics to Define and Measure

| Metric | Definition | Measurement |
|--------|-----------|-------------|
| **Compression Ratio** | sourceNodeCount / cecNodeCount | Compiler stats |
| **Token Reduction** | (baseline tokens − CEC tokens) / baseline tokens | Compare against naive prompt |
| **Semantic Coverage** | % of mandatory source rules appearing in CEC | Automated audit |
| **Compilation Time** | ms from MissionInput → CEC ready | Benchmarking suite |
| **CEC Cache Hit Rate** | % of missions served from cache | Runtime stats |
| **Constraint Compliance Rate** | % of LLM outputs satisfying all CEC constraints | LLM judge evaluation |
| **Determinism Score** | Variance in outputs for identical CEC + same model | Repeated execution study |

### 4.2 Baseline Comparisons

| Baseline | Description |
|----------|-------------|
| **B1: Raw Prompt** | Everything dumped into one prompt (current practice) |
| **B2: RAG** | Document chunks retrieved by vector similarity |
| **B3: SDD (current)** | Structured markdown specs injected as context |

### 4.3 AetherBench v0.1

```
AetherBench v0.1:
├── Category A: API Implementation (10 tasks)
│   ├── Simple CRUD API
│   ├── Auth API (JWT)
│   ├── File upload API
│   └── ...
├── Category B: Code Review (10 tasks)
├── Category C: Test Generation (5 tasks)
└── Category D: Documentation (5 tasks)

Knowledge bases:
├── KB1: Small  (5 docs,  ~50 rules)
├── KB2: Medium (20 docs, ~200 rules)
└── KB3: Large  (50 docs, ~600 rules)
```

### 4.4 Key Evaluation Questions

1. Does CEC reduce token usage while maintaining constraint compliance?
2. Does CEC improve determinism vs. raw prompt?
3. Is compilation fast enough for real-time use? (< 2 seconds target)
4. Does the system scale to 500+ rule knowledge bases?
5. Does incremental recompilation significantly reduce latency after knowledge updates?

---

## Track 5: Publication & Intellectual Property

> [!IMPORTANT]
> Do NOT publish publicly before consulting a patent attorney if you intend to file patents. Public disclosure before filing can affect patent rights.

### 5.1 Target Publication Venues

| Venue | Type | Rationale |
|-------|------|-----------|
| **ICSE** | Conference | Premier SE conference — AI-assisted engineering is top topic |
| **FSE/ESEC** | Conference | Strong systems + AI-assisted SE track |
| **NeurIPS Systems Track** | Conference | Highest visibility for novel AI infrastructure |
| **IEEE Software** | Journal | Practitioner audience — good for SDD lineage |
| **arXiv cs.SE** | Preprint | After patent filing — for visibility |

**Paper type:** Systems paper — novel architecture, reference implementation, evaluation against baselines.

**Paper structure:**
1. Introduction (problem + thesis)
2. Background & Motivation
3. Knowledge Ontology (LAS-003 condensed)
4. Knowledge Compiler (LAS-005 condensed)
5. CEC + Runtime (LAS-008 + LAS-010)
6. Model Adapter (LAS-009)
7. Evaluation (AetherBench results)
8. Related Work
9. Conclusion + Future Work

### 5.2 Patent Claim Families

| Claim Family | Core Claim |
|-------------|-----------|
| **C1: Knowledge Compilation** | Method for compiling heterogeneous enterprise engineering documents into a normalized, typed semantic graph using deterministic multi-pass compilation |
| **C2: Semantic IR** | A structured intermediate representation (KIR/CEC) for encoding enterprise engineering knowledge in a model-agnostic, optimizable format |
| **C3: Mission-Specific CEC** | Method for generating mission-specific execution contexts from a knowledge graph using graph traversal and optimization passes |
| **C4: Dynamic Context Assembly** | Method for assembling minimal, semantically complete AI context packages by traversing dependency relationships rather than retrieving documents |
| **C5: Model Adapter Protocol** | Architecture for rendering model-agnostic execution contexts into provider-specific AI execution packages via pluggable adapters |
| **C6: Incremental Recompilation** | Method for detecting changes in enterprise knowledge sources and selectively invalidating and recompiling only affected execution contexts |

**Recommended path:**
1. File a **provisional patent** (establishes priority date, 12-month window)
2. Conduct prior art search focused on C1, C2, C4
3. File full utility patent within 12 months

### 5.3 Open Source Strategy (Post-Patent)

After patents are filed, open-source the reference implementation under a dual license:
- **Open Core** (Apache 2.0): compiler, runtime, adapters, KDL tooling
- **Commercial**: enterprise governance dashboard, audit trails, team knowledge management

This mirrors the LLVM / Kubernetes model — open infrastructure with commercial services on top.

---

## Immediate Next Actions (Next 2 Weeks)

| Priority | Action | Output | Track |
|----------|--------|--------|-------|
| 🔴 Critical | Literature review — compiler IRs, knowledge graphs, ontologies | Research notes confirming novelty gap | T2 |
| 🔴 Critical | Write LAS-002 (Knowledge Theory) | Formal definitions + compilation theorem sketch | T1 |
| 🔴 Critical | Consult patent attorney | Decision on provisional filing | T5 |
| 🟡 High | Write LAS-006 (Knowledge IR) | KIR grammar + object model | T1 |
| 🟡 High | Write LAS-004 (KDL full spec) | Complete language grammar | T1 |
| 🟡 High | Write LAS-001 (Vision) | Vision document for external readers | T1 |
| 🟢 Medium | Write LAS-007 (Optimization Engine theory) | Formal optimization framework | T1 |
| 🟢 Medium | Begin MVP implementation (Phase A) | Working end-to-end prototype | T3 |
| 🟢 Medium | Design AetherBench v0.1 | Benchmark suite specification | T4 |

---

## Decision Gates

### Gate 1 — Before Starting Reference Implementation
- [ ] LAS-002 (Knowledge Theory) complete
- [ ] LAS-006 (Knowledge IR) complete
- [ ] Literature review confirms novelty
- [ ] Patent attorney consulted

### Gate 2 — Before Writing Whitepaper
- [ ] MVP implementation running end-to-end
- [ ] At least 3 AetherBench tasks evaluated
- [ ] Compression ratio > 5x demonstrated on a real knowledge base
- [ ] All 10 LAS documents at least in draft

### Gate 3 — Before Filing Patent
- [ ] Prior art search complete
- [ ] At least one working adapter (OpenAI or Anthropic) demonstrated
- [ ] Patent claims drafted with attorney

### Gate 4 — Before Conference Submission
- [ ] Reference implementation at Phase B or C
- [ ] Full benchmark evaluation complete
- [ ] Related work section thoroughly researched

---

## Open Research Questions to Investigate

These are the **hardest unsolved questions**. Each could become a separate research contribution.

| # | Question | Difficulty | Impact |
|---|----------|-----------|--------|
| Q1 | Is the Knowledge Graph the optimal IR, or would a hypergraph or tensor representation be better? | High | Very High |
| Q2 | Can Knowledge Extractor (P2) be fully deterministic without any LLM? | High | High |
| Q3 | How do you formally define semantic equivalence between two CECs? | Very High | Very High |
| Q4 | Can optimization passes be automatically generated from examples of good/bad CECs? (meta-optimization) | Very High | High |
| Q5 | Can the compiler detect when a mission is ambiguous and refuse to compile? | Medium | High |
| Q6 | How does the system handle intentionally ambiguous knowledge? | Medium | Medium |
| Q7 | Can KDL become an industry interchange standard like ONNX for models? | High (industry) | Very High |
| Q8 | What is the minimum knowledge base size where Aether outperforms RAG? | Medium | High |
| Q9 | Can the runtime learn which optimization passes produce better CECs per mission type? (adaptive compilation) | High | High |
| Q10 | Can Aether compile constraints that span multiple codebases? (cross-repository knowledge) | High | Very High |

---

## 12-Month Roadmap

```
Month 1-2   Theory & Spec Completion
            ├── LAS-001, LAS-002, LAS-004, LAS-006, LAS-007
            ├── Literature review
            └── Patent attorney consultation

Month 2-3   Formal Theory
            ├── Knowledge Compilation theorem sketch
            ├── Complexity analysis
            └── Novelty gap confirmed

Month 3-6   Reference Implementation (Phase A-C)
            ├── Phase A: MVP — end-to-end proof of concept
            ├── Phase B: Full compiler pipeline
            └── Phase C: Full optimization + CEC

Month 5-7   Provisional Patent Filing
            ├── Claims C1-C6 drafted
            └── Filed with attorney

Month 6-9   Evaluation
            ├── AetherBench v0.1
            ├── Baseline comparisons (B1-B3)
            └── Results: compression, token reduction, compliance rate

Month 8-10  Whitepaper
            ├── First draft (30+ pages)
            ├── Review and iterate
            └── Final draft ready for submission

Month 10-12 Publication + Open Source
            ├── arXiv preprint (after patent filing)
            ├── Conference submission
            ├── Reference implementation published (open-core)
            └── SDD integration (Phase E)
```

---

## The Most Important Insight

From an AI researcher's perspective, the **single most important thing** to get right before everything else is:

> **LAS-002: Knowledge Theory — specifically, the formal definition of semantic equivalence and the compilation theorem.**

Every other decision flows from whether these two things can be formalized:

1. If semantic equivalence cannot be formally defined → we cannot prove correctness of optimizations → patent claims are weaker
2. If the compilation theorem cannot be proven → we cannot claim completeness → the research contribution is weaker

Everything else — implementation, benchmarks, adapters, whitepaper — is **engineering**.

The theory is what makes this a **research contribution** rather than a framework.

The specifications we have now are excellent. They define **what** the system does. The theory defines **why** it works — and why no one else has done it this way before. That is the defensible territory.
