# Rule: JWT Authentication
- Scope: Backend, Security
- Priority: Mandatory
- Directive: All authentication endpoints must use JWT. Do not use session cookie auth or basic auth.
- Category: Security
- Enforcement: Strict
- Rationale: Simplifies horizontal scaling and stateless API execution.

# Constraint: Token expiration
- Scope: Backend, Security
- Priority: Mandatory
- Directive: JWT tokens must have an expiration window of exactly 15 minutes.
- ConstraintType: Security
- Verification: JwtServiceTest checks token payload exp claim
- Impact: Critical
- Enforcement: automated

# Pattern: Repository pattern
- Scope: Backend, DataAccess
- Priority: Recommended
- Directive: Use Repository Pattern to abstract data access layer.
- PatternType: Design
- Structure: Controller -> Service -> Repository -> Database
- Rationale: Allows mocking database during unit testing.
