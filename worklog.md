---
Task ID: 1
Agent: main
Task: Fix Swagger UI "Failed to load API definition" error

Work Log:
- Diagnosed root cause: dangerouslySetInnerHTML in the old page.tsx doesn't execute script tags — SwaggerUIBundle never initialized
- Rewrote /src/app/api-docs/page.tsx as a proper "use client" component with useEffect
- New approach: dynamically loads Swagger UI CSS + JS from unpkg CDN via DOM script injection
- Initialized SwaggerUIBundle in useEffect callback after scripts load
- Added error fallback UI (Hindi message + direct /api/api-spec link)
- Added loading state indicator
- Verified: API spec endpoint returns valid OpenAPI 3.0.3 JSON with all 5 auth endpoints
- Verified: Swagger UI page returns HTTP 200 with correct client component structure

Stage Summary:
- Swagger UI fixed — now uses proper client component instead of dangerouslySetInnerHTML
- All 5 Auth API endpoints documented: POST send-otp, POST verify-otp, POST refresh, GET me, POST logout
- 11 schemas defined: SendOtpRequest, VerifyOtpRequest, RefreshTokenRequest, SendOtpResponse, VerifyOtpResponse, RefreshTokenResponse, MeResponse, LogoutResponse, ErrorResponse, UserBasic, UserProfile
- BearerAuth security scheme configured for protected endpoints (me, logout)
