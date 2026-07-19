# Contributing to Project Aether

Thank you for your interest in contributing! This document provides guidelines for contributing to the Project Aether monorepo.

---

## Table of Contents

- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Commit Convention](#commit-convention)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Pull Requests](#pull-requests)
- [Versioning](#versioning)

---

## Development Setup

**Prerequisites:** Node.js ≥ 20, npm ≥ 10

```bash
# Clone the repository
git clone https://github.com/hacktronaut/project-aether.git
cd project-aether

# Install all dependencies (workspaces included)
npm install

# Build all packages
npm run build

# Run all tests
npm test

# Type-check all packages
npm run typecheck

# Lint
npm run lint
```

---

## Project Structure

```
packages/
├── core/      @aether/core      — Knowledge Compiler, Graph, CEC, Runtime
├── kdl/       @aether/kdl       — Knowledge Definition Language parser
├── adapters/  @aether/adapters  — Model Adapters (OpenAI, Anthropic, MCP)
└── cli/       @aether/cli       — CLI tool and REST API server

research-artifacts/
└── specifications/              — All 10 LAS design specifications
```

---

## Commit Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/).

```
<type>(<scope>): <short description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat` — new feature
- `fix` — bug fix
- `docs` — documentation only
- `refactor` — code change without feature/fix
- `test` — tests only
- `chore` — tooling, configuration, dependencies
- `ci` — CI/CD changes
- `perf` — performance improvement

**Scopes:** `core`, `kdl`, `adapters`, `cli`, `specs`, `config`

**Examples:**
```
feat(core): implement P1 document parser using unified
fix(cli): correct --output flag handling in compile command
docs(specs): add formal proofs to LAS-002 knowledge theory
test(core): add unit tests for O4 context compression pass
```

Commits that don't follow this convention will be rejected by `commitlint`.

---

## Making Changes

1. **Read the relevant LAS specification** before implementing any component (e.g., read LAS-005 before implementing a compiler pass)
2. **Follow the Interface-First pattern** — define types in `types.ts` before implementing in `*.ts`
3. **Return `Result` objects** from public API methods — do not throw unless it is a programming error
4. **Use dependency injection** — no global singletons
5. **Add JSDoc** to all exported functions, types, and classes

---

## Testing

- All new code requires tests
- Unit tests live in `packages/<pkg>/tests/unit/`
- Integration tests live in `packages/<pkg>/tests/integration/`
- Test fixtures live in `packages/<pkg>/tests/fixtures/`
- Aim for ≥ 80% line coverage on the `src/` of each package

```bash
# Run tests for a specific package
npm test --workspace=packages/core

# Run tests in watch mode
npm run test:watch --workspace=packages/core

# Run with coverage
npm run test:coverage --workspace=packages/core
```

---

## Pull Requests

- PRs must pass all CI checks (build, typecheck, lint, tests)
- PRs must reference the relevant LAS specification in the description
- Breaking changes require a `BREAKING CHANGE:` footer in the commit body
- Keep PRs focused — one feature or fix per PR

---

## Versioning

Project Aether uses [Changesets](https://github.com/changesets/changesets) for versioning.

When your PR introduces a user-facing change:

```bash
# Create a changeset describing your change
npm run changeset

# Follow the interactive prompts to select:
# - Which packages are affected
# - Whether it's a patch, minor, or major change
# - A description of the change
```

The changeset file (`.changeset/*.md`) should be committed with your PR. Version bumps and CHANGELOG entries are generated automatically during release.
