# LAS-004 — Knowledge Definition Language (KDL)

**Document ID:** LAS-004  
**Title:** Knowledge Definition Language Specification  
**Version:** 0.1  
**Status:** Draft  
**Layer:** Source Language  
**Depends On:** LAS-001 (Vision), LAS-002 (Knowledge Theory), LAS-003 (Knowledge Ontology)  
**Used By:** LAS-005 (Compiler — P1 parser accepts KDL), LAS-006 (Knowledge IR)

---

## 1. Overview

The **Knowledge Definition Language (KDL)** is the canonical source language for authoring enterprise engineering knowledge in Project Aether.

While the Knowledge Compiler (LAS-005) can extract knowledge from markdown, YAML, and JSON, KDL is the native, structured format. KDL knowledge is:
- **Unambiguous** — types are explicit, not inferred
- **High-confidence** — no heuristic extraction; all nodes have confidence 1.0
- **Structured** — properties are typed and schema-validated
- **Composable** — KDL modules reference each other cleanly

KDL is designed to be:
- Written by senior engineers defining team standards
- Read by the compiler, not by LLMs
- Version-controlled alongside code
- Validated by a language server (for IDE tooling)

---

## 2. Grammar (Complete EBNF)

### 2.1 Lexical Grammar

```ebnf
(* Whitespace and comments *)
whitespace    ::= ' ' | '\t' | '\r' | '\n'
comment       ::= '//' [^'\n']* '\n'
              |   '/*' .* '*/'            (* non-greedy *)

(* Primitive tokens *)
identifier    ::= letter (letter | digit | '_' | '-')*
letter        ::= 'a'..'z' | 'A'..'Z' | '_'
digit         ::= '0'..'9'
integer       ::= '-'? digit+
float         ::= '-'? digit+ '.' digit+ (('e' | 'E') ('+' | '-')? digit+)?
boolean       ::= 'true' | 'false'
string        ::= '"' (escape | [^'"'\\])* '"'
escape        ::= '\\' ('"' | '\\' | '/' | 'b' | 'f' | 'n' | 'r' | 't' | unicode)
unicode       ::= 'u' hex hex hex hex
hex           ::= digit | 'a'..'f' | 'A'..'F'
version       ::= '"' digit+ '.' digit+ '.' digit+ (pre_release)? '"'
pre_release   ::= '-' identifier ('.' identifier)*

(* Node type keywords — LAS-003 NodeTypes *)
node_type     ::= 'rule' | 'constraint' | 'pattern' | 'capability' | 'workflow'
              |   'decision' | 'policy' | 'technology' | 'example'
              |   'quality-gate' | 'role' | 'api-contract'

(* Edge type keywords — LAS-003 EdgeTypes *)
edge_type     ::= 'requires' | 'implements' | 'extends' | 'related-to'
              |   'conflicts-with' | 'supersedes' | 'exemplifies' | 'governs'
              |   'depends-on' | 'validates' | 'derives-from' | 'composed-of'
              |   'triggered-by' | 'produces'

(* Priority keywords *)
priority      ::= 'mandatory' | 'recommended' | 'optional' | 'informational' | 'deprecated'

(* Scope keywords — can be extended by user modules *)
scope         ::= 'backend' | 'frontend' | 'security' | 'infrastructure'
              |   'database' | 'api' | 'testing' | 'devops' | 'documentation'
              |   'cross-cutting' | identifier

(* Impact and enforcement keywords *)
impact        ::= 'critical' | 'high' | 'medium' | 'low'
enforcement   ::= 'strict' | 'advisory' | 'automated'
```

### 2.2 Syntactic Grammar

```ebnf
(* Top-level file structure *)
kdl_file      ::= module_header node_def* EOF

module_header ::= 'module' string ';'
                  ('version' version ';')?
                  ('imports' import_list ';')*
                  ('description' string ';')?

import_list   ::= import_stmt (',' import_stmt)*
import_stmt   ::= string ('as' identifier)?

(* Node definition *)
node_def      ::= node_type identifier '{' node_body '}'

node_body     ::= property* edge_block* annotation* node_def*

(* Properties — typed key-value pairs *)
property      ::= identifier ':' property_value ';'
property_value ::= string | integer | float | boolean | priority
               |   scope | impact | enforcement
               |   version | reference | string_list | scope_list

string_list   ::= '[' string (',' string)* ']'
scope_list    ::= '[' scope (',' scope)* ']'

(* Reference to another node in this module or imported module *)
reference     ::= identifier ('.' identifier)?

(* Edge declaration *)
edge_block    ::= edge_type '{' edge_target+ '}'
edge_target   ::= reference (edge_weight)? ';'
edge_weight   ::= '@' float

(* Annotations — metadata that does not affect semantics *)
annotation    ::= '@' identifier ('(' property_value ')')?  ';'

(* Comments are stripped by lexer — not part of syntax tree *)
```

### 2.3 Complete Grammar Example

```kdl
module "authentication-capability";
version "1.0.0";
imports "core-security" as security, "spring-patterns" as patterns;
description "Authentication capability for Spring Boot services";

capability Authentication {
  name: "Authentication";
  scope: [backend, security];
  description: "Complete JWT-based authentication capability";
  
  composed-of {
    JWTConstraint;
    RateLimitConstraint;
    AuthControllerPattern;
    AuditLoggingRule;
    AuthCapabilityTestGate;
  }
}

constraint JWTConstraint {
  name: "JWT Token Requirement";
  scope: [backend, security];
  priority: mandatory;
  constraintType: "Technical";
  directive: "All authentication endpoints MUST use JWT for token issuance and validation. Session-based authentication and Basic Auth are explicitly forbidden.";
  impact: critical;
  enforcement: strict;
  verification: "Import analysis: no HttpSession or BasicAuthenticationFilter in auth layer";

  conflicts-with {
    security.SessionAuth;
    security.BasicAuth;
  }
}

constraint RateLimitConstraint {
  name: "Rate Limiting on Auth Endpoints";
  scope: [backend, security];
  priority: mandatory;
  constraintType: "Security";
  directive: "All authentication endpoints (login, refresh, register) MUST implement rate limiting with a maximum of 10 requests per minute per IP address.";
  impact: critical;
  enforcement: strict;
  verification: "RateLimiter bean present in security config; endpoint annotated with @RateLimited";
  
  requires {
    RateLimiterTechnology;
  }
}

pattern AuthControllerPattern {
  name: "Authentication Controller Pattern";
  scope: [backend, security];
  priority: mandatory;
  patternType: "Architectural";
  applicability: "When: implementing any authentication endpoint";
  structure: "AuthController → AuthService → UserRepository + JWTService";
  rationale: "Separates HTTP concerns (controller) from business logic (service) and token management (JWTService). Prevents direct token manipulation in controllers.";
  
  requires {
    patterns.ServiceLayerPattern;
    patterns.RepositoryPattern;
  }
  
  exemplifies {
    AuthControllerExample;
  }
}

rule AuditLoggingRule {
  name: "Audit Logging for Auth Events";
  scope: [backend, security];
  priority: recommended;
  directive: "SHOULD log all authentication events (login, logout, failed attempts, token refresh) with user ID, timestamp, IP address, and outcome.";
  enforcement: advisory;
  verification: "AuditLog entries present in integration test output";
  
  requires {
    patterns.AuditLogPattern;
  }
}

technology RateLimiterTechnology {
  name: "Bucket4j";
  version: "^8.3.0";
  ecosystem: "Java/Maven";
  dependencyType: "Required";
  purpose: "Rate limiting for authentication endpoints";
  license: "Apache-2.0";
}

quality-gate AuthCapabilityTestGate {
  name: "Authentication Test Coverage Gate";
  scope: [backend, security, testing];
  priority: mandatory;
  gateType: "TestCoverage";
  metric: {
    name: "Line Coverage — Auth Layer",
    operator: ">=",
    value: 90,
    unit: "%"
  };
  blocking: true;
  measurement: "JaCoCo report filtered to com.example.auth package";
  automatable: true;
}

example AuthControllerExample {
  name: "AuthController Implementation";
  scope: [backend, security];
  language: "Java";
  framework: "Spring Boot 3.x";
  content: "
    @RestController
    @RequestMapping('/api/v1/auth')
    @RateLimited(requests = 10, duration = 1, unit = MINUTES)
    public class AuthController {
      private final AuthService authService;
      
      @PostMapping('/login')
      public ResponseEntity<TokenResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.authenticate(request));
      }
    }
  ";
  
  @validates JWTConstraint;
  @validates RateLimitConstraint;
}
```

---

## 3. Type System

### 3.1 Property Type Rules

Each node type has a defined schema of required and optional properties. The following rules define the type system:

#### Rule — Required Properties

| Property | Type | Allowed Values |
|----------|------|---------------|
| `name` | string | Any non-empty string |
| `scope` | scope_list | ≥ 1 valid scope values |
| `priority` | priority | One of 5 priority keywords |
| `directive` | string | Non-empty string |
| `enforcement` | enforcement | strict \| advisory \| automated |

#### Constraint — Required Properties

| Property | Type | Allowed Values |
|----------|------|---------------|
| `name` | string | Non-empty |
| `scope` | scope_list | ≥ 1 |
| `priority` | priority | Required |
| `constraintType` | string | Technical \| Security \| Architectural \| Process |
| `directive` | string | Non-empty |
| `impact` | impact | Required |
| `enforcement` | enforcement | Required |

#### Pattern — Required Properties

| Property | Type | Allowed Values |
|----------|------|---------------|
| `name` | string | Non-empty |
| `scope` | scope_list | ≥ 1 |
| `priority` | priority | Required |
| `patternType` | string | Design \| Architectural \| Behavioral |
| `applicability` | string | When: condition |
| `structure` | string | Structural template |

#### Capability — Required Properties

| Property | Type | Allowed Values |
|----------|------|---------------|
| `name` | string | Non-empty |
| `scope` | scope_list | ≥ 1 |
| `description` | string | Non-empty |

And must contain at least one `composed-of` block.

### 3.2 Subtyping Rules

KDL does not support structural subtyping between node types. A `constraint` cannot be used where a `rule` is expected. However, `edge_type` declarations are not validated for target node type — the ontology validator (P4) performs type-checking on edges after compilation.

### 3.3 Reference Resolution

References in KDL are resolved in three stages:

1. **Local:** `Identifier` → node defined in the same file
2. **Module:** `alias.Identifier` → node defined in an imported module, accessed via its alias
3. **Unresolved:** If a reference cannot be resolved in stages 1–2, a compilation warning `KDL-W001: UnresolvedReference` is emitted. Unresolved references are not compiled as edges.

---

## 4. Semantic Rules

Semantic rules define validity beyond the grammar. A KDL file is *semantically valid* if it satisfies all of the following:

### SR-1: Unique Identifiers
All node identifiers within a module must be unique. Two nodes in the same file cannot have the same identifier.

### SR-2: Valid Edge Types
All edge type keywords must be one of the 14 LAS-003 EdgeTypes. Custom edge types are not permitted in KDL 0.1.

### SR-3: Self-Reference Prevention
A node cannot reference itself in any edge block.

### SR-4: Circular Module Import Prevention
Module imports must form a DAG. Circular imports (`A imports B, B imports A`) are a compile error `KDL-E002: CircularImport`.

### SR-5: Priority-Scope Consistency
A node with `priority: mandatory` must have a non-empty `scope` that is not solely `cross-cutting` unless the node explicitly documents its cross-cutting applicability.

### SR-6: Conflict Declaration Symmetry
If node `A` declares `conflicts-with { B; }`, the compiler automatically adds a `conflicts-with` edge from `B` to `A`. Manual symmetry declaration is not required.

### SR-7: Property Value Constraints
- `version` values must satisfy SemVer 2.0.0 format
- `metric.value` must be a non-negative float
- `metric.operator` must be one of: `>=`, `<=`, `=`, `>`, `<`
- `metric.unit` is a free-form string

---

## 5. Module System

### 5.1 Module Declaration

Every KDL file must begin with a module declaration:

```kdl
module "org-name/module-name";
version "1.0.0";
```

The module name is a forward-slash-separated path. The first segment is conventionally the organization or team name. The second segment is the module topic.

### 5.2 Module Resolution

The compiler resolves imported modules by searching in the following order:

1. **Local path:** Relative to the importing file's directory
2. **Source directories:** As configured in `CompilerConfig.sourceDirectories`
3. **Registry:** A future remote registry (not yet defined — reserved for v0.2)

### 5.3 Standard Library

The Aether standard library (`@aether/stdlib`) provides pre-built knowledge packs for common engineering patterns:

| Module | Contents |
|--------|----------|
| `@aether/stdlib/patterns` | Repository, Service Layer, DTO, Factory, Observer, Strategy patterns |
| `@aether/stdlib/security` | OWASP Top 10 constraints, JWT guidelines, input validation rules |
| `@aether/stdlib/testing` | TDD rules, coverage gate templates, test naming conventions |
| `@aether/stdlib/api` | REST convention rules, OpenAPI contract patterns |
| `@aether/stdlib/logging` | Structured logging rules, audit logging patterns |

Usage:
```kdl
imports "@aether/stdlib/patterns" as patterns;
imports "@aether/stdlib/security" as security;
```

---

## 6. Operational Semantics

### 6.1 Compilation of a KDL File

Compiling a KDL file `f` produces a `DocumentAST` that is identical in structure to what the Markdown parser (P1) produces from a well-structured markdown file. This ensures KDL and markdown sources are interchangeable downstream.

```
COMPILE_KDL(file f):
  1. Lex f → TokenStream
  2. Parse TokenStream → KDLDocument (per grammar in §2.2)
  3. Validate semantic rules SR-1 through SR-7
  4. Resolve references (local → module)
  5. Transform KDLDocument → DocumentAST:
       - Each node_def → DocumentAST.section with AST.block
       - Each property → block property
       - Each edge_block → block relationship
  6. Assign confidence = 1.0 to all extracted nodes (KDL is authoritative)
  7. RETURN DocumentAST
```

### 6.2 KDL → Typed Nodes (P2/P4 bypass)

Because KDL is explicitly typed, the Knowledge Extractor (P2) and Ontology Mapper (P4) apply differently to KDL-sourced DocumentASTs:

- **P2:** No heuristic extraction needed. Each `node_def` maps directly to a `RawKnowledgeNode` with confidence 1.0 and the declared type.
- **P4:** No type fuzzy-resolution needed. Types are already canonical. Only schema property validation is performed.

---

## 7. Error and Warning Catalog

### Errors (compilation fails)

| Code | Name | Description |
|------|------|-------------|
| `KDL-E001` | ParseError | File does not conform to grammar |
| `KDL-E002` | CircularImport | Module import cycle detected |
| `KDL-E003` | DuplicateIdentifier | Two nodes have the same identifier in one module |
| `KDL-E004` | UnknownNodeType | Node type keyword is not in NodeTypes |
| `KDL-E005` | MissingRequiredProperty | A required property is absent |
| `KDL-E006` | InvalidPropertyType | Property value does not match expected type |
| `KDL-E007` | UnknownEdgeType` | Edge type keyword is not in EdgeTypes |
| `KDL-E008` | SelfReference | Node references itself in an edge block |

### Warnings (compilation continues)

| Code | Name | Description |
|------|------|-------------|
| `KDL-W001` | UnresolvedReference | Reference target not found in local or imported modules |
| `KDL-W002` | MissingDescription | Node has no `description` property |
| `KDL-W003` | NoVerification | Mandatory constraint has no `verification` property |
| `KDL-W004` | DeprecatedNodeUsed | An edge target references a Deprecated node |
| `KDL-W005` | MandatoryWithNoGate | Mandatory rule or constraint has no associated quality-gate |
| `KDL-W006` | EmptyCapability` | Capability has no `composed-of` members |

### Informational

| Code | Name | Description |
|------|------|-------------|
| `KDL-I001` | SymmetricConflict | Symmetric `conflicts-with` edge auto-added |
| `KDL-I002` | ModuleLoaded | Module import successfully resolved |

---

## 8. KDL vs. Markdown: When to Use Which

| Situation | Recommended Format |
|-----------|-------------------|
| Authoring new rules/constraints natively | **KDL** — maximum precision, confidence 1.0 |
| Migrating existing documentation | **Markdown** — compiler extracts with confidence scoring |
| Defining capability packs for team use | **KDL** — modules are versioned and importable |
| One-off notes and rationale | **Markdown** — prose is acceptable |
| API contracts (OpenAPI, AsyncAPI) | **YAML** — native format, compiler understands it |
| Quick knowledge capture | **Markdown** — lower friction |
| Enterprise-grade constraint libraries | **KDL** — required for strict compliance scenarios |

---

## 9. Language Server Protocol (LSP) Specification

A KDL Language Server should provide the following capabilities for IDE integration:

| Capability | Description |
|-----------|-------------|
| `textDocument/diagnostics` | Emit KDL-E* and KDL-W* diagnostics on file change |
| `textDocument/completion` | Complete node types, edge types, scope keywords, priority keywords |
| `textDocument/hover` | Show node type schema on hover over a node_def |
| `textDocument/definition` | Go-to-definition for references (local and imported modules) |
| `textDocument/references` | Find all files that import a given module |
| `textDocument/rename` | Rename a node identifier across all referencing files |
| `textDocument/formatting` | Auto-format KDL file (indent, spacing) |
| `textDocument/codeAction` | Quick-fix for common warnings (add missing description, add verification) |
| `workspace/symbol` | Search for node identifiers across all KDL files in workspace |

---

## 10. Future Directions (KDL v0.2+)

The following features are explicitly deferred to future versions:

| Feature | Rationale for Deferral |
|---------|----------------------|
| Generic node templates | Adds complexity to the type system — needs formal subtyping theory |
| Conditional properties (`if scope == security then ...`) | Requires conditional semantics in the type system |
| Remote module registry | Infrastructure concern — needs a separate service |
| Computed properties (`coverage >= threshold where threshold = config.minCoverage`) | Requires runtime evaluation — not part of the compile-time type system |
| Custom edge types | Risk of ontology fragmentation — deferred until community conventions emerge |
| Node inheritance (`extends NodeIdentifier`) | Requires formal subtyping rules — complex interaction with conflict detection |
