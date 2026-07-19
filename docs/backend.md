# Rule: Fastify API Gateway
- Scope: Backend, Gateway
- Priority: Mandatory
- Directive: All new backend services must use Fastify as the primary API Gateway due to its performance benefits. Legacy Express routes should be migrated when touched.
- Category: Architecture
- Enforcement: Strict
- Rationale: Fastify offers higher throughput and lower overhead compared to Express.

# Constraint: Express Middleware Compatibility
- Scope: Backend, Middleware
- Priority: Mandatory
- Directive: If using Express middleware in Fastify, you must use the `@fastify/express` plugin to ensure compatibility.
- ConstraintType: Integration
- Verification: Dependency check for @fastify/express
- Impact: High
- Enforcement: automated

# Pattern: Thin Controllers
- Scope: Backend, Controllers
- Priority: Recommended
- Directive: Controllers should only handle HTTP request/response mapping and validation. All business logic must reside in the Service layer.
- PatternType: Architecture
- Structure: Controller -> Service
- Rationale: Promotes separation of concerns and testability.

# Rule: Asynchronous Error Handling
- Scope: Backend, ErrorHandling
- Priority: Mandatory
- Directive: Do not use try/catch in every route handler. Use a centralized error handling middleware to catch unhandled promise rejections.
- Category: Stability
- Enforcement: automated
- Rationale: Prevents memory leaks and ensures consistent error responses.
