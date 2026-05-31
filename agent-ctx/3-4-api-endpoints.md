# Task 3-4: Branch + Holidays & User Profile API Endpoints

## Work Summary

Built all 7 API route files and 2 validation schema modules for the Nikharta Roop beauty parlour booking platform.

### Feature 1: Branch + Holidays (4 route files)

**Validation schemas** (`src/lib/validations/branches/index.ts`):
- `createBranchSchema` — nameHi, nameEn, city, address, googleMapsUrl (opt), phone (10 digits), openTime (HH:MM), closeTime (HH:MM)
- `updateBranchSchema` — all partial of create
- `listBranchesQuerySchema` — city (opt), isActive (opt), page, pageSize
- `createHolidaySchema` — date (YYYY-MM-DD), reasonHi, reasonEn (opt)

**Route files:**
1. `src/app/api/branches/route.ts` — GET (public, paginated), POST (admin, create branch)
2. `src/app/api/branches/[id]/route.ts` — GET (public, detail with holidays), PATCH (admin, update), DELETE (admin, soft-delete)
3. `src/app/api/branches/[id]/holidays/route.ts` — GET (public, list holidays), POST (admin, add holiday with duplicate check)
4. `src/app/api/branches/[id]/holidays/[hid]/route.ts` — DELETE (admin, remove holiday)

### Feature 2: User Profile (3 route files)

**Validation schemas** (`src/lib/validations/users/index.ts`):
- `updateProfileSchema` — name (opt), email (opt), avatarUrl (opt)
- `changePasswordSchema` — currentPassword, newPassword (with password rules, refine to ensure different)
- `adminUpdateUserSchema` — name, email, role, isActive, branchId (all optional)

**Route files:**
1. `src/app/api/users/me/route.ts` — GET (own profile), PATCH (update own profile with email uniqueness check)
2. `src/app/api/users/me/password/route.ts` — PATCH (change password with bcryptjs verify + hash)
3. `src/app/api/users/[id]/route.ts` — GET (admin, any user), PATCH (admin, update any user with branch existence check)

### Key patterns followed:
- All routes use `createApiHandler` from `@/lib/api-handler`
- All auth uses `requireActiveUser` from `@/lib/auth-helpers`
- Admin checks: `if (user.role !== "ADMIN") throw new AdminRequiredError()`
- URL ID extraction: `new URL(request.url).pathname.split("/")`
- Soft deletes: `isActive: false` instead of actual delete
- Public GET endpoints: no auth required
- Decimal serialization: `.toString()` on all Decimal fields
- Time fields serialized to HH:MM format
- Date fields serialized to YYYY-MM-DD format
- Paginated lists return `{ items, pagination: { page, pageSize, total, totalPages } }`
- Barrel export updated in `src/lib/validations/index.ts`

### Lint result: Clean — no errors
