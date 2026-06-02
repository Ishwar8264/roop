# Auth Schema Creation — Task Record

## Task: Create NEW Prisma auth schema file

### What was done:
- Created `/home/z/my-project/prisma/schema-auth.prisma` with auth-only models
- Did NOT modify the existing `schema.prisma` (as instructed)

### Models created (5 total):

1. **User** (`users` table) — Core user model with phone + email, phoneVerified field, nullable password
2. **Account** (`accounts` table) — Multi-provider account linking (NextAuth adapter pattern)
3. **Session** (`sessions` table) — Device-tracked sessions with full fingerprinting + geo
4. **VerificationToken** (`verification_tokens` table) — Unified OTP + Magic Link + Password Reset
5. **AuthEvent** (`auth_events` table) — Audit trail with expanded event types

### Enums created (4 total):

1. **AuthProvider** — MOBILE, EMAIL, GOOGLE
2. **UserRole** — GUEST, USER, STAFF, ADMIN
3. **VerificationType** — PHONE_OTP, EMAIL_OTP, EMAIL_MAGIC_LINK, PASSWORD_RESET
4. **AuthEventType** — 16 event types (expanded from 10 in v1)

### Key design decisions vs v1 (existing schema.prisma):

| Aspect | v1 (schema.prisma) | v2 (schema-auth.prisma) |
|--------|-------------------|------------------------|
| Phone field | `mobile` (name) | `phone` (more universal) |
| Phone verification | ❌ No field | ✅ `phoneVerified` added |
| Multi-provider | `googleId` on User | Separate `Account` model |
| Auth provider | `authProvider` on User | Derived from Account records |
| Sessions | `AuthSession` (minimal) | `Session` (full device + geo) |
| OTP | `AuthOtp` (mobile only) | `VerificationToken` (email + phone + magic link + password reset) |
| Auth events | `AuthEvent` (10 types) | `AuthEvent` (16 types, `identifier` replaces `mobile`) |

### Next steps (merge):
- Replace User, AuthSession, AuthOtp, AuthEvent in schema.prisma
- Add Account, Session, VerificationToken models
- Update AuthProvider, AuthEventType enums; remove AuthOtpPurpose enum
- Add UserRole if not already present
- Update relations in other models (Booking, Review, etc.) to point to new User
- Run `bun run db:push` to apply
