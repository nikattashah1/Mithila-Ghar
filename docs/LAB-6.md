# LAB 6 — SECURITY

## Objective
To identify, mitigate, and test against common security vulnerabilities in full-stack e-commerce architecture.

## Requirements
- Password Hashing.
- JWT Session Authentication.
- Route Authorization (Customer vs Admin).
- General hardening (CORS, Rate Limiting, Input Validation).
- Audit Logging.

## Tools
- bcryptjs
- jsonwebtoken
- helmet
- express-rate-limit
- express-mongo-sanitize

## Implementation & Procedure
1. Implemented `Helmet` inside `app.js` to set secure HTTP headers (CSP, HSTS).
2. Placed strict rate limiting specifically on the `/api/auth/login` and `/api/wallet/transfer` endpoints to prevent brute forcing.
3. Utilized `bcryptjs` before updating/creating User passwords.
4. JWT is used for Stateless Authentication instead of Cookies for scalable front-end segregation. The backend verifies this using a bearer auth middleware.
5. Critical actions trigger writes to the `AuditLog` collection, storing information securely without leaking PCI boundaries.
6. Server-side validations ensure final cart prices cannot be tampered with through browser DOM manipulation.

*(Insert Screenshots Here: Unauthorized Access Redirects, Rate Limit Warning, Postman Validation Errors, Helmet headers, Audit Log DB records)*

## Result
The platform resists XSS, NoSQL injections, Parameter pollution, and brute-force cracking attempts by default.

## Conclusion
Security must be layered across the Application, Network, and Database scopes. Proper initialization of `Helmet` and server-side strict validations provide a hardened system immune to common OWASP top 10 vulnerabilities.
