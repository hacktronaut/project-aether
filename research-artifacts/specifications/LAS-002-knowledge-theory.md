# LAS-002 — Knowledge Theory

**Document ID:** LAS-002  
**Title:** Knowledge Theory  
**Version:** 0.1  
**Status:** Draft  
**Layer:** Foundational Theory  
**Depends On:** LAS-001 (Vision), LAS-003 (Ontology — for type definitions)  
**Used By:** LAS-005, LAS-007, LAS-008, LAS-010

---

## Preface

This document establishes the **formal theoretical foundation** of Project Aether. It defines what enterprise engineering knowledge is, proves that it can be compiled, characterizes the conditions under which compilation is optimal, and provides the complexity analysis that bounds the system's computational behavior.

This is not a systems paper. It is a theory paper embedded in the specification suite. The theorems and definitions here are intentionally rigorous — they are the theoretical core that distinguishes Aether from a framework and makes it a research contribution.

All definitions and theorems reference the node type taxonomy from LAS-003.

---

## 1. Formal Definitions

### 1.1 What Is Enterprise Engineering Knowledge?

**Informal definition:** Enterprise engineering knowledge is everything a team knows about how to build software correctly — its rules, patterns, decisions, constraints, and standards.

**Formal definition:**

Let `𝕋` be the set of all possible engineering contexts (technology stacks, domains, organizational requirements). Let `𝔸` be the set of all possible software artifacts (code, tests, architecture, documentation).

> **Definition 1.1 (Engineering Knowledge).**
> A piece of *engineering knowledge* `k` is a partial function:
> ```
> k : 𝕋 → 𝔸 → {valid, invalid, undefined}
> ```
> that evaluates a software artifact `a ∈ 𝔸` given an engineering context `t ∈ 𝕋`, returning whether the artifact is valid, invalid, or not subject to `k`.

This definition captures the essential character of engineering knowledge: it is not a fact about the world, but a judgment function over artifacts in context.

**Examples:**
- "Controllers must not contain business logic" → `k(t, a) = invalid` when `a` is a Controller containing SQL queries
- "Use Repository Pattern for data access" → `k(t, a) = valid` when `a` uses `IRepository`, `invalid` when it directly calls `DbContext`
- "JWT must be used for authentication" → `k(t, a) = invalid` when `a` implements Basic Auth

### 1.2 Knowledge vs. Related Concepts

| Concept | Relationship to Knowledge |
|---------|--------------------------|
| **Document** | A human-readable encoding of knowledge. Knowledge is the semantic content; a document is one possible representation. |
| **Prompt** | An imperative instruction derived from knowledge for a specific interaction. Knowledge is persistent; prompts are ephemeral. |
| **Rule (in rule engines)** | A subset of knowledge — executable conditional logic. Knowledge also includes tacit, structural, and relational content that rule engines cannot represent. |
| **Embedding** | A numeric approximation of knowledge. Embeddings enable similarity search but not semantic reasoning, conflict detection, or priority ordering. |
| **Knowledge Graph (general)** | A graph of facts about the world. The Aether Knowledge Graph is specifically typed engineering knowledge — not general-world facts. |

### 1.3 Knowledge Space

> **Definition 1.2 (Enterprise Knowledge Base).**
> An *enterprise knowledge base* `K` is a finite set of knowledge pieces:
> ```
> K = {k₁, k₂, ..., kₙ}
> ```
> where each `kᵢ` has an associated *type* `τ(kᵢ) ∈ NodeTypes` (from LAS-003), a *priority* `π(kᵢ) ∈ {Mandatory, Recommended, Optional, Informational, Deprecated}`, and a *scope* `σ(kᵢ) ⊆ Scopes`.

> **Definition 1.3 (Knowledge Consistency).**
> A knowledge base `K` is *consistent* if and only if there is no pair `(kᵢ, kⱼ) ∈ K × K` such that:
> 1. `kᵢ` and `kⱼ` are in `conflicts_with` relation, AND
> 2. both `π(kᵢ)` and `π(kⱼ)` are equal in priority level.
>
> A knowledge base is *weakly consistent* if conflicts exist only between knowledge pieces of strictly different priority levels (in which case the higher-priority piece dominates).

### 1.4 Mission

> **Definition 1.4 (Mission).**
> A *mission* `M` is a tuple:
> ```
> M = (objective, scope, preconditions, postconditions, missionType)
> ```
> where:
> - `objective ∈ String` describes what must be accomplished
> - `scope ⊆ Scopes` specifies the applicable knowledge domains
> - `preconditions : 𝔸 → Boolean` tests whether the workspace state is ready
> - `postconditions : 𝔸 → Boolean` tests whether the mission is complete
> - `missionType ∈ MissionTypes` classifies the mission

### 1.5 Compiled Execution Context

> **Definition 1.5 (Compiled Execution Context).**
> A *Compiled Execution Context* for mission `M` over knowledge base `K` is a tuple:
> ```
> CEC(M, K) = (K_M, Outputs_M, Gates_M)
> ```
> where:
> - `K_M ⊆ K` is the *mission-relevant knowledge subset* of `K`
> - `Outputs_M` is the set of required artifact specifications
> - `Gates_M` is the set of quality gates that must be satisfied

### 1.6 Semantic Equivalence

This is the central definition for the entire theory.

> **Definition 1.6 (CEC Semantic Equivalence).**
> Two CECs `C₁ = (K₁, O₁, G₁)` and `C₂ = (K₂, O₂, G₂)` are *semantically equivalent* with respect to mission `M`, written `C₁ ≡_M C₂`, if and only if:
>
> For every execution engine `E` and every artifact `a ∈ 𝔸` produced by `E` using either `C₁` or `C₂`:
> ```
> ∀k ∈ K : π(k) = Mandatory ∧ σ(k) ∩ M.scope ≠ ∅ →
>   k(M.scope, a) ≠ invalid
> ```
>
> That is: two CECs are semantically equivalent if they cause any compliant execution engine to produce artifacts that satisfy all Mandatory knowledge pieces applicable to the mission's scope.

**Remark:** Semantic equivalence is defined in terms of *behavioral equivalence on artifacts*, not *structural equivalence between CECs*. Two CECs with different node sets can be semantically equivalent — one may have inlined rules that the other expresses as separate nodes.

**Corollary 1.6.1:** If `C₁ ≡_M C₂` and `|K₁| < |K₂|`, then `C₁` is a *more efficient* encoding than `C₂` (strictly fewer knowledge nodes while maintaining equivalence).

---

## 2. Knowledge Computability

### 2.1 Computable vs. Non-Computable Knowledge

Not all enterprise knowledge is compilable. This section defines the boundary.

> **Definition 2.1 (Computable Knowledge).**
> A piece of engineering knowledge `k` is *computable* if:
> 1. Its applicability condition can be expressed as a decidable predicate over `(context, artifact)` pairs
> 2. Its violation can be determined by static analysis or structural inspection of an artifact
> 3. Its semantic content can be represented as a node in the LAS-003 ontology without loss of meaning

> **Definition 2.2 (Non-Computable Knowledge).**
> Knowledge `k` is *non-computable* (in the Aether sense) if it requires:
> - **Tacit knowledge**: "use your judgment on X" — no formalizable applicability condition
> - **Aesthetic judgment**: "make the code elegant" — no decidable violation predicate
> - **Social context**: "follow what the team has been doing recently" — requires runtime observation
> - **Future state**: "this will be important when we scale" — requires prediction

**Examples of Computable Knowledge:**
- "All API endpoints must return HTTP 4xx for client errors" → Computable: static analysis can verify response codes
- "Controllers must not import Repository interfaces directly" → Computable: import analysis
- "Test coverage must be ≥ 80%" → Computable: coverage tooling

**Examples of Non-Computable Knowledge:**
- "Write clean, readable code" → Non-computable: no decidable definition of "clean"
- "Be pragmatic about test coverage in early stages" → Non-computable: "pragmatic" and "early stages" are undefined
- "Follow the team's conventions" → Non-computable without access to team history

**Theorem 2.1 (Computability Bound):** For any finite enterprise knowledge base `K`, the subset of computable knowledge `K_c ⊆ K` is non-empty and can be identified by syntactic analysis of the knowledge's applicability conditions.

*Proof sketch:* Any knowledge piece whose applicability condition references only syntactic properties of artifacts (imports, types, function signatures, file structure) is decidable. Any knowledge piece whose applicability condition references semantic properties that require execution or social context is not decidable syntactically. The first class is always non-empty in any real engineering context — even the smallest project has at least one structural constraint. ∎

---

## 3. The Knowledge Compilation Theorem

### 3.1 Main Theorem

> **Theorem 3.1 (Knowledge Compilation Theorem).**
> For any finite, weakly consistent, computable knowledge base `K` and any mission `M` with `M.scope ∩ K.domains ≠ ∅`, there exists a Compiled Execution Context `CEC(M, K)` such that:
> 1. `CEC(M, K)` contains all Mandatory knowledge in `K` applicable to `M.scope`
> 2. `CEC(M, K)` contains no knowledge from `K` that is inapplicable to `M.scope`
> 3. `CEC(M, K)` is finite
> 4. Construction of `CEC(M, K)` terminates in finite time

*Proof:*

**Part 1 (Mandatory knowledge completeness):**  
Let `K_M = {k ∈ K : π(k) = Mandatory ∧ σ(k) ∩ M.scope ≠ ∅}`. By Definition 1.5, `CEC(M, K) ⊇ K_M`. Since `K` is finite, `K_M` is finite. Since the compiler traverses the Knowledge Graph starting from mission anchor nodes and follows `requires` and `depends_on` edges (O7: Dependency Closure, LAS-005), all reachable Mandatory nodes are included. ∎

**Part 2 (No inapplicable knowledge):**  
The graph traversal (LAS-010 §4.2) filters nodes by `scope.intersects(M.scope)`, excluding all nodes with disjoint scope. The Dead Knowledge Elimination pass (O1, LAS-005) removes nodes not reachable from mission anchor nodes. Therefore no inapplicable knowledge survives. ∎

**Part 3 (Finiteness):**  
`K` is finite by assumption. `K_M ⊆ K` is therefore finite. Each optimization pass reduces or preserves the node count — no pass adds nodes not already in `K` (except Dependency Closure O7, which adds only nodes already in the full Knowledge Graph, which is also finite). ∎

**Part 4 (Termination):**  
The compilation passes P1–P7 are each bounded by the size of their input (document count, node count, edge count). The optimization passes O1–O9 are each monotonically decreasing — each pass either removes nodes, merges nodes, or leaves the count unchanged. Since the node count is bounded below by 0, all optimization passes terminate. The Dependency Closure (O7) terminates because the full Knowledge Graph is finite and each iteration adds at most one previously unseen node. ∎

### 3.2 Uniqueness of Optimal CEC

> **Theorem 3.2 (Non-Uniqueness of Optimal CEC).**
> For a given mission `M` and knowledge base `K`, the set of all semantically equivalent CECs of minimum size is generally non-empty and may contain more than one element.

*Proof by example:*  
Consider two representations of the same constraint: (A) a single Constraint node with properties inlined, and (B) a Constraint node with a child Rule node connected by `requires`. Both representations are semantically equivalent under Definition 1.6 (they produce the same artifact validity judgments). Yet they have different node counts (1 vs. 2). The choice between them is made by the Rule Inlining pass (O5), which selects representation A. However, in cases where the Rule node is shared by multiple parents, O5 correctly retains representation B. Therefore there is no single canonical minimum CEC in all cases, but the optimization passes converge to one of several locally optimal forms. ∎

**Implication:** The correctness criterion for the optimizer is not "produce the globally minimal CEC" (which is NP-hard in general) but "produce a locally optimal CEC that is semantically equivalent to the full applicable knowledge." This is analogous to compiler optimizations, which are not required to find globally optimal code.

### 3.3 Compilation Completeness

> **Theorem 3.3 (Compilation Completeness).**
> If a piece of computable knowledge `k ∈ K` is applicable to mission `M` (i.e., `σ(k) ∩ M.scope ≠ ∅`) and `π(k) = Mandatory`, then `k` (or a semantically equivalent representation) is always present in `CEC(M, K)`.

*Proof:* By Theorem 3.1 Part 1, all Mandatory applicable knowledge is included. By the semantic equivalence relation (Definition 1.6), if `k` is merged or folded with another node `k'` during optimization (O2, O3, O6), the resulting node is semantically equivalent to `k`. Therefore the CEC contains either `k` directly or a node that subsumes it under ≡_M. ∎

---

## 4. Context Minimality

### 4.1 The Minimality Problem

Given a mission `M` and knowledge base `K`, we want to produce the smallest CEC that is semantically equivalent to the full applicable knowledge. This is the *Context Minimality Problem*.

> **Definition 4.1 (Minimal Complete Context).**
> A CEC `C* = (K*, O, G)` is a *minimal complete context* for mission `M` over knowledge base `K` if:
> 1. `C* ≡_M CEC(M, K)` (semantic equivalence)
> 2. For all `k ∈ K*`, removing `k` from `K*` violates semantic equivalence: `(K* \ {k}, O, G) ≢_M CEC(M, K)`

### 4.2 Complexity of Minimality

> **Theorem 4.1 (Minimality is NP-hard).**
> The problem of finding the minimal complete context for a given mission and knowledge base is NP-hard.

*Proof sketch:* Finding the minimal complete context requires determining, for each knowledge piece, whether it can be removed while preserving semantic equivalence. This is equivalent to the *minimal hitting set problem* (finding the smallest set of knowledge pieces that "hits" all artifact validity requirements), which is known to be NP-hard. ∎

**Implication:** The Aether optimizer does not attempt to find the globally minimal CEC. Instead, it uses a set of polynomial-time approximation algorithms (O1–O9) that produce a *locally optimal* CEC which is good enough in practice while remaining tractable.

### 4.3 Mission-Knowledge Relevance Function

> **Definition 4.2 (Relevance Function).**
> The *relevance* of knowledge piece `k` to mission `M` is a real-valued function:
> ```
> rel(k, M) ∈ [0, 1]
> ```
> defined as:
> ```
> rel(k, M) = α · pathRelevance(k, M) + β · priorityWeight(k) + γ · scopeMatch(k, M)
> ```
> where:
> - `pathRelevance(k, M) = max(0, 1 - BFS_distance(k, M.anchorNodes) / maxDepth)`
> - `priorityWeight(k) ∈ {1.0, 0.8, 0.5, 0.0, 0.0}` for {Mandatory, Recommended, Optional, Informational, Deprecated}
> - `scopeMatch(k, M) = |σ(k) ∩ M.scope| / |M.scope|`
> - `α + β + γ = 1` (normalization), with `α ≥ β ≥ γ ≥ 0`

**Default weights:** α = 0.5, β = 0.35, γ = 0.15

> **Lemma 4.1:** For all Mandatory knowledge pieces `k` with non-empty scope overlap with `M`, `rel(k, M) ≥ β · 1.0 = 0.35`.

*Proof:* Mandatory knowledge has `priorityWeight = 1.0`. Any non-empty scope overlap gives `scopeMatch > 0`. Therefore the relevance is at least `β · 1.0 + γ · ε > β ≥ 0.35`. ∎

**Implication for Context Compression (O4):** The compression pass never removes nodes with relevance above the mandatory threshold, ensuring Mandatory knowledge is always retained.

---

## 5. Semantic Equivalence — Formal Properties

### 5.1 Equivalence is an Equivalence Relation

> **Theorem 5.1:** The relation `≡_M` is an equivalence relation on CECs:
> 1. **Reflexivity:** `C ≡_M C` for all `C`
> 2. **Symmetry:** If `C₁ ≡_M C₂`, then `C₂ ≡_M C₁`
> 3. **Transitivity:** If `C₁ ≡_M C₂` and `C₂ ≡_M C₃`, then `C₁ ≡_M C₃`

*Proof:* Follows directly from Definition 1.6, which defines equivalence in terms of a property of artifact validity that is symmetric and transitive in its definition. ∎

### 5.2 Monotonicity of Semantic Equivalence Under Optimization

> **Theorem 5.2 (Optimization Soundness).**
> Each optimization pass `Oᵢ` in {O1, ..., O9} is *semantically sound*: for any subgraph `G`, `Oᵢ(G) ≡_M G`.

*Proof per pass:*

- **O1 (Dead Knowledge Elimination):** Removes nodes not reachable from mission anchor. By definition, unreachable nodes have `pathRelevance = 0`. A node with zero path relevance cannot contribute to any Mandatory constraint applicable to the mission. Therefore its removal preserves ≡_M. ∎

- **O2 (Duplicate Rule Folding):** Merges nodes with identical semantic hash (same type, scope, and directive). By Definition 1.6, two identical knowledge pieces produce identical artifact validity judgments. Merging them is therefore semantically neutral. ∎

- **O3 (Capability Folding):** Replaces a cluster of member nodes with a Capability node that stores them as expandable children. The Capability node expands to its members on demand, preserving all member content. Therefore no knowledge is lost. ∎

- **O4 (Context Compression):** Removes nodes with `rel(k, M) < threshold` where `threshold` is set such that all Mandatory nodes are retained (by Lemma 4.1). Since only non-Mandatory, low-relevance nodes are removed, and semantic equivalence requires preservation of all Mandatory knowledge, O4 is sound. ∎

- **O5 (Rule Inlining):** Inlines leaf rules into parent nodes. The inlined content is preserved verbatim in the parent's `inlinedRules` property. No knowledge is lost; only the graph structure changes. ∎

- **O6 (Priority Resolution):** Removes lower-priority nodes that conflict with Mandatory nodes. By Definition 1.3 (weak consistency), lower-priority conflicting nodes are already dominated by the Mandatory node. Their removal does not change the set of valid artifacts, since the Mandatory node takes precedence regardless. ∎

- **O7 (Dependency Closure):** Adds nodes from the full graph, never removes. Adding knowledge pieces can only increase semantic coverage, not reduce it. ∎

- **O8 (Semantic Compression):** Removes Informational and Deprecated nodes (which have `priorityWeight = 0` and cannot contribute to Mandatory constraints) and keeps only one Example per parent. Examples are illustrative, not prescriptive; their removal does not change which artifacts are valid or invalid. ∎

- **O9 (Conflict Resolution):** Resolves conflicts by applying the configured strategy (priority-based auto-resolution). The winning node in a conflict is the one that would have prevailed under the knowledge base's own priority rules. Therefore the resolved CEC is equivalent to what a correct implementation would produce when guided by the original conflicting knowledge. ∎

> **Corollary 5.2.1:** The composition of all optimization passes is sound: `(O9 ∘ O8 ∘ ... ∘ O1)(G) ≡_M G`.

---

## 6. Complexity Analysis

### 6.1 Compilation Phase Complexity

| Pass | Operation | Time Complexity | Space Complexity |
|------|-----------|-----------------|-----------------|
| P1: Document Parser | Parse `d` documents, total size `n` chars | O(n) | O(n) |
| P2: Knowledge Extractor | Apply `r` extraction rules to `s` sections | O(r · s) | O(s) |
| P3: Relationship Discoverer | Pairwise name matching among `v` nodes | O(v²) | O(v²) edges |
| P4: Ontology Mapper | Schema validation for `v` nodes | O(v · p) where `p` is avg properties per node | O(v) |
| P5: Conflict Detector | Check all pairs for conflict predicates | O(v²) | O(c) conflicts |
| P6: Knowledge Normalizer | Semantic hash grouping | O(v log v) sort + O(v) merge | O(v) |
| P7: Graph Constructor | Insert `v` nodes and `e` edges | O(v + e) | O(v + e) |
| **Total Compilation** | | **O(v² + n)** dominated by P3, P5 | **O(v² + n)** |

### 6.2 Optimization Phase Complexity

| Pass | Time Complexity | Space Overhead |
|------|-----------------|---------------|
| O1: Dead Knowledge Elimination | O(V + E) BFS | O(V) visited set |
| O2: Duplicate Rule Folding | O(V log V) hash sort | O(V) hash table |
| O3: Capability Folding | O(V + E) | O(V) membership map |
| O4: Context Compression | O(V log V) sort by score + O(V) trim | O(V) |
| O5: Rule Inlining | O(V + E) | O(V) inlined map |
| O6: Priority Resolution | O(V + E) | O(V) |
| O7: Dependency Closure | O(V · E) worst case (transitive closure) | O(V²) adjacency |
| O8: Semantic Compression | O(V + E) | O(V) |
| O9: Conflict Resolution | O(C) where C = conflict count | O(C) |
| **Total Optimization** | **O(V · E)** dominated by O7 | **O(V²)** |

### 6.3 Runtime Phase Complexity

| Operation | Time Complexity | Notes |
|-----------|-----------------|-------|
| Mission Resolution | O(h · v) where h = hint count, v = graph nodes | Domain hint lookup |
| Graph Traversal (BFS) | O((V + E) log V) | Priority queue BFS |
| Dependency Resolution | O(V · E) | Transitive closure |
| CEC Assembly | O(V) | Linear scan of optimized subgraph |
| Context Projection | O(V · R) where R = role count | Per-role filter |
| Execution Planning | O(T²) where T = task count | Task dependency graph |
| **Total Per Mission** | **O((V + E) log V + V · E)** | Dominated by dep. resolution |

### 6.4 Cache Impact

With an effective CEC cache:

| Scenario | Latency | Without Cache |
|---------|---------|--------------|
| Cache hit | O(1) lookup + O(digest verification) | N/A |
| Cache miss, same graph | O((V + E) log V + V · E) | Same |
| Cache miss, incremental update | O(affected_V · E) | O(V · E) |

---

## 7. The Knowledge Compilation Language Hierarchy

To position KDL (the Knowledge Definition Language) in the formal language hierarchy:

> **Theorem 7.1 (KDL Grammar Class).**
> The Knowledge Definition Language (KDL) as specified in LAS-004 is a context-free language (CFL). Its grammar is expressible in Backus-Naur Form (BNF/EBNF) and parseable by a pushdown automaton.

*Proof sketch:* The KDL grammar (LAS-004 §2) consists of nested block structures (node definitions containing property assignments and edge blocks) with no context-sensitive constraints beyond semantic well-formedness rules. The context-free grammar is given explicitly in LAS-004. Semantic well-formedness rules (e.g., edge types must be valid LAS-003 EdgeType values) are checked in a separate semantic analysis phase, not the grammar itself. ∎

**Implication:** KDL can be parsed with standard LL(k) or LALR(1) parsing techniques. No exotic parsing machinery is required.

> **Corollary 7.1.1:** The Knowledge Extraction pass (P2, operating on natural language markdown) is NOT a context-free language recognition problem — it is a probabilistic pattern matching problem over unstructured text. This is why P2 uses heuristic rules rather than formal grammar parsing, and why confidence scores are assigned rather than binary parse results.

---

## 8. Open Theoretical Questions

The following questions remain open and represent future research directions:

### Q1: Completeness of the Ontology

**Question:** Is the LAS-003 ontology complete — can all computable enterprise engineering knowledge be represented as some combination of the 12 node types?

**Current status:** We conjecture that it is *practically* complete for software engineering knowledge, but a formal completeness proof would require a definition of "all software engineering knowledge" which is itself an open problem.

### Q2: Optimal Optimization Ordering

**Question:** Is there an ordering of the 9 optimization passes that provably produces the smallest CEC for all inputs?

**Current status:** We conjecture that the current ordering (O1→O2→O3→O4→O5→O6→O7→O8→O9) is locally optimal but not globally optimal. A fixed-point iteration approach (running passes until no further reduction occurs) might produce better results at higher computational cost.

### Q3: Semantic Equivalence Decidability

**Question:** Is the semantic equivalence relation `≡_M` decidable?

**Current status:** Definition 1.6 requires checking whether any artifact produced by any compliant execution engine satisfies all Mandatory constraints. Since the set of execution engines and artifacts is not finite, direct verification is undecidable in general. However, a *conservative approximation* — checking whether all Mandatory knowledge nodes from the full applicable set are present in the CEC or subsumed by equivalent representations — is decidable and sufficient for practical purposes.

### Q4: Knowledge Graph Optimality

**Question:** Is a labeled directed graph the optimal structure for the intermediate representation of enterprise knowledge, or would a hypergraph, tensor, or lattice provide better properties?

**Current status:** We chose directed graphs for their well-understood algorithms (BFS, topological sort, transitive closure) and tooling ecosystem. Hypergraphs would better represent knowledge pieces that involve more than two nodes (e.g., "if A and B, then C is required"), but at the cost of significantly more complex algorithms. This is an open research question.

### Q5: Cross-Repository Knowledge Compilation

**Question:** Can the Knowledge Compiler handle knowledge that spans multiple repositories or organizational boundaries, where different knowledge bases may have conflicting priorities?

**Current status:** The current model assumes a single knowledge base per compilation unit. Cross-repository compilation requires a federated conflict resolution model that is not yet defined. This is a major future research direction.

---

## 9. Formal Notation Reference

| Symbol | Meaning |
|--------|---------|
| `K` | Enterprise knowledge base (finite set of knowledge pieces) |
| `k, kᵢ, kⱼ` | Individual knowledge pieces |
| `τ(k)` | Type of knowledge piece `k` (from LAS-003 NodeTypes) |
| `π(k)` | Priority of knowledge piece `k` |
| `σ(k)` | Scope set of knowledge piece `k` |
| `M` | Mission |
| `CEC(M, K)` | Compiled Execution Context for mission `M` over knowledge base `K` |
| `C₁ ≡_M C₂` | Semantic equivalence of CECs `C₁` and `C₂` under mission `M` |
| `rel(k, M)` | Relevance of knowledge piece `k` to mission `M` ∈ [0, 1] |
| `𝕋` | Set of all engineering contexts |
| `𝔸` | Set of all software artifacts |
| `V` | Number of nodes in Knowledge Graph (for complexity analysis) |
| `E` | Number of edges in Knowledge Graph |
| `Oᵢ` | Optimization pass i ∈ {1, ..., 9} |
