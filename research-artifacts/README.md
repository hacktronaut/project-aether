# Project Aether — Research Artifacts

## Knowledge Computing Platform (KCP)

This directory contains the formal design specifications for **Project Aether**, a Knowledge Computing Platform that introduces a compiler-based architecture between enterprise engineering knowledge and AI execution engines.

---

## Documents

### Platform Overview
| File | Description |
|------|-------------|
| [aether-platform-overview.md](./aether-platform-overview.md) | High-level flow document — how the platform works end-to-end for users |

### Formal Specifications

| LAS ID | File | Status | Depends On |
|--------|------|--------|------------|
| LAS-003 | [LAS-003-knowledge-ontology.md](./specifications/LAS-003-knowledge-ontology.md) | ✅ Complete | — |
| LAS-005 | [LAS-005-compiler-pass-specification.md](./specifications/LAS-005-compiler-pass-specification.md) | ✅ Complete | LAS-003 |
| LAS-008 | [LAS-008-cec-specification.md](./specifications/LAS-008-cec-specification.md) | ✅ Complete | LAS-003, LAS-005 |
| LAS-009 | [LAS-009-model-adapter-specification.md](./specifications/LAS-009-model-adapter-specification.md) | ✅ Complete | LAS-008 |
| LAS-010 | [LAS-010-runtime-specification.md](./specifications/LAS-010-runtime-specification.md) | ✅ Complete | LAS-003, LAS-005, LAS-008 |

---

## Specification Map

```
LAS-003 Knowledge Ontology
  └── defines the type system all other specs depend on
        │
        ├── LAS-005 Compiler Pass Specification
        │     └── how enterprise docs are compiled into the Knowledge Graph
        │
        ├── LAS-008 CEC Specification
        │     └── the compiled mission-specific execution package
        │           │
        │           └── LAS-009 Model Adapter Specification
        │                 └── how CEC is rendered for GPT, Claude, MCP, etc.
        │
        └── LAS-010 Runtime Specification
              └── graph traversal, dependency resolution, execution planning
```

---

## Architecture Layers Covered

```
Layer 1: Knowledge Sources       → Raw enterprise docs (not specified here)
Layer 2: Knowledge Compiler      → LAS-005 Compiler Pass Specification
Layer 3: Knowledge Graph         → LAS-003 Knowledge Ontology
Layer 4: Optimization Passes     → LAS-005 (optimization section)
Layer 5: Compiled Exec Context   → LAS-008 CEC Specification
Layer 6: Model Adapter           → LAS-009 Model Adapter Specification
Layer 7: Execution Engine        → LAS-010 Runtime Specification
Layer 8: Artifacts               → Output (not specified here)
```

---

## Reading Order

**For a new contributor:**
1. Start with `aether-platform-overview.md` for the conceptual understanding
2. Read `LAS-003` to understand the knowledge type system
3. Read `LAS-005` to understand how knowledge is compiled
4. Read `LAS-008` to understand the CEC output format
5. Read `LAS-009` to understand model adapter protocol
6. Read `LAS-010` to understand runtime execution

**For implementation work:**
- Start with LAS-003 (all code will reference these types)
- Then LAS-005 (core compiler pipeline)
- Then LAS-008 + LAS-010 (runtime)
- Then LAS-009 (adapters, can be built independently)
