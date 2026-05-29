---
Task ID: 1
Agent: main
Task: Fix Swagger UI + Verify all 3 auth methods working

Work Log:
- Diagnosed Swagger UI failing with `adapterFn is not a function` error (swagger-ui-react incompatible with React 19)
- Uninstalled `swagger-ui-react`, `swagger-ui-dist`, `@types/swagger-ui-react`
- Installed `@scalar/api-reference-react` as modern replacement
- Rewrote `/api-docs/page.tsx` using Scalar web component approach with dynamic import
- Added spinner animation keyframe to `globals.css`
- Added `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `.env` and `.env.example`
- Verified build passes successfully
- Tested all auth endpoints via curl

Stage Summary:
- Swagger UI replaced with Scalar API Reference (React 19 compatible)
- All 3 auth methods fully implemented and tested
- All auth data properly saves to PostgreSQL via Prisma
- 8 API endpoints documented in OpenAPI spec
