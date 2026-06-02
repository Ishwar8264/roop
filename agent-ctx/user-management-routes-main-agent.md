# Task: Build ALL User Management API Routes

## Agent: Main Agent
## Status: COMPLETED

## Summary

Created all 10 user management API route files (feature routes + re-exports) for the Nikharta Roop project.

## Schema Changes

- Added `PASSWORD_CHANGED` and `ACCOUNT_DEACTIVATED` to `AuthEventType` enum in `prisma/schema.prisma`
- Added matching types in `src/shared/types/enums.ts`
- Ran `bun run db:push` to sync the database

## Files Created (20 total)

### Feature Routes (10 files)

1. **`src/features/user/api/forgot-password/route.ts`** — POST /api/auth/forgot-password
   - Uses `createApiHandler` with `forgotPasswordSchema`
   - Generates reset token via `generateMagicLinkToken()`, hashes with `hashOtp()`, stores in VerificationToken table
   - Invalidates previous unused PASSWORD_RESET tokens
   - Always returns success (no email enumeration)
   - Logs `PASSWORD_RESET_REQUESTED` event

2. **`src/features/user/api/reset-password/route.ts`** — POST /api/auth/reset-password
   - Uses `createApiHandler` with `resetPasswordSchema`
   - Matches token via `verifyOtpHash()` against all unused PASSWORD_RESET tokens
   - Handles expired tokens with `AuthPasswordResetExpiredError`
   - Hashes new password, updates user, revokes ALL sessions
   - Logs `PASSWORD_RESET_COMPLETED` event

3. **`src/features/user/api/change-password/route.ts`** — POST /api/auth/change-password
   - Uses `createApiHandler` with `changePasswordSchema`
   - Requires auth via `requireAuthWithSession`
   - Verifies current password with `verifyPasswordHash()`
   - Revoke all OTHER sessions (keeps current session alive)
   - Logs `PASSWORD_CHANGED` event

4. **`src/features/user/api/profile/route.ts`** — PATCH /api/user/profile
   - Custom PATCH handler (not `createApiHandler`)
   - Requires auth via `requireAuthWithSession`
   - Checks email/phone uniqueness before update
   - Sets `emailVerified=false` / `phoneVerified=false` on change
   - Returns updated user via `getUserWithProviders()`

5. **`src/features/user/api/avatar/route.ts`** — POST /api/user/avatar
   - Custom handler (reads formData, not JSON)
   - Validates file type (JPEG/PNG/WebP) and size (max 5MB)
   - Saves to `/public/uploads/avatars/{userId}.{ext}`
   - Updates user's `avatarUrl` in DB

6. **`src/features/user/api/verify-email/route.ts`** — POST /api/user/verify-email
   - Uses `createApiHandler` with `resendVerificationSchema`
   - Generates 6-digit OTP, hashes with `hashOtp()`
   - Stores in VerificationToken table with type EMAIL_OTP, 10 min expiry
   - Invalidates previous unused EMAIL_OTP tokens
   - Email sending stubbed with console.log

7. **`src/features/user/api/verify-email/confirm/route.ts`** — POST /api/user/verify-email/confirm
   - Uses `createApiHandler` with `verifyEmailOtpSchema`
   - Finds unused EMAIL_OTP tokens, verifies with `verifyOtpHash()`
   - Marks token as used, sets `emailVerified=true`

8. **`src/features/user/api/change-phone/route.ts`** — POST /api/user/change-phone
   - Uses `createApiHandler` with `changePhoneSchema`
   - Checks new phone uniqueness
   - Sends OTP via `storeOtp()` (Redis-based rate limiting)
   - Stores pending change in Redis key `phone_change:{userId}`, TTL 5 min

9. **`src/features/user/api/change-phone/verify/route.ts`** — POST /api/user/change-phone/verify
   - Uses `createApiHandler` with `verifyChangePhoneSchema`
   - Checks Redis for pending phone change
   - Verifies OTP via `verifyStoredOtp()`
   - Updates user phone, sets `phoneVerified=true`, deletes Redis key

10. **`src/features/user/api/deactivate/route.ts`** — POST /api/user/deactivate
    - Custom handler (needs to set cookie on response)
    - Requires auth via `requireAuthWithSession`
    - Sets `isActive=false` on user
    - Revokes ALL sessions, clears refresh token cookie
    - Logs `ACCOUNT_DEACTIVATED` event

### Re-export Routes (10 files)

All one-liner re-exports following the pattern:
```typescript
export { POST } from "@/features/user/api/{endpoint}/route";
// or for profile:
export { PATCH } from "@/features/user/api/profile/route";
```

- `src/app/api/auth/forgot-password/route.ts`
- `src/app/api/auth/reset-password/route.ts`
- `src/app/api/auth/change-password/route.ts`
- `src/app/api/user/profile/route.ts`
- `src/app/api/user/avatar/route.ts`
- `src/app/api/user/verify-email/route.ts`
- `src/app/api/user/verify-email/confirm/route.ts`
- `src/app/api/user/change-phone/route.ts`
- `src/app/api/user/change-phone/verify/route.ts`
- `src/app/api/user/deactivate/route.ts`

## Lint Results

All new files pass lint cleanly. Pre-existing lint errors in other files (api-docs, carousel, use-mobile) are unrelated.

## Key Design Decisions

1. **`createApiHandler`** used for standard JSON body POST routes (7 routes)
2. **Custom handlers** used for PATCH, formData, and cookie-setting routes (3 routes)
3. Password hash stored on `User.password` (matches existing login-email pattern)
4. All error handling follows the existing `AppError` pattern with `isAppError`/`toAppError`
5. Redis key `phone_change:{userId}` used for pending phone change tracking
