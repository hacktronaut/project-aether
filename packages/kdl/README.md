# @aether/kdl

> Knowledge Definition Language (KDL) parser and validator for Project Aether.

[![npm version](https://img.shields.io/npm/v/@aether/kdl)](https://www.npmjs.com/package/@aether/kdl)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](../../LICENSE)

---

## What is KDL?

KDL is the native, structured source language for authoring enterprise engineering knowledge. While the Aether compiler can extract knowledge from markdown, KDL provides:

- **Explicit typing** — node types are declared, not inferred
- **100% extraction confidence** — no heuristic matching
- **Module system** — import/export knowledge packs
- **LSP support** — IDE validation, completion, and go-to-definition

See the [full KDL specification (LAS-004)](../../research-artifacts/specifications/LAS-004-knowledge-definition-language.md).

---

## Example

```kdl
module "my-org/auth-standards";
version "1.0.0";

constraint JWTRequired {
  name: "JWT Authentication Requirement";
  scope: [backend, security];
  priority: mandatory;
  directive: "All authentication endpoints MUST use JWT. Basic Auth and session auth are forbidden.";
  impact: critical;
  enforcement: strict;
}
```

---

## Status

🚧 In active development.
