# LAS-007 — Optimization Engine

**Document ID:** LAS-007  
**Title:** Optimization Engine  
**Version:** 0.1  
**Status:** Draft  
**Layer:** Compiler Infrastructure  
**Depends On:** LAS-002 (Knowledge Theory — soundness proofs), LAS-006 (Knowledge IR)  
**Used By:** LAS-005 (Compiler Pass Specification — optimization pass pseudocode), LAS-008 (CEC)

---

## 1. Overview

The **Optimization Engine** is the subsystem responsible for transforming a full Knowledge Graph subgraph (produced by graph traversal) into a minimal, mission-optimized KIR subgraph from which the CEC is assembled.

This document provides the formal treatment of the optimization framework — the theory that justifies *why* the optimization passes are correct, the ordering theory that explains *why* they run in the order they do, and the advanced optimization strategies that go beyond the base passes described in LAS-005.

---

## 2. Formal Optimization Framework

### 2.1 Optimization as a Transformation

> **Definition 2.1 (Optimization Pass).**
> An optimization pass `Oᵢ` is a computable function:
> ```
> Oᵢ : KIRSubgraph × Mission → KIRSubgraph
> ```
> such that for all inputs `(G, M)`:
> 1. **Termination:** `Oᵢ(G, M)` terminates in finite time
> 2. **Monotonicity:** `|Oᵢ(G, M).nodes| ≤ |G.nodes|` OR `i = 7` (O7 is the only pass that can add nodes via dependency closure)
> 3. **Soundness:** `Oᵢ(G, M) ≡_M G` (from LAS-002 Theorem 5.2)

> **Definition 2.2 (Optimization Pipeline).**
> The full optimization pipeline `Π` is the composition of all passes:
> ```
> Π(G, M) = (O9 ∘ O8 ∘ O7 ∘ O6 ∘ O5 ∘ O4 ∘ O3 ∘ O2 ∘ O1)(G, M)
> ```

> **Theorem 2.1 (Pipeline Soundness).**
> `Π(G, M) ≡_M G` (the full pipeline is semantically sound).
>
> *Proof:* By LAS-002 Corollary 5.2.1 (composition of sound passes is sound). ∎

### 2.2 Reduction Ratio

> **Definition 2.3 (Reduction Ratio).**
> The *reduction ratio* `ρ(Π, G, M)` of the optimization pipeline for a given input is:
> ```
> ρ(Π, G, M) = |G.nodes| / |Π(G, M).nodes|
> ```
> A higher ratio indicates greater compression. `ρ ≥ 1` always (the pipeline never increases node count beyond the O7 additions, which are bounded by the full Knowledge Graph size).

**Empirical target:** For typical enterprise knowledge bases (50–500 rules) and standard missions (implementation, review, test generation), the target reduction ratio is `ρ ≥ 5`.

---

## 3. Pass Ordering Theory

### 3.1 Why Order Matters

Optimization passes interact — the output of one affects the efficiency of another. Choosing the wrong order can miss optimization opportunities or require multiple iterations to converge.

**Key interactions:**

| Earlier Pass | Later Pass | Interaction |
|-------------|-----------|-------------|
| O1 (Dead Elim) | O2 (Dup Fold) | O1 reduces the candidate set for O2, making O2 faster |
| O2 (Dup Fold) | O3 (Cap Fold) | O2 must run before O3, or folded capabilities may re-introduce duplicates |
| O4 (Compress) | O7 (Dep Close) | O4 must run before O7 to avoid re-adding nodes that were correctly pruned |
| O7 (Dep Close) | O8 (Sem Compress) | O7 may add nodes that O8 then correctly removes (Deprecated, Informational) |
| O5 (Inline) | O6 (Priority) | Inlining first reduces the surface area for priority resolution |
| O6 (Priority) | O9 (Conflict) | Priority resolution first means O9 only handles genuine ambiguities |

### 3.2 Ordering Proof

> **Theorem 3.1 (Canonical Ordering Minimality).**
> The ordering O1 → O2 → O3 → O4 → O5 → O6 → O7 → O8 → O9 produces a result with `|Π(G, M).nodes|` that is locally minimized: no single adjacent transposition of passes produces a strictly smaller result on average across a representative corpus.

*Proof sketch:* This is an empirical claim (the phrase "locally minimized" makes it falsifiable through benchmarking rather than strictly provable). The theoretical justification is:

- O1 must be first: dead nodes are meaningless to all subsequent passes
- O2 must precede O3: capability folding depends on deduplicated member sets
- O4 must precede O7: context compression decides relevance budget before dependency closure adds mandatory dependencies
- O7 must precede O8: O8 removes low-priority nodes but O7 may add back Mandatory dependencies that O8 must retain
- O9 must be last: final conflict resolution determines what goes into the CEC

The exact positions of O5 and O6 relative to each other and to O4/O7 are less critical and may be reordered in future versions. ∎

### 3.3 Fixed-Point Iteration

A single pass through O1–O9 may not find all optimization opportunities. For example, O1 (Dead Elimination) after O4 (Compression) could eliminate additional nodes that were made unreachable by the compression.

> **Definition 3.1 (Fixed-Point).**
> A KIRSubgraph `G` is a *fixed point* of the optimization pipeline `Π` if `|Π(G, M).nodes| = |G.nodes|` (running the pipeline again produces the same node count).

> **Theorem 3.2 (Convergence).**
> For any finite KIRSubgraph `G`, iterating the optimization pipeline converges to a fixed point in at most `|G.nodes|` iterations.

*Proof:* Each iteration of Π either reduces the node count by at least 1 or leaves it unchanged. Since node count is bounded below by 0, the iteration sequence is monotonically non-increasing and must converge. ∎

**Default configuration:** The optimizer runs a single pass (O1–O9) by default. Fixed-point iteration can be enabled with `config.fixedPointIteration = true` at the cost of higher compilation time.

---

## 4. Pass-Level Formal Specifications

This section provides the formal specification for each optimization pass — supplementing the pseudocode in LAS-005 with correctness arguments and design rationale.

### O1 — Dead Knowledge Elimination

**Formal specification:**
```
Input:  G = (V, E, M)  where V = nodes, E = edges, M = mission
Output: G' = (V', E', M)  where V' ⊆ V, E' ⊆ E

V' = { v ∈ V | BFS_reachable(v, M.anchorNodes, G) }
E' = { e ∈ E | e.source ∈ V' ∧ e.target ∈ V' }
```

**Correctness:** Unreachable nodes have `pathRelevance = 0`, hence `rel(v, M) ≤ β · priorityWeight(v)`. For non-Mandatory nodes, this is below the mandatory threshold, so they can be safely removed (from LAS-002 Theorem 5.2-O1). For Mandatory nodes, they are still reachable from anchor nodes by definition (the mission specifies them as requirements), so they are never removed by O1.

**Edge case — disconnected graph:** If a Mandatory node exists in the knowledge graph but has no path connecting it to any mission anchor node (i.e., the knowledge graph has disconnected components), the node is not reached by BFS and would be eliminated. To prevent this, the graph traversal (LAS-010) seeds with anchor nodes found by domain hint matching, which should connect all relevant Mandatory nodes. If this fails, a `KRT-001` diagnostic is emitted.

---

### O2 — Duplicate Rule Folding

**Semantic Hash Definition:**
```
semanticHash(node) = SHA-256(
  node.canonicalType ||
  sort(node.scope).join(',') ||
  normalize(node.typedProperties.directive || node.typedProperties.name) ||
  node.priority
)
```

**Normalization for hashing:**
- Lowercase all strings
- Remove punctuation except for structural keywords (MUST, SHOULD, NOT)
- Normalize whitespace to single spaces
- Sort array-valued properties

**Canonical Node Selection:**
When multiple nodes have the same semantic hash, the canonical node is selected by:
1. Highest `extractionConfidence`
2. If equal: node from KDL source (over markdown)
3. If still equal: most recently modified source document
4. If still equal: lexicographically smaller `id`

---

### O3 — Capability Folding

**Folding Threshold:** A cluster of member nodes is folded into its parent Capability if and only if:
- The Capability has ≥ 3 member nodes, AND
- None of the member nodes are shared with other Capabilities in the subgraph

**Why shared members are not folded:** If a Rule node belongs to both the Authentication Capability and the Security Policy Capability, folding it into either would remove it from the other's scope. The KIR preserves shared members as standalone nodes.

**Expanded nodes:** Folded member nodes are stored in `capability.expandedNodes` in the CEC. The Model Adapter can request expansion of a capability at rendering time, causing the adapter to insert the full member content into the prompt rather than the capability summary.

---

### O4 — Context Compression

**Relevance Function (from LAS-002 §4.3):**
```
rel(k, M) = 0.50 · pathRelevance(k, M) 
           + 0.35 · priorityWeight(k) 
           + 0.15 · scopeMatch(k, M)
```

**Compression Strategy:**
1. Compute `rel(k, M)` for all `k ∈ G.nodes`
2. Partition nodes into: `Mandatory` (always kept) and `Non-mandatory` (scored)
3. Budget = `config.targetContextBudget - |Mandatory|`
4. Sort Non-mandatory nodes by `rel(k, M)` descending
5. Keep top-`Budget` non-mandatory nodes; prune the rest

**Adaptive Budgeting:** If `|Mandatory| > config.targetContextBudget`, the budget is automatically extended with a `KRT-004` warning (CEC may exceed token limits). The Model Adapter's token budget manager (LAS-009 §6) handles the downstream token reduction.

---

### O5 — Rule Inlining

**Inlining Eligibility:**
A node `r` is eligible for inlining into its parent `p` if:
1. `r.canonicalType = Rule`
2. All outgoing edges of `r` (from `r`) are of type `exemplifies` only (no `requires`, `depends_on`, or `implements` edges)
3. `r.typedProperties` has ≤ 3 entries
4. `r.priority ≤ Recommended` (Mandatory rules are never inlined — they must remain as explicit standalone constraint entries in the CEC)
5. `r` has exactly one incoming `requires` edge (only one parent depends on it)

**Why Mandatory rules are not inlined:** Mandatory rules must appear as explicit `ConstraintEntry` objects in the CEC for the verifier (LAS-008 Invariant I2) to confirm they are present. Inlining hides them, which would cause I2 to fail.

---

### O6 — Priority Resolution

**Priority Ordering (highest to lowest):**
```
Mandatory (5) > Recommended (4) > Optional (3) > Informational (2) > Deprecated (1)
```

**Conflict resolution by priority:**
If nodes `A` and `B` are in a `conflicts_with` relationship and `π(A) > π(B)`:
- `B` is removed from the subgraph (status: Deprecated)
- All of `B`'s edges are analyzed:
  - Edges to/from Mandatory nodes: retained, redirected to `A` if applicable
  - Edges to/from non-Mandatory nodes: removed

**Equal-priority conflicts:** When `π(A) = π(B)`, priority resolution cannot auto-resolve. The conflict is escalated to O9.

---

### O7 — Dependency Closure

**Closure Algorithm Correctness:**
The transitive closure is computed iteratively (Worklist algorithm from LAS-010 §5.1). The algorithm terminates because:
1. The full Knowledge Graph is finite
2. Each iteration adds at most one new node to the closure set
3. Once a node is added, it is never removed (closure is monotone)
4. Therefore the algorithm terminates in at most `|full_graph.nodes|` iterations

**Hard vs. Soft Dependencies:**
- `requires` edges: **Hard dependency** — the target must be in the CEC or the dependent node fails invariant I2
- `depends_on` edges: **Hard dependency** — same as `requires`
- `related_to` edges: **Soft dependency** — target is added only if it fits within the budget after hard deps are resolved

---

### O8 — Semantic Compression

**Compression Guarantee:**
After O8 completes:
1. `∀ node ∈ G' : node.priority ∉ {Informational, Deprecated}`
2. `∀ (rule, examples) ∈ G' : |{e ∈ examples : e.type = Example}| ≤ 1`

**Information Loss Audit:** O8 records all removed nodes in the `CompressionReport` (attached to the KIRSubgraph). The CEC includes this report, allowing downstream tools to request the full detail from the Knowledge Graph if needed.

---

### O9 — Conflict Resolution (Final Pass)

**Resolution Strategies:**

| Strategy | Algorithm | When to Use |
|----------|-----------|-------------|
| `priority` | Higher-priority node wins; loser removed | When priority clearly indicates intended winner |
| `recency` | Most recently authored node wins; loser removed | When knowledge has been explicitly updated/superseded |
| `manual` | Both nodes kept; conflict embedded as `ConflictWarning` in CEC | When human judgment is required |

**`recency` Implementation:**
Recency is determined by `sourceDocument.lastModified`. If both nodes come from the same source document, `priority` is used as a tiebreaker.

**Conflict Warning Format in CEC:**
```json
{
  "conflictId": "conflict-uuid",
  "conflictType": "DirectConflict",
  "involvedNodes": ["node-A-id", "node-B-id"],
  "description": "Node 'JWT Constraint' (mandatory) directly conflicts with 'Session Auth Pattern' (recommended). Priority resolution: JWT wins, Session Auth removed.",
  "severity": "Warning",
  "suggestedResolution": "Remove 'Session Auth Pattern' from source knowledge or mark it Deprecated."
}
```

---

## 5. Advanced Optimization Strategies

These optimizations are not implemented in v0.1 but are reserved for future versions.

### 5.1 Context Memoization

**Problem:** Two missions with overlapping domain scopes (e.g., "Implement Login API" and "Implement Password Reset API") produce CECs with significant overlap. Both require Authentication constraints, JWT rules, and security patterns.

**Solution:** Memoize CEC *subgraphs* keyed by capability. When assembling a CEC for "Implement Password Reset API," the compiler can reuse the memoized Authentication capability subgraph from the previous "Implement Login API" CEC rather than recomputing it.

```
memoizedCapabilities: Map<CapabilityId × MissionScope, KIRSubgraph>

assemble_cec(mission, graph):
  FOR EACH capability IN mission.requiredCapabilities:
    cacheKey = capability.id + ':' + mission.scope.sort().join(',')
    IF memoizedCapabilities.has(cacheKey):
      capSubgraph = memoizedCapabilities.get(cacheKey)
    ELSE:
      capSubgraph = optimizeCapability(capability, mission, graph)
      memoizedCapabilities.set(cacheKey, capSubgraph)
    merge capSubgraph into cecSubgraph
```

**Expected benefit:** 30–60% reduction in optimization time for missions with overlapping capability requirements.

### 5.2 Speculative CEC Prefetching

**Problem:** In SDD workflows, missions are issued in a predictable sequence (specification → architecture → implementation → testing). The compiler could speculatively compile the CEC for the next mission while the current mission is executing.

**Solution:** After each CEC is dispatched to a model adapter, the runtime speculatively predicts the next mission type (based on the current mission type's typical successor) and begins compiling the predicted CEC in the background.

```
MISSION_SUCCESSOR_PROBABILITIES = {
  Architecture:    { Implementation: 0.7, Documentation: 0.2, Review: 0.1 },
  Implementation:  { TestGeneration: 0.6, Review: 0.25, Documentation: 0.15 },
  TestGeneration:  { Review: 0.5, Documentation: 0.3, Implementation: 0.2 },
}

onCECDispatched(cec):
  currentType = cec.mission.missionType
  predictions = MISSION_SUCCESSOR_PROBABILITIES[currentType]
  topPrediction = argmax(predictions)
  IF predictions[topPrediction] >= 0.5:
    speculativeCompile(topPrediction, cec.mission.scope)
```

**Expected benefit:** Eliminate CEC compilation latency for predictable multi-step workflows.

### 5.3 Knowledge Delta Encoding

**Problem:** CECs for sequential missions in the same workflow are often highly similar. "Implement UserController" and "Implement OrderController" may share 90% of their knowledge nodes.

**Solution:** Encode each CEC as a delta from a base CEC rather than a full CEC:

```
DeltaCEC {
  baseCECId: CECId          // reference to base CEC
  additions: KIRNode[]      // nodes in this CEC not in base
  removals: KIRNodeId[]     // nodes in base not in this CEC
  modifications: Map<KIRNodeId, Partial<KIRNode>>  // changed node properties
}
```

**Expected benefit:** 70–80% reduction in CEC storage size for sequential missions; faster serialization and deserialization.

### 5.4 Adaptive Compression

**Problem:** The fixed relevance weights (α=0.50, β=0.35, γ=0.15) are tuned for general use but may not be optimal for all mission types.

**Solution:** After each mission completes, compare the CEC's constraint set against the actual artifact produced by the execution engine. Track which constraints were actually relevant to the artifact. Use this feedback to adjust the relevance weights per mission type:

```
ADAPTIVE_WEIGHTS: Map<MissionType, {α, β, γ}> = {
  Implementation:  { α: 0.50, β: 0.35, γ: 0.15 },  // default
  SecurityAudit:   { α: 0.30, β: 0.60, γ: 0.10 },  // prioritize priority weight
  Documentation:   { α: 0.65, β: 0.20, γ: 0.15 },  // prioritize path proximity
  TestGeneration:  { α: 0.45, β: 0.35, γ: 0.20 },  // increase scope matching
}
```

**Expected benefit:** Better constraint compliance rates for mission types that differ from the general case.

---

## 6. Optimization Engine Configuration

```typescript
interface OptimizationConfig {
  // Pass enablement
  enabledPasses: OptimizationPassId[]    // defaults to all passes
  disabledPasses: OptimizationPassId[]   // override to skip specific passes

  // O1: Dead Knowledge Elimination
  o1MaxTraversalDepth: number            // default: 6
  o1NodeCap: number                      // hard cap on traversal (default: 500)
  o1EdgeWeightThreshold: number          // min edge weight to traverse (default: 0.4)

  // O2: Duplicate Rule Folding
  o2SemanticHashAlgorithm: 'SHA256'      // extensible in future

  // O3: Capability Folding
  o3MinMembersToFold: number             // min members before folding (default: 3)
  o3FoldSharedMembers: boolean           // fold members shared across capabilities (default: false)

  // O4: Context Compression
  o4TargetContextBudget: number          // max nodes after compression (default: 50)
  o4RelevanceWeights: { alpha: number, beta: number, gamma: number }  // must sum to 1.0
  o4AlwaysKeepPriority: Priority         // nodes at or above this priority are never pruned (default: Mandatory)

  // O5: Rule Inlining
  o5MaxPropertiesForInlining: number     // default: 3
  o5MaxPriorityForInlining: Priority     // rules above this are not inlined (default: Recommended)

  // O7: Dependency Closure
  o7MaxClosureDepth: number              // prevent infinite expansion (default: 10)
  o7IncludeSoftDependencies: boolean     // include related_to edges in closure (default: false)

  // O8: Semantic Compression
  o8MaxExamplesPerNode: number           // default: 1

  // O9: Conflict Resolution
  o9Strategy: 'priority' | 'recency' | 'manual'  // default: 'priority'

  // Fixed-point iteration
  fixedPointIteration: boolean           // default: false
  fixedPointMaxIterations: number        // safety limit (default: 5)

  // Advanced (v0.2+)
  enableContextMemoization: boolean      // default: false
  enableSpeculativePrefetch: boolean     // default: false
  enableDeltaEncoding: boolean           // default: false
  enableAdaptiveCompression: boolean     // default: false
}
```

---

## 7. Optimization Metrics and Observability

The Optimization Engine emits structured metrics for each compilation:

```typescript
interface OptimizationReport {
  compilationId: string
  missionId: string
  
  // Per-pass stats
  passStats: Map<OptimizationPassId, KIRPassStats>
  
  // Aggregate stats
  inputNodeCount: number              // nodes entering O1
  outputNodeCount: number             // nodes exiting O9
  reductionRatio: number              // inputNodeCount / outputNodeCount
  totalDurationMs: number
  
  // Breakdown by elimination reason
  eliminatedByPass: Map<string, number>  // pass → nodes eliminated
  
  // Token estimate
  estimatedTokensBefore: number       // if full graph were used
  estimatedTokensAfter: number        // CEC token estimate
  tokenReductionPercent: number
  
  // Quality indicators
  mandatoryNodeCount: number          // Mandatory nodes in output
  conflictsResolved: number
  conflictsUnresolved: number
  compressionWarnings: string[]
}
```

This report is attached to the CEC header's `compressionStats` and is also emitted to the CLI output and REST API response.
