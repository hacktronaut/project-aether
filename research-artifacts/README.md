# Project Aether — Research Artifacts

This directory contains all research artifacts for Project Aether: the Knowledge Computing Platform.

---

## Specification Suite

All 10 LAS (Language and Architecture Specification) documents:

| ID | Title | Status | Size |
|----|-------|--------|------|
| [LAS-001](./specifications/LAS-001-vision.md) | Vision & Design Philosophy | ✅ Draft | ~12 KB |
| [LAS-002](./specifications/LAS-002-knowledge-theory.md) | Knowledge Theory | ✅ Draft | ~18 KB |
| [LAS-003](./specifications/LAS-003-knowledge-ontology.md) | Knowledge Ontology | ✅ Draft | ~28 KB |
| [LAS-004](./specifications/LAS-004-knowledge-definition-language.md) | Knowledge Definition Language | ✅ Draft | ~20 KB |
| [LAS-005](./specifications/LAS-005-compiler-pass-specification.md) | Compiler Pass Specification | ✅ Draft | ~33 KB |
| [LAS-006](./specifications/LAS-006-knowledge-ir.md) | Knowledge IR (KIR) | ✅ Draft | ~22 KB |
| [LAS-007](./specifications/LAS-007-optimization-engine.md) | Optimization Engine | ✅ Draft | ~20 KB |
| [LAS-008](./specifications/LAS-008-cec-specification.md) | Compiled Execution Context | ✅ Draft | ~24 KB |
| [LAS-009](./specifications/LAS-009-model-adapter-specification.md) | Model Adapter Protocol | ✅ Draft | ~26 KB |
| [LAS-010](./specifications/LAS-010-runtime-specification.md) | Runtime Specification | ✅ Draft | ~31 KB |

---

## Platform Overview

- [aether-platform-overview.md](./aether-platform-overview.md) — High-level platform flow, use cases (SDD, General AI, Multi-agent), and the knowledge compilation paradigm explained for first-time readers

## Planning Documents

- [next-steps-research-plan.md](./next-steps-research-plan.md) — 5-track research roadmap: specification, theory, implementation, evaluation, publication/IP

---

## Reading Order

**For a first-time reader:**
1. LAS-001 (Vision) — understand what and why
2. aether-platform-overview.md — understand the end-to-end flow
3. LAS-002 (Knowledge Theory) — understand the formal foundation
4. LAS-003 (Knowledge Ontology) — understand the type system

**For an implementer:**
1. LAS-003 → LAS-004 → LAS-006 (types, language, IR)
2. LAS-005 (compiler passes — the implementation roadmap)
3. LAS-007 (optimization theory)
4. LAS-008 → LAS-009 → LAS-010 (CEC, adapters, runtime)

**For a researcher:**
1. LAS-001 → LAS-002 (vision + theory)
2. LAS-007 (optimization formal treatment)
3. Open questions in LAS-002 §8 and next-steps-research-plan.md

---

## Specification Dependency Graph

```
LAS-001 Vision
    └── LAS-002 Knowledge Theory
            └── LAS-003 Knowledge Ontology
                    ├── LAS-004 KDL Language
                    │       └── (used by LAS-005 P1 parser)
                    ├── LAS-005 Compiler Passes
                    │       ├── LAS-006 Knowledge IR  (working representation)
                    │       └── LAS-007 Optimization Engine (formal treatment)
                    ├── LAS-008 CEC Specification
                    │       └── LAS-009 Model Adapter Protocol
                    └── LAS-010 Runtime Specification
                            ├── uses LAS-005 (invokes optimization passes)
                            ├── uses LAS-006 (creates KIRSubgraph)
                            └── produces LAS-008 (assembles CEC)
```

---

## Source Research Data

The `../research-data/` directory contains the original research documents that informed this specification suite:

- `aether-specification-flow.md` — Full architectural distillation and decision log
- `aether-technical-project-brief.md` — Core architectural rationale and planned deliverables
- `spect-driven-development-process.md` — Original SDD research that led to Project Aether
