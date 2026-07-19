# Rule: Functional Components
- Scope: Frontend, React
- Priority: Mandatory
- Directive: All React components must be written as Functional Components using Hooks. Class components are strictly prohibited.
- Category: CodingStandard
- Enforcement: automated via ESLint (react/prefer-stateless-function)
- Rationale: Hooks provide better logic reuse and simpler mental models.

# Pattern: Custom Hooks for Data Fetching
- Scope: Frontend, React, Data
- Priority: Recommended
- Directive: Abstract all API calls and data fetching logic into custom hooks (e.g., `useUser()`, `useAuth()`) rather than fetching directly inside UI components.
- PatternType: Architecture
- Structure: UI Component -> Custom Hook -> API Service
- Rationale: Separates presentation from data fetching logic.

# Constraint: State Management
- Scope: Frontend, State
- Priority: Mandatory
- Directive: Global state should be managed via React Context for low-frequency updates, and Zustand for high-frequency updates. Redux is deprecated.
- ConstraintType: Architecture
- Verification: Disallow redux imports
- Impact: Medium
- Enforcement: automated

# Rule: Strict TypeScript Interfaces
- Scope: Frontend, TypeScript
- Priority: Mandatory
- Directive: Every component must define a strict `Props` interface. Do not use `any` or `Record<string, unknown>` for props.
- Category: Typing
- Enforcement: Strict
- Rationale: Catches runtime errors at compile time and improves IDE autocompletion.
