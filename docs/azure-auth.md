# Rule: Azure AD B2C Integration
- Scope: Security, Identity
- Priority: Mandatory
- Directive: All user authentication and identity management must be handled by Azure AD B2C. Local user databases for passwords are strictly prohibited.
- Category: Security
- Enforcement: Strict
- Rationale: Centralizes identity management and delegates security compliance to Microsoft.

# Constraint: MSAL React Usage
- Scope: Frontend, Security
- Priority: Mandatory
- Directive: The frontend React app must use the `@azure/msal-react` and `@azure/msal-browser` libraries for integrating with Azure AD B2C.
- ConstraintType: Dependency
- Verification: package.json dependency check
- Impact: High
- Enforcement: automated

# Pattern: Token Validation Middleware
- Scope: Backend, Security
- Priority: Mandatory
- Directive: Backend services must validate the Azure AD B2C JWT token signature using the Microsoft Identity platform public keys (JWKS) before processing any protected route.
- PatternType: Security
- Structure: Request -> JWKS Validation Middleware -> Controller
- Rationale: Ensures tokens are not forged and are issued by our specific B2C tenant.

# Rule: Secure Token Storage
- Scope: Frontend, Security
- Priority: Mandatory
- Directive: Never store JWT tokens in `localStorage`. Configure MSAL to use `sessionStorage` or secure HttpOnly cookies for token persistence.
- Category: Security
- Enforcement: Strict
- Rationale: Mitigates XSS (Cross-Site Scripting) attacks extracting access tokens.
